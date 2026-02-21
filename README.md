# 🤖 goodbAI

A Spotify playlist scanner that detects and removes AI-generated music. Built with Next.js and TypeScript. The SONICS ML model runs locally in your browser via WebAssembly — no audio data ever leaves your device. I built this as a side project to learn more about ML inference in the browser and working with the Spotify API.

## 📦 Technologies

- `Next.js`
- `React.js`
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui`
- `ONNX Runtime Web`
- `Spotify Web API`
- `Spotify OAuth 2.0`

## 🦄 Features

Here's what you can do with goodbAI:

- **Two-Layer Detection**: Every track is checked against a blocklist of 100+ known AI artist names, then analyzed by the SONICS ML model using its 5-second audio preview.

- **SONICS Audio Analysis**: The SONICS model (spectttra-alpha-5s) runs entirely in your browser via WebAssembly. It analyzes mel-spectrogram features to detect Suno/Udio artifacts and returns a probability score from 0 (human) to 1 (AI).

- **Deezer Fallback**: When Spotify's preview URL is missing, the scanner falls back to Deezer's free API using the track's ISRC code for an exact match, or a name/artist search as a last resort.

- **Playlist Scanner**: Select any of your playlists and see every track scored with a risk level — High, Medium, Low, or Unknown.

- **Bulk Removal**: Select any flagged tracks and remove them from your playlist in one click.

- **Privacy First**: All audio analysis runs client-side. No audio is sent to any server.

### 🎯 Risk Levels:

- **High** (red): Blocklist match OR audio score ≥ 75%
- **Medium** (yellow): Audio score 40–75%
- **Low** (green): Audio score < 40%
- **Unknown** (gray): No preview available for analysis

## 👩🏽‍🍳 The Process

I started by setting up Spotify OAuth 2.0 so users could authenticate and access their playlists. From there I built the playlist selector and the two-phase scan pipeline — first a fast blocklist pass, then the slower per-track audio analysis.

Getting the SONICS model into the browser was the biggest challenge. The original Python model used torchlibrosa and mel-spectrogram layers that don't export cleanly to ONNX by default. I wrote a conversion script (see `onnxscript.ipynb`) that replaces the non-exportable layers with compatible alternatives and exports using `dynamo=False`. I ran it on Google Colab for the GPU and uploaded the resulting 82 MB model to HuggingFace so it could be served without bloating the Vercel deploy.

Once the model was running in-browser via ONNX Runtime Web (WASM), I worked on the audio pipeline — proxying preview URLs through an API route to avoid CORS, decoding the MP3 with the Web Audio API, and resampling to the 44.1 kHz mono format the model expects.

I then added Deezer as a fallback audio source since Spotify has been quietly removing preview URLs from many tracks. Deezer's free API supports ISRC-based lookup, which gives an exact match most of the time.

Finally I deployed the app on Vercel with the model URL pointing to HuggingFace, and wired up all the environment variables.

## 📚 What I Learned

### 🧠 ONNX Export Quirks:

- Exporting PyTorch models to ONNX is rarely straightforward. Custom layers and dynamic control flow can break the export. I learned how to identify non-exportable layers and replace them with equivalent `torch.nn.Module` implementations that trace cleanly.

### 🎵 Audio in the Browser:

- The Web Audio API's `AudioContext` and `decodeAudioData` handle MP3 decoding natively. Getting the resampled, mono Float32Array that ONNX Runtime expects involved working through channel mixing and sample-rate conversion manually.

### 🔐 Spotify OAuth Flow:

- Learned the difference between Authorization Code flow (server-side secret, refresh tokens) and PKCE (public clients). Chose the former to keep the client secret off the browser while still supporting long-lived sessions via httpOnly refresh token cookies.

### 🌐 CORS in Next.js:

- Browsers block cross-origin audio fetches. Routing preview URLs through a Next.js API route proxy with an allowlist of trusted CDN hostnames (Spotify and Deezer) was the clean solution.

### 📦 Deploying Large Model Files:

- Vercel's 250 MB function size limit and slug limits make bundling large `.onnx` files impractical. Hosting the model on HuggingFace and fetching it at runtime via a configurable env var (`NEXT_PUBLIC_ONNX_MODEL_URL`) was the right tradeoff.

### 📈 Overall Growth:

This project connected a lot of dots across ML inference, browser APIs, OAuth security patterns, and deployment constraints. Every constraint — CORS, model size, preview availability — pushed me toward a more robust solution.

## 💭 How can it be improved?

- Apply to get out of Spotify's Development Mode (25-user limit) by submitting for quota extension.
- Add the Spotify Web Playback SDK for Premium users to capture full audio instead of relying on previews.
- Retrain or swap the SONICS model as newer AI music generators emerge.
- Add a dark/light theme toggle.
- Show per-track waveform or spectrogram previews in the results table.
- Add export options (CSV, JSON) for the scan results.

## 🚦 Running the Project

To run the project in your local environment, follow these steps:

1. Clone the repository to your local machine.
2. Run `npm install` in the project directory to install the required dependencies.
3. Copy `.env.example` to `.env.local` and fill in your Spotify credentials.
4. Run `npm run dev` to start the development server.
5. Open [https://localhost:3000](https://localhost:3000) in your browser.

### Setting Up the ONNX Model

The SONICS model must be converted to ONNX format before audio analysis works. Open `onnxscript.ipynb` in Google Colab and run all cells — it installs dependencies, writes the conversion script, and exports `sonics_model.onnx`. Then either:

- Place the file at `public/models/sonics_model.onnx` for local dev, **or**
- Upload it to HuggingFace and set `NEXT_PUBLIC_ONNX_MODEL_URL` in `.env.local`

> Audio analysis is disabled if the model file is missing. Blocklist detection still works without it.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Next.js App (Frontend)                     │
│                                                              │
│  Landing Page ──> Spotify OAuth ──> Dashboard                │
│                                       │                      │
│                              ┌────────┴────────┐             │
│                              │ Playlist Selector│             │
│                              └────────┬────────┘             │
│                                       │                      │
│                    ┌──────────────────┴──────────────────┐   │
│                    │         Scanner Pipeline             │   │
│                    │                                      │   │
│                    │  Phase 1: Blocklist (instant)        │   │
│                    │  Phase 2: SONICS ONNX (per track)    │   │
│                    │    → Spotify preview                 │   │
│                    │    → Deezer fallback (ISRC)          │   │
│                    └──────────────────┬──────────────────┘   │
│                                       │                      │
│                              ┌────────┴────────┐             │
│                              │ Results Table    │             │
│                              │ (select + remove)│             │
│                              └─────────────────┘             │
│                                                              │
│  Browser ONNX Runtime (WASM) <── sonics_model.onnx          │
└──────────────────────────┬───────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              v            v            v
      Spotify API    Audio Proxy     API Routes
      (playlists,    (CORS bypass)   (OAuth token
       tracks,       Spotify + Deezer  exchange &
       removal)      CDN allowlist     refresh)
```

## License

MIT


- **Two-Layer Detection**
  - **Blocklist Matching** — Instant cross-reference against 100+ known AI artist names from community sources (Reddit, GitHub)
  - **SONICS Audio Analysis** — ML model analyzes 5-second preview audio to detect Suno/Udio artifacts (runs locally in your browser via WebAssembly)
- **Playlist Scanner** — Select any playlist, see all tracks scored with risk levels
- **Bulk Removal** — Select flagged tracks and remove them from your playlist in one click
- **Privacy First** — Audio analysis runs entirely client-side. No audio data leaves your browser.

## Getting Started

### 1. Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Set the **Redirect URI** to `https://localhost:3000/api/auth/callback`
4. Note your **Client ID** and **Client Secret**

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Spotify credentials:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://localhost:3000/api/auth/callback
```

### 3. Set Up the ONNX Model

The SONICS model needs to be converted to ONNX format and placed in `public/models/`:

```bash
cd ../Spot-if-AI/sonics-onnx-converter
pip install torch torchaudio transformers onnx onnxruntime torchlibrosa
python convert_to_onnx.py
cp exports/sonics_model.onnx ../../goodbai-app/public/models/
```

> **Note:** Audio analysis will be disabled if the model file is not present. Blocklist detection still works without it.

### 4. Install & Run

```bash
npm install
npm run dev
```

Open [https://localhost:3000](https://localhost:3000).

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Next.js App (Frontend)                     │
│                                                              │
│  Landing Page ──> Spotify OAuth ──> Dashboard                │
│                                       │                      │
│                              ┌────────┴────────┐             │
│                              │ Playlist Selector│             │
│                              └────────┬────────┘             │
│                                       │                      │
│                    ┌──────────────────┴──────────────────┐   │
│                    │         Scanner Pipeline             │   │
│                    │                                      │   │
│                    │  Phase 1: Blocklist (instant)        │   │
│                    │  Phase 2: SONICS ONNX (per track)    │   │
│                    └──────────────────┬──────────────────┘   │
│                                       │                      │
│                              ┌────────┴────────┐             │
│                              │ Results Table    │             │
│                              │ (select + remove)│             │
│                              └─────────────────┘             │
│                                                              │
│  Browser ONNX Runtime (WASM) <── sonics_model.onnx          │
└──────────────────────────┬───────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              v            v            v
      Spotify API    Audio Preview   API Routes
      (playlists,    Proxy (CORS)    (OAuth token
       tracks,                        exchange &
       removal)                       refresh)
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── dashboard/page.tsx       # Main dashboard
│   ├── layout.tsx               # Root layout
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts   # Spotify OAuth redirect
│       │   ├── callback/route.ts# OAuth code -> token exchange
│       │   ├── refresh/route.ts # Refresh access token
│       │   └── logout/route.ts  # Clear session
│       └── proxy/
│           └── preview/route.ts # Proxy audio preview (CORS)
├── components/
│   ├── navbar.tsx               # Top navigation bar
│   ├── playlist-card.tsx        # Playlist tile component
│   ├── playlist-selector.tsx    # Playlist grid with search
│   ├── scan-progress.tsx        # Progress bar during scan
│   ├── results-table.tsx        # Sortable/filterable results
│   ├── stats-cards.tsx          # Aggregate statistics
│   ├── ai-probability-bar.tsx   # Visual risk indicator
│   └── ui/                      # shadcn/ui primitives
├── hooks/
│   └── use-scanner.ts           # Scan orchestration hook
├── lib/
│   ├── auth-context.tsx         # Spotify auth state management
│   ├── blocklist.ts             # AI artist blocklist (100+ names)
│   ├── inference.ts             # ONNX inference engine
│   ├── scanner.ts               # Two-phase scan pipeline
│   ├── spotify.ts               # Spotify API client
│   ├── types.ts                 # TypeScript interfaces
│   └── utils.ts                 # shadcn utilities
└── public/
    ├── models/
    │   └── sonics_model.onnx    # (user-provided)
    └── onnx/                    # ONNX Runtime WASM (auto-copied)
```

## How Detection Works

### Blocklist Matching
- Maintains a list of 100+ known AI artist names from Reddit compilations, GitHub spotify-ai-blocker, and community reports
- Includes pattern matching for terms like "suno", "udio", "ai generated", etc.
- Instant O(1) lookup per artist

### SONICS Audio Analysis
- Uses the [SONICS](https://github.com/awsaf49/sonics) model (spectttra-alpha-5s)
- Takes a 5-second audio chunk from the track preview URL
- Analyzes mel-spectrogram features to detect AI generation artifacts
- Returns a probability score (0 = human, 1 = AI)
- Runs entirely in-browser via ONNX Runtime Web (WebAssembly)

### Risk Levels
- **High** (red): Blocklist match OR audio score >= 75%
- **Medium** (yellow): Audio score 40-75%
- **Low** (green): Audio score < 40%
- **Unknown** (gray): No preview available for analysis

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** Tailwind CSS v4 + shadcn/ui
- **ML:** ONNX Runtime Web (WASM)
- **Auth:** Spotify OAuth 2.0 (Authorization Code flow)
- **Language:** TypeScript
- **Deployment:** Vercel-ready

## Known Limitations

1. **Preview availability** — Spotify has been reducing preview URL availability. Tracks without previews can only be checked via blocklist.
2. **SONICS model scope** — Currently trained on Suno v3 and Udio. Newer AI generators may not be detected.
3. **False positives** — Electronic/synthetic music may occasionally score higher than expected.
4. **Rate limits** — Large playlists (500+ tracks) may take several minutes to fully analyze.
5. **5-second analysis** — Only the middle 5 seconds of the preview are analyzed, not the full track.

## Contributing

- **Blocklist additions:** Edit `src/lib/blocklist.ts` to add new AI artist names

## License

MIT
