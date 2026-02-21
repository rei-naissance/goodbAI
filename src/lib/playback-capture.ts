/**
 * Spotify Web Playback SDK integration.
 *
 * Captures audio from Spotify playback for ONNX analysis.
 * Requires Spotify Premium.
 *
 * How it works:
 * 1. Initialize the Web Playback SDK player
 * 2. Play the target track for ~5 seconds
 * 3. Capture audio via MediaStream / Web Audio API
 * 4. Return the waveform for inference
 */

const CAPTURE_DURATION_MS = 6000; // Capture 6 seconds (model needs 5)
const SAMPLING_RATE = 44100;

// SDK script loader
let sdkLoadPromise: Promise<void> | null = null;

function loadSpotifySDK(): Promise<void> {
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Web Playback SDK requires a browser environment"));
      return;
    }

    // If already loaded
    if ((window as unknown as Record<string, unknown>).Spotify) {
      resolve();
      return;
    }

    // The SDK calls this global callback when ready
    (window as unknown as Record<string, () => void>).onSpotifyWebPlaybackSDKReady = () => {
      resolve();
    };

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.onerror = () => reject(new Error("Failed to load Spotify Web Playback SDK"));
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

// Minimal type definitions for the SDK
interface SpotifyPlayerOptions {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume?: number;
}

interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: string, callback: (...args: unknown[]) => void): void;
  removeListener(event: string, callback?: (...args: unknown[]) => void): void;
  getCurrentState(): Promise<unknown | null>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  togglePlay(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  activateElement(): Promise<void>;
  _options: { getOAuthToken: (cb: (token: string) => void) => void };
}

interface SpotifyNamespace {
  Player: new (options: SpotifyPlayerOptions) => SpotifyPlayer;
}

/**
 * Manages a hidden Spotify Web Playback SDK player for audio capture.
 */
export class SpotifyPlaybackCapture {
  private player: SpotifyPlayer | null = null;
  private deviceId: string | null = null;
  private accessToken: string;
  private ready: Promise<void> | null = null;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  updateToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Initialize the Web Playback SDK.
   * Must be called after a user gesture (browser autoplay policy).
   */
  async initialize(): Promise<void> {
    if (this.ready) return this.ready;

    this.ready = (async () => {
      await loadSpotifySDK();

      const Spotify = (window as unknown as { Spotify: SpotifyNamespace }).Spotify;

      return new Promise<void>((resolve, reject) => {
        const player = new Spotify.Player({
          name: "goodbAI Scanner",
          getOAuthToken: (cb) => cb(this.accessToken),
          volume: 0.01, // Near-silent — we just need the audio stream
        });

        player.addListener("ready", ((...args: unknown[]) => {
          const data = args[0] as { device_id: string };
          this.deviceId = data.device_id;
          resolve();
        }));

        player.addListener("not_ready", (() => {
          this.deviceId = null;
        }));

        player.addListener("initialization_error", ((...args: unknown[]) => {
          const data = args[0] as { message: string };
          reject(new Error(`SDK init error: ${data.message}`));
        }));

        player.addListener("authentication_error", ((...args: unknown[]) => {
          const data = args[0] as { message: string };
          reject(new Error(`Auth error: ${data.message}`));
        }));

        player.connect().then((success) => {
          if (!success) {
            reject(new Error("Failed to connect Spotify player"));
          }
        });

        this.player = player;
      });
    })();

    return this.ready;
  }

  /**
   * Capture ~5 seconds of audio from a Spotify track.
   *
   * Uses the Spotify Connect API to play the track on our SDK device,
   * then captures from the default audio output using MediaStream.
   *
   * @returns Mono Float32Array at 44.1kHz, or null if capture fails
   */
  async captureTrackAudio(trackUri: string): Promise<Float32Array | null> {
    if (!this.player || !this.deviceId) {
      throw new Error("Player not initialized. Call initialize() first.");
    }

    try {
      // Start playback on our device via Spotify Connect API
      // Seek to 30% into the track for a representative sample
      const res = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [trackUri],
            position_ms: 30000, // Start 30 seconds in
          }),
        }
      );

      if (!res.ok && res.status !== 204) {
        console.warn(`Failed to start playback: ${res.status}`);
        return null;
      }

      // Wait a moment for playback to start
      await sleep(500);

      // Capture audio from the browser's audio output
      const waveform = await captureAudioOutput(CAPTURE_DURATION_MS);

      // Pause playback
      await this.player.pause().catch(() => {});

      return waveform;
    } catch (err) {
      console.warn("Playback capture failed:", err);
      // Try to pause in case playback started
      await this.player.pause().catch(() => {});
      return null;
    }
  }

  /**
   * Check if the player is ready for capture.
   */
  isReady(): boolean {
    return this.player !== null && this.deviceId !== null;
  }

  /**
   * Get the device ID for this player.
   */
  getDeviceId(): string | null {
    return this.deviceId;
  }

  /**
   * Clean up the player when done scanning.
   */
  destroy(): void {
    if (this.player) {
      this.player.disconnect();
      this.player = null;
      this.deviceId = null;
      this.ready = null;
    }
  }
}

/**
 * Capture audio from the browser's audio output using a MediaStream.
 * This uses the experimental getDisplayMedia with audio or falls back
 * to creating an AudioContext destination capture.
 */
async function captureAudioOutput(durationMs: number): Promise<Float32Array> {
  // Use getDisplayMedia with audio to capture system audio
  // Note: This requires user interaction and may show a browser picker
  const stream = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: false, // We only need audio
  } as MediaStreamConstraints);

  const audioContext = new AudioContext({ sampleRate: SAMPLING_RATE });
  const source = audioContext.createMediaStreamSource(stream);
  const analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 2048;

  // Use a ScriptProcessor to collect raw samples
  const bufferSize = 4096;
  const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
  const chunks: Float32Array[] = [];
  const totalSamples = Math.ceil((durationMs / 1000) * SAMPLING_RATE);
  let collectedSamples = 0;

  return new Promise<Float32Array>((resolve) => {
    processor.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      const copy = new Float32Array(inputData);
      chunks.push(copy);
      collectedSamples += copy.length;

      if (collectedSamples >= totalSamples) {
        // Stop capture
        processor.disconnect();
        source.disconnect();
        stream.getTracks().forEach((t) => t.stop());
        audioContext.close();

        // Merge chunks into a single buffer
        const result = new Float32Array(totalSamples);
        let offset = 0;
        for (const chunk of chunks) {
          const remaining = totalSamples - offset;
          const toCopy = Math.min(chunk.length, remaining);
          result.set(chunk.subarray(0, toCopy), offset);
          offset += toCopy;
          if (offset >= totalSamples) break;
        }

        resolve(result);
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton
let _playbackCapture: SpotifyPlaybackCapture | null = null;

export function getPlaybackCapture(accessToken: string): SpotifyPlaybackCapture {
  if (!_playbackCapture) {
    _playbackCapture = new SpotifyPlaybackCapture(accessToken);
  } else {
    _playbackCapture.updateToken(accessToken);
  }
  return _playbackCapture;
}

export function destroyPlaybackCapture(): void {
  _playbackCapture?.destroy();
  _playbackCapture = null;
}
