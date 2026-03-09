"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { GameProvider, GamePlayer, useGame } from "@/components/games/GamePlayer";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui";
import type { Game } from "@/lib/types";
import { LogicPuzzle } from "@/components/games/games/LogicPuzzle";
import { PatternRecognition } from "@/components/games/games/PatternRecognition";
import { DecisionSimulator } from "@/components/games/games/DecisionSimulator";
import { CreativityChallenge } from "@/components/games/games/CreativityChallenge";
import { TeamworkScenario } from "@/components/games/games/TeamworkScenario";

const GAME_COMPONENTS: Record<string, React.ComponentType> = {
  "logic-puzzle": LogicPuzzle,
  "pattern-recognition": PatternRecognition,
  "decision-simulator": DecisionSimulator,
  "creativity-challenge": CreativityChallenge,
  "teamwork-scenario": TeamworkScenario,
};

function GameLoader() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: gameData, isLoading } = useQuery({
    queryKey: ["game", slug],
    queryFn: () => api.get<{ items: Game[] }>(`/api/v1/games?slug=${slug}`),
    enabled: !!slug,
  });

  const game = gameData?.items?.[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Skeleton variant="rect" width="100%" height={400} />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <p className="text-vocari-text-muted">Juego no encontrado</p>
      </div>
    );
  }

  const GameComponent = GAME_COMPONENTS[game.slug];

  if (!GameComponent) {
    return (
      <div className="text-center py-12">
        <p className="text-vocari-text-muted">Juego no implementado: {game.slug}</p>
      </div>
    );
  }

  return (
    <GamePlayer game={game}>
      <GameComponent />
    </GamePlayer>
  );
}

export default function GamePage() {
  return (
    <RoleGuard allowedRoles={["estudiante"]}>
      <GameProvider>
        <GameLoader />
      </GameProvider>
    </RoleGuard>
  );
}
