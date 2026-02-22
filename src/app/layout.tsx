import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://goodbai.app"),
  title: "goodbAI — AI Music Detector for Spotify",
  description:
    "Scan your Spotify playlists for AI-generated music. Detect and remove songs created by Suno, Udio, and other AI music generators.",
  keywords: ["Spotify", "AI Music", "AI Detector", "Suno", "Udio", "Playlist Cleaner", "Music Blocklist", "goodbAI"],
  authors: [{ name: "goodbAI Contributors" }],
  creator: "goodbAI",
  publisher: "goodbAI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "goodbAI — AI Music Detector for Spotify",
    description: "Scan your Spotify playlists for AI-generated music and remove algorithmic clutter.",
    url: "https://goodbai.app",
    siteName: "goodbAI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "goodbAI - AI Music Detector",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "goodbAI — AI Music Detector for Spotify",
    description: "Keep your playlists human. Detect and delete AI-generated music.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="font-sans antialiased bg-background text-foreground"
      >
        {/* Background Noise Layer */}
        <div className="fixed inset-0 z-[-1] pointer-events-none bg-noise opacity-[0.08] mix-blend-overlay"></div>

        {/* Animated Glow Layer */}
        <div className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden">
          <div className="absolute top-[-30%] left-[-20%] h-[160%] w-[140%] bg-[radial-gradient(circle_at_50%_10%,rgba(29,185,84,0.25),transparent_50%)] animate-ambient-glow mix-blend-screen" />
          <div className="absolute bottom-[-30%] right-[-20%] h-[120%] w-[120%] bg-[radial-gradient(circle_at_50%_90%,rgba(29,185,84,0.15),transparent_50%)] animate-ambient-glow mix-blend-screen" style={{ animationDelay: '-5s' }} />
        </div>

        {children}
        <Toaster />
      </body>
    </html>
  );
}
