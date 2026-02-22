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
import { motion, Variants } from "framer-motion";

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] } },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

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
    <main className="min-h-screen bg-transparent selection:bg-primary/30">
      {/* Hero Section */}
      <motion.section
        className="mx-auto max-w-5xl px-4 pt-32 pb-24 text-center sm:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={fadeUpVariants} className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
          <Bot className="h-4 w-4" />
          AI music is flooding Spotify
        </motion.div>

        <motion.h1 variants={fadeUpVariants} className="mb-8 text-5xl font-bold tracking-tight sm:text-7xl">
          Find & Remove{" "}
          <span className="text-primary">
            AI-Generated
          </span>{" "}
          <br className="hidden sm:block" />
          Music from Your Playlists
        </motion.h1>

        <motion.p variants={fadeUpVariants} className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
          goodbAI scans your Spotify playlists using community blocklists and
          the SONICS audio analysis model to detect songs created by Suno,
          Udio, and other AI music generators. Review results and remove
          tracks in one click.
        </motion.p>

        <motion.div variants={fadeUpVariants}>
          <Button size="lg" onClick={login} className="h-16 rounded-full px-8 text-lg font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-primary/40 bg-primary text-primary-foreground hover:bg-primary/90">
            <Music className="mr-2 h-6 w-6" />
            Connect Spotify
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </motion.div>

        <motion.p variants={fadeUpVariants} className="mt-8 text-xs text-muted-foreground">
          We only request access to read and modify your playlists. Your
          data never leaves your browser except for Spotify API calls.
        </motion.p>
      </motion.section>

      {/* How it Works */}
      <section className="border-t border-border/50 bg-secondary/30 py-24">
        <motion.div
          className="mx-auto max-w-5xl px-4 sm:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.h2 variants={fadeUpVariants} className="mb-16 text-center text-4xl font-bold tracking-tight">
            How It Works
          </motion.h2>

          <div className="grid gap-12 sm:grid-cols-3">
            <motion.article variants={fadeUpVariants} className="text-center group">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <ListChecks className="h-12 w-12 text-primary" />
              </div>
              <h3 className="mb-4 text-xl font-semibold">
                1. Select Playlists
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect your Spotify account and choose which playlists to
                scan. We support all your playlists including collaborative
                ones.
              </p>
            </motion.article>

            <motion.article variants={fadeUpVariants} className="text-center group">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <AudioLines className="h-12 w-12 text-primary" />
              </div>
              <h3 className="mb-4 text-xl font-semibold">
                2. Two-Layer Detection
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                First, we cross-check against 100+ known AI artists. Then, the
                SONICS ML model analyzes audio previews to catch unknown AI
                tracks.
              </p>
            </motion.article>

            <motion.article variants={fadeUpVariants} className="text-center group">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Trash2 className="h-12 w-12 text-primary" />
              </div>
              <h3 className="mb-4 text-xl font-semibold">
                3. Review & Remove
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                See each flagged track with its AI probability score. Select
                the ones you want gone and remove them from your playlist.
              </p>
            </motion.article>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24">
        <motion.div
          className="mx-auto max-w-5xl px-4 sm:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <div className="grid gap-8 sm:grid-cols-3">
            <motion.article variants={fadeUpVariants} whileHover={{ y: -8 }} className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-border">
              <Shield className="mb-6 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Privacy First</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Audio analysis runs in your browser using WebAssembly. No
                audio data is sent to our servers.
              </p>
            </motion.article>
            <motion.article variants={fadeUpVariants} whileHover={{ y: -8 }} className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-border">
              <Zap className="mb-6 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Fast Blocklist</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Instant matching against a community-curated list of 100+
                known AI artist names on Spotify.
              </p>
            </motion.article>
            <motion.article variants={fadeUpVariants} whileHover={{ y: -8 }} className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-border">
              <AudioLines className="mb-6 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">SONICS ML Model</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                State-of-the-art audio classifier detects Suno and Udio
                artifacts in 5-second preview snippets.
              </p>
            </motion.article>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground sm:px-8">
          <p>
            goodbAI is open source. Built with the{" "}
            <a
              href="https://github.com/awsaf49/sonics"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              SONICS
            </a>{" "}
            model and community AI artist lists.
          </p>
          <p className="mt-4 opacity-75">
            Not affiliated with Spotify. Use at your own discretion.
          </p>
        </div>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <LandingContent />
    </AuthProvider>
  );
}
