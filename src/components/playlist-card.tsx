"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Music, Lock } from "lucide-react";
import type { SpotifyPlaylist } from "@/lib/types";

interface PlaylistCardProps {
  playlist: SpotifyPlaylist;
  onClick: (playlist: SpotifyPlaylist) => void;
}

export function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
      onClick={() => onClick(playlist)}
    >
      <CardContent className="flex gap-4 p-4">
        {playlist.images?.[0] ? (
          <img
            src={playlist.images[0].url}
            alt={playlist.name}
            className="h-16 w-16 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
            <Music className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{playlist.name}</h3>
          <p className="text-sm text-muted-foreground">
            {playlist.tracks.total} tracks
            {playlist.owner?.display_name && (
              <> &middot; {playlist.owner.display_name}</>
            )}
          </p>
          <div className="mt-1 flex items-center gap-1">
            {!playlist.public && (
              <Lock className="h-3 w-3 text-muted-foreground" />
            )}
            {playlist.collaborative && (
              <span className="text-xs text-muted-foreground">
                Collaborative
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
