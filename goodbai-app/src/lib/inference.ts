/**
 * ONNX-based audio inference engine for AI music detection.
 * Ported from the Spot-if-AI Chrome extension's infer_engine.ts.
 *
 * Uses the SONICS model (awsaf49/sonics-spectttra-alpha-5s) converted to ONNX.
 * Input: 5 seconds of 44.1kHz mono audio → Output: probability [0–1] that the track is AI-generated.
 */

const SAMPLING_RATE = 44100;
const MAX_TIME = 5; // seconds
const TARGET_LENGTH = SAMPLING_RATE * MAX_TIME; // 220,500 samples

// Model URL: defaults to local file, can be overridden to an external CDN (e.g. HuggingFace)
const MODEL_URL =
  process.env.NEXT_PUBLIC_ONNX_MODEL_URL || "/models/sonics_model.onnx";

/**
 * Extracts the middle chunk of a waveform.
 * If the waveform is shorter than targetLength, zero-pads it.
 */
export function extractMiddleChunk(
  waveform: Float32Array,
  targetLength: number = TARGET_LENGTH
): Float32Array {
  if (waveform.length <= targetLength) {
    const padded = new Float32Array(targetLength);
    const offset = Math.floor((targetLength - waveform.length) / 2);
    padded.set(waveform, offset);
    return padded;
  }

  const start = Math.floor((waveform.length - targetLength) / 2);
  return waveform.slice(start, start + targetLength);
}

/**
 * Fetches an audio file and decodes it to a mono waveform at 44.1kHz.
 * Uses the Web Audio API's AudioContext for decoding.
 */
export async function fetchAudioWaveform(
  url: string
): Promise<Float32Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  // Use OfflineAudioContext for decoding (works in main thread and web workers with polyfill)
  const audioContext = new AudioContext({ sampleRate: SAMPLING_RATE });
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Convert to mono by averaging channels
    if (audioBuffer.numberOfChannels === 1) {
      return audioBuffer.getChannelData(0);
    }

    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    const mono = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      mono[i] = (left[i] + right[i]) / 2;
    }
    return mono;
  } finally {
    await audioContext.close();
  }
}

/**
 * InferenceEngine manages the ONNX Runtime session and runs predictions.
 *
 * Usage:
 *   const engine = new InferenceEngine();
 *   const probability = await engine.predict(audioWaveform);
 */
export class InferenceEngine {
  private session: import("onnxruntime-web").InferenceSession | null = null;
  private sessionPromise: Promise<import("onnxruntime-web").InferenceSession> | null = null;
  private queue: Promise<void> = Promise.resolve();

  /**
   * Lazily initializes the ONNX session.
   */
  private async getSession(): Promise<import("onnxruntime-web").InferenceSession> {
    if (this.session) return this.session;

    if (!this.sessionPromise) {
      this.sessionPromise = (async () => {
        const ort = await import("onnxruntime-web");

        // Configure WASM backend
        ort.env.wasm.numThreads = 1;

        const session = await ort.InferenceSession.create(
          MODEL_URL,
          {
            executionProviders: ["wasm"],
            graphOptimizationLevel: "all",
          }
        );

        this.session = session;
        return session;
      })();
    }

    return this.sessionPromise;
  }

  /**
   * Run inference on a raw audio waveform.
   * Extracts the middle 5-second chunk and returns the AI probability.
   *
   * @param audioData - Raw mono audio at 44.1kHz
   * @returns Probability [0–1] that the audio is AI-generated
   */
  async predict(audioData: Float32Array): Promise<number> {
    // Queue inference calls to prevent concurrent ONNX execution
    return new Promise<number>((resolve, reject) => {
      this.queue = this.queue.then(async () => {
        try {
          const session = await this.getSession();
          const ort = await import("onnxruntime-web");

          const chunk = extractMiddleChunk(audioData);
          const tensor = new ort.Tensor("float32", chunk, [1, TARGET_LENGTH]);
          const results = await session.run({ audio: tensor });
          const prob = (results.prob as import("onnxruntime-web").Tensor).data[0] as number;

          resolve(prob);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  /**
   * Check if the model is loaded and ready.
   */
  isReady(): boolean {
    return this.session !== null;
  }

  /**
   * Preload the model without running inference.
   */
  async warmup(): Promise<void> {
    await this.getSession();
  }
}

// Singleton for client-side use
let _engine: InferenceEngine | null = null;

export function getInferenceEngine(): InferenceEngine {
  if (!_engine) {
    _engine = new InferenceEngine();
  }
  return _engine;
}
