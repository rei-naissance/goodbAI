"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Music,
  ShieldAlert,
  Zap,
  TerminalSquare,
  ArrowRight,
  Bot,
  Activity,
  Layers,
  ListChecks,
  AudioLines,
} from "lucide-react";
import { motion, Variants } from "framer-motion";

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function LandingContent() {
  const { isAuthenticated, login } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (isAuthenticated) {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
    return null;
  }

  const animateInitial = "hidden";

  return (
    <main className="min-h-screen bg-transparent selection:bg-primary/30 relative overflow-hidden font-sans">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 z-[-1] bg-grid opacity-20" />
      <div className="absolute inset-0 z-[-1] scanline opacity-30" />

      {/* Hero Section */}
      <motion.section
        className="mx-auto max-w-6xl px-4 pt-32 pb-24 sm:px-8 flex flex-col items-center md:items-start text-center md:text-left relative"
        initial={animateInitial}
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={fadeUpVariants} className="mb-8 inline-flex items-center gap-3 border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-widest text-primary backdrop-blur-sm shadow-[0_0_15px_rgba(30,215,96,0.15)] glitch-hover">
          <Bot className="h-4 w-4" />
          <span>System Alert: AI music infiltration detected</span>
        </motion.div>

        <motion.h1 variants={fadeUpVariants} className="mb-6 text-6xl font-black uppercase tracking-tighter sm:text-8xl md:text-[6rem] leading-[0.9] text-foreground mix-blend-difference relative">
          <span className="absolute -inset-1 blur-2xl opacity-20 bg-primary z-[-1]"></span>
          Eradicate <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#55ff99] to-primary shine-animate">
            Artificial
          </span> <br className="hidden md:block" />
          Frequencies
        </motion.h1>

        <motion.p variants={fadeUpVariants} className="mb-10 max-w-2xl text-lg text-muted-foreground font-mono leading-relaxed border-l-4 border-primary/50 pl-4">
          Initiate protocol goodbAI. Scan your Spotify playlists using real-time community blocklists and the SONICS structural analysis engine to detect synthetic generation artifacts. Review targets. Terminate with one click.
        </motion.p>

        <motion.div variants={fadeUpVariants} className="relative group">
          <div className="absolute -inset-1 bg-primary/30 blur-md group-hover:bg-primary/50 transition duration-300"></div>
          <Button
            size="lg"
            onClick={login}
            className="relative h-16 rounded-none px-10 text-lg font-bold font-mono uppercase tracking-widest bg-foreground text-background border-2 border-primary hover:bg-primary hover:text-black transition-all duration-300"
          >
            <TerminalSquare className="mr-3 h-5 w-5" />
            Initialize Link
            <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transiton-transform" />
          </Button>
        </motion.div>

        <motion.div variants={fadeUpVariants} className="mt-12 flex items-center gap-4 text-xs font-mono text-muted-foreground uppercase opacity-70">
          <div className="h-px bg-border flex-1" />
          <p>End-to-end Local Execution // Read+Modify Scopes Only</p>
          <div className="h-px bg-border flex-1" />
        </motion.div>
      </motion.section>

      {/* Protocol execution (How it Works) */}
      <section className="relative border-y border-border bg-black/40 backdrop-blur-sm py-24">
        <div className="absolute top-0 left-0 w-2 h-full bg-primary/20"></div>
        <motion.div
          className="mx-auto max-w-6xl px-4 sm:px-8"
          initial={animateInitial}
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
        >
          <motion.div variants={fadeUpVariants} className="mb-16 flex items-end gap-6 justify-between border-b border-border/50 pb-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter">
              EXECUTION <span className="text-primary font-mono font-light text-2xl">// PROTOCOL</span>
            </h2>
          </motion.div>

          <div className="grid gap-x-8 gap-y-16 sm:grid-cols-3">
            {[
              { num: "01", icon: ListChecks, title: "Target Acq", desc: "Form uplink with your Spotify account. Select source playlists for structural analysis. Supports standard and collaborative lists." },
              { num: "02", icon: Layers, title: "Deep Scan", desc: "Heuristic scan crosses 100+ known AI identities. Secondary structural scan utilizes SONICS neural network against 5s audio segments." },
              { num: "03", icon: Activity, title: "Eradication", desc: "Review structural integrity reports. Flagged items presented with confidence intervals. Execute deletion protocol on selected targets." }
            ].map((step, i) => (
              <motion.article key={i} variants={fadeUpVariants} className="relative group">
                <div className="text-7xl font-bold font-mono text-border/20 absolute -top-10 -left-4 -z-10 select-none group-hover:text-primary/10 transition-colors">
                  {step.num}
                </div>
                <div className="border border-border bg-card p-6 h-full transition-all group-hover:border-primary">
                  <step.icon className="h-8 w-8 text-primary mb-6" />
                  <h3 className="mb-3 text-lg font-bold uppercase tracking-tight font-sans">
                    {step.title}
                  </h3>
                  <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

        <motion.div
          className="mx-auto max-w-6xl px-4 sm:px-8 relative"
          initial={animateInitial}
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
        >
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: ShieldAlert, title: "Air-Gapped Processing", desc: "Core WASM audio analysis executes entirely within the browser context. Zero outbound telemetry. Zero audio data extraction." },
              { icon: Zap, title: "Rapid Cross-Ref", desc: "Instantaneous pattern matching against decentralized, crowd-sourced registries identifying known synthetic artists." },
              { icon: AudioLines, title: "Neural Heuristics", desc: "Proprietary SONICS ML agent isolates synthetic artifacts (Suno/Udio signatures) utilizing minimal 5000ms preview buffers." }
            ].map((feat, i) => (
              <motion.article key={i} variants={fadeUpVariants} className="relative overflow-hidden border border-border bg-card p-8 group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent"></div>
                {/* A brutalist corner cut effect */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/0 group-hover:border-primary/100 transition-colors"></div>

                <feat.icon className="mb-6 h-8 w-8 text-foreground group-hover:text-primary transition-colors" />
                <h3 className="mb-2 text-md font-bold uppercase tracking-wider font-mono">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feat.desc}
                </p>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12 font-mono">
        <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground sm:px-8 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary inline-block animate-pulse"></span>
            goodbAI OS_v1.0
          </div>
          <div className="text-center md:text-right">
            Open protocol. Powered by {" "}
            <a
              href="https://github.com/awsaf49/sonics"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/70 underline underline-offset-4 decoration-primary/50"
            >
              SONICS
            </a>.
            <br />
            Independent entity. Not affiliated with Spotify AB.
          </div>
        </div>
      </footer>
    </main>
  );
}
