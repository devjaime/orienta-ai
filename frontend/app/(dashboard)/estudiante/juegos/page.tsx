"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { GameProvider } from "@/components/games/GamePlayer";
import {
  Card,
  CardContent,
  Badge,
  Skeleton,
} from "@/components/ui";
import {
  Gamepad2,
  Clock,
  Zap,
  Brain,
  Lightbulb,
  Users,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Game } from "@/lib/types";

const GAME_ICONS: Record<string, typeof Gamepad2> = {
  "logic-puzzle": Brain,
  "pattern-recognition": Zap,
  "decision-simulator": Lightbulb,
  "creativity-challenge": Lightbulb,
  "teamwork-scenario": Users,
};

const GAME_COLORS: Record<string, string> = {
  "logic-puzzle": "bg-blue-100 text-blue-600",
  "pattern-recognition": "bg-purple-100 text-purple-600",
  "decision-simulator": "bg-orange-100 text-orange-600",
  "creativity-challenge": "bg-pink-100 text-pink-600",
  "teamwork-scenario": "bg-green-100 text-green-600",
};

const GAME_DESCRIPTIONS: Record<string, string> = {
  "logic-puzzle": "Resuelve puzzles de logica y patrones",
  "pattern-recognition": "Identifica patrones visuales",
  "decision-simulator": "Enfrenta escenarios de decision",
  "creativity-challenge": "Expresa tu creatividad",
  "teamwork-scenario": "Colabora en equipos simulados",
};

function GameCard({ game }: { game: Game }) {
  const Icon = GAME_ICONS[game.slug] || Gamepad2;
  const bgColor = GAME_COLORS[game.slug] || "bg-gray-100";
  const description = GAME_DESCRIPTIONS[game.slug] || game.description;

  return (
    <Link href={`/estudiante/juegos/${game.slug}`}>
      <Card className="hover:border-vocari-accent transition-colors cursor-pointer">
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`p-3 rounded-lg ${bgColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-vocari-text">{game.name}</h3>
            <p className="text-sm text-vocari-text-muted">{description}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-vocari-text-muted">
                <Clock className="h-3 w-3" />
                {game.duration_minutes} min
              </span>
              <Badge
                variant={
                  game.difficulty === "easy"
                    ? "success"
                    : game.difficulty === "medium"
                      ? "warning"
                        : "error"
                }
              >
                {game.difficulty === "easy"
                  ? "Facil"
                  : game.difficulty === "medium"
                    ? "Medio"
                      : "Dificil"}
              </Badge>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-vocari-text-muted" />
        </CardContent>
      </Card>
    </Link>
  );
}

function GameList() {
  const { data, isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: () => api.get<{ items: Game[] }>("/api/v1/games"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton variant="circle" width={48} height={48} />
              <div className="flex-1">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="80%" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const games = data?.items ?? [];

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <Gamepad2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-vocari-text-muted">
          No hay juegos disponibles actualmente
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}

export default function JuegosPage() {
  return (
    <RoleGuard allowedRoles={["estudiante"]}>
      <GameProvider>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-vocari-text">
              Juegos de Habilidades
            </h1>
            <p className="text-vocari-text-muted">
              Evalua tus habilidades cognitivas y blandas con juegos interactivos
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="font-medium text-blue-800 mb-1">
              Como funcionan los juegos?
            </h2>
            <p className="text-sm text-blue-700">
              Cada juego evalua diferentes habilidades. Los resultados se guardan en
              tu perfil y te ayudan a descubrir tu perfil vocacional completo.
            </p>
          </div>

          <GameList />
        </div>
      </GameProvider>
    </RoleGuard>
  );
}
