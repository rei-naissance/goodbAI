import { NextRequest, NextResponse } from "next/server";

/**
 * Proxies Spotify audio preview requests to avoid CORS issues.
 * The browser can't directly fetch audio from Spotify's CDN,
 * so we proxy it through our server.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const previewUrl = searchParams.get("url");

  if (!previewUrl) {
    return NextResponse.json(
      { error: "Missing 'url' parameter" },
      { status: 400 }
    );
  }

  // Validate the URL is from an allowed audio host (Spotify or Deezer)
  const allowedHosts = [
    "p.scdn.co",
    "audio-ak-spotify-com.akamaized.net",
    "audio-akp-spotify-com.akamaized.net",
    "preview.spotifycdn.com",
    // Deezer preview CDN hosts
    "cdns-preview-",  // cdns-preview-d.dzcdn.net, cdns-preview-e.dzcdn.net, etc.
    "cdn-preview-",   // cdn-preview-d.dzcdn.net, etc.
    ".dzcdn.net",
  ];

  try {
    const url = new URL(previewUrl);
    if (!allowedHosts.some((host) => url.hostname.includes(host))) {
      return NextResponse.json(
        { error: "URL not from an allowed audio host" },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const audioRes = await fetch(previewUrl, {
      headers: {
        "User-Agent": "goodbAI/1.0",
      },
    });

    if (!audioRes.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${audioRes.status}` },
        { status: audioRes.status }
      );
    }

    const audioBuffer = await audioRes.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": audioRes.headers.get("Content-Type") || "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Preview proxy error:", err);
    return NextResponse.json(
      { error: "Failed to fetch preview audio" },
      { status: 502 }
    );
  }
}
