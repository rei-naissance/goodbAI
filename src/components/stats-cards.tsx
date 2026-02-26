"use client";

import { AlertTriangle, CheckCircle2, Eye, EyeOff, Music } from "lucide-react";

interface StatsCardsProps {
  total: number;
  high: number;
  medium: number;
  low: number;
  noPreview: number;
  blocklistMatches: number;
  deezerFallbacks?: number;
}

export function StatsCards({
  total,
  high,
  medium,
  low,
  noPreview,
  blocklistMatches,
  deezerFallbacks,
}: StatsCardsProps) {
  const cards = [
    {
      label: "TOTAL_TRK",
      value: total,
      icon: Eye,
      color: "text-foreground",
    },
    {
      label: "HIGH_RISK",
      value: high,
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      label: "MED_RISK",
      value: medium,
      icon: AlertTriangle,
      color: "text-yellow-500",
    },
    {
      label: "CLEAN_TRK",
      value: low,
      icon: CheckCircle2,
      color: "text-primary",
    },
    {
      label: "BLK_HITS",
      value: blocklistMatches,
      icon: AlertTriangle,
      color: "text-destructive",
    },
    ...(deezerFallbacks !== undefined && deezerFallbacks > 0
      ? [
        {
          label: "DZR_FBK",
          value: deezerFallbacks,
          icon: Music,
          color: "text-[#5555ff]",
        },
      ]
      : []),
    {
      label: "NO_PRVW",
      value: noPreview,
      icon: EyeOff,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-px bg-border border-2 border-border">
      {cards.map((card) => (
        <div key={card.label} className="bg-card p-4 relative group hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <card.icon className={`h-5 w-5 ${card.color}`} />
            <div>
              <p className="text-3xl font-black font-mono tracking-tighter">{card.value}</p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
