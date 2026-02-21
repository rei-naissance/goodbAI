import type { NextConfig } from "next";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// Copy ONNX Runtime WASM files to public directory at build time
function copyOnnxruntimeWasm() {
  const wasmDir = join(
    process.cwd(),
    "node_modules",
    "onnxruntime-web",
    "dist"
  );
  const publicDir = join(process.cwd(), "public", "onnx");

  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  const wasmFiles = [
    "ort-wasm-simd-threaded.wasm",
    "ort-wasm-simd.wasm",
    "ort-wasm.wasm",
  ];

  for (const file of wasmFiles) {
    const src = join(wasmDir, file);
    const dest = join(publicDir, file);
    if (existsSync(src) && !existsSync(dest)) {
      try {
        copyFileSync(src, dest);
      } catch {
        // Silently skip if file doesn't exist in this onnxruntime version
      }
    }
  }
}

copyOnnxruntimeWasm();

const nextConfig: NextConfig = {
  // Allow Spotify CDN images
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "mosaic.scdn.co" },
      { protocol: "https", hostname: "image-cdn-ak.spotifycdn.com" },
      { protocol: "https", hostname: "image-cdn-fa.spotifycdn.com" },
    ],
  },

  // Turbopack config (Next.js 16 default)
  turbopack: {},

  // Ensure ONNX WASM files are served correctly
  async headers() {
    return [
      {
        source: "/onnx/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
      {
        source: "/models/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  webpack(config, { isServer }) {
    // Exclude onnxruntime-web from server-side bundling
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("onnxruntime-web");
    }

    // Handle .wasm files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },
};

export default nextConfig;
