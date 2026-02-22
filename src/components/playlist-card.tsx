"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Music, Lock, Activity } from "lucide-react";
import type { SpotifyPlaylist } from "@/lib/types";

interface PlaylistCardProps {
  playlist: SpotifyPlaylist;
  onClick: (playlist: SpotifyPlaylist) => void;
}

export function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      className="group relative cursor-pointer overflow-hidden border-border/40 bg-card/40 transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-md hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      onClick={() => onClick(playlist)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(playlist);
        }
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <CardContent className="relative flex items-center gap-4 p-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md shadow-sm">
          {playlist.images?.[0] ? (
            <img
              src={playlist.images[0].url}
              alt={playlist.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:brightness-90"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted transition-colors duration-300 group-hover:bg-primary/10">
              <Music className="h-8 w-8 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
            <Activity className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {playlist.name}
          </h3>
          <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
            <span className="text-foreground/80">{playlist.tracks.total}</span> tracks
            {playlist.owner?.display_name && (
              <> &middot; {playlist.owner.display_name}</>
            )}
          </p>
          {(playlist.public === false || playlist.collaborative) && (
            <div className="mt-2 flex items-center gap-2">
              {!playlist.public && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              {playlist.collaborative && (
                <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-medium text-secondary-foreground">
                  Collaborative
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
