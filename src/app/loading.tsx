import { Music } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent">
      <div className="text-muted-foreground flex flex-col items-center gap-4">
        <Music className="h-8 w-8 animate-pulse text-primary" />
        <p className="font-medium tracking-wide">Loading...</p>
      </div>
    </div>
  );
}
