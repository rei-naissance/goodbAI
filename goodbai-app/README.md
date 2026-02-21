# goodbAI — AI Music Detector for Spotify

Scan your Spotify playlists for AI-generated music. Detect and remove songs created by Suno, Udio, and other AI music generators.

## Features

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
- **Model updates:** Use the converter in `../Spot-if-AI/sonics-onnx-converter/` with newer SONICS checkpoints

## License

MIT
