"use client";

import { AuthProvider } from "@/lib/auth-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Music,
  Shield,
  Zap,
  Trash2,
  ArrowRight,
  Bot,
  AudioLines,
  ListChecks,
} from "lucide-react";

function LandingContent() {
  const { isAuthenticated, login } = useAuth();

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="mx-auto max-w-5xl px-4 pt-20 pb-16 text-center sm:px-6 lg:px-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm">
          <Bot className="h-4 w-4 text-red-500" />
          AI music is flooding Spotify
        </div>

        <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
          Find & Remove{" "}
          <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            AI-Generated
          </span>{" "}
          Music from Your Playlists
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
          goodbAI scans your Spotify playlists using community blocklists and
          the SONICS audio analysis model to detect songs created by Suno,
          Udio, and other AI music generators. Review results and remove
          tracks in one click.
        </p>

        <Button size="lg" onClick={login} className="gap-2 text-lg">
          <Music className="h-5 w-5" />
          Connect Spotify
          <ArrowRight className="h-5 w-5" />
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          We only request access to read and modify your playlists. Your
          data never leaves your browser except for Spotify API calls.
        </p>
      </div>

      {/* How it Works */}
      <div className="border-t bg-card/50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold">
            How It Works
          </h2>

          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <ListChecks className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                1. Select Playlists
              </h3>
              <p className="text-sm text-muted-foreground">
                Connect your Spotify account and choose which playlists to
                scan. We support all your playlists including collaborative
                ones.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <AudioLines className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                2. Two-Layer Detection
              </h3>
              <p className="text-sm text-muted-foreground">
                First, we cross-check against 100+ known AI artists. Then, the
                SONICS ML model analyzes audio previews to catch unknown AI
                tracks.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Trash2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                3. Review & Remove
              </h3>
              <p className="text-sm text-muted-foreground">
                See each flagged track with its AI probability score. Select
                the ones you want gone and remove them from your playlist.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-6">
              <Shield className="mb-3 h-6 w-6 text-green-500" />
              <h3 className="mb-1 font-semibold">Privacy First</h3>
              <p className="text-sm text-muted-foreground">
                Audio analysis runs in your browser using WebAssembly. No
                audio data is sent to our servers.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <Zap className="mb-3 h-6 w-6 text-yellow-500" />
              <h3 className="mb-1 font-semibold">Fast Blocklist</h3>
              <p className="text-sm text-muted-foreground">
                Instant matching against a community-curated list of 100+
                known AI artist names on Spotify.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <AudioLines className="mb-3 h-6 w-6 text-blue-500" />
              <h3 className="mb-1 font-semibold">SONICS ML Model</h3>
              <p className="text-sm text-muted-foreground">
                State-of-the-art audio classifier detects Suno and Udio
                artifacts in 5-second preview snippets.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          <p>
            goodbAI is open source. Built with the{" "}
            <a
              href="https://github.com/awsaf49/sonics"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              SONICS
            </a>{" "}
            model and community AI artist lists.
          </p>
          <p className="mt-2">
            Not affiliated with Spotify. Use at your own discretion.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <LandingContent />
    </AuthProvider>
  );
}
