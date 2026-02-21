"use client";

import { Card, CardContent } from "@/components/ui/card";
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
      label: "Total Tracks",
      value: total,
      icon: Eye,
      color: "text-foreground",
    },
    {
      label: "High Risk",
      value: high,
      icon: AlertTriangle,
      color: "text-red-500",
    },
    {
      label: "Medium Risk",
      value: medium,
      icon: AlertTriangle,
      color: "text-yellow-500",
    },
    {
      label: "Clean",
      value: low,
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      label: "Blocklist Hits",
      value: blocklistMatches,
      icon: AlertTriangle,
      color: "text-red-500",
    },
    ...(deezerFallbacks !== undefined && deezerFallbacks > 0
      ? [
          {
            label: "Deezer Fallback",
            value: deezerFallbacks,
            icon: Music,
            color: "text-purple-500",
          },
        ]
      : []),
    {
      label: "No Preview",
      value: noPreview,
      icon: EyeOff,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <card.icon className={`h-5 w-5 ${card.color}`} />
            <div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
