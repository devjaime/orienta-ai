"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import type { Game, GameMetrics, GameResult, GameState, GameContextValue } from "@/lib/types";

const defaultMetrics: GameMetrics = {
  level: 1,
  time_seconds: 0,
  errors: 0,
  hints_used: 0,
  score: 0,
  extra: {},
};

const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
}

interface GameProviderProps {
  children: ReactNode;
  onComplete?: (result: GameResult) => void;
}

export function GameProvider({ children, onComplete }: GameProviderProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [state, setState] = useState<GameState>("idle");
  const [metrics, setMetrics] = useState<GameMetrics>(defaultMetrics);
  const timerRef = useRef<number | null>(null);

  const submitMutation = useMutation({
    mutationFn: async (data: {
      game_id: string;
      metrics: GameMetrics;
      skills_scores: Record<string, number>;
      duration_seconds: number;
    }) => {
      return api.post<GameResult>("/api/v1/games/submit", data);
    },
    onSuccess: (result) => {
      onComplete?.(result);
      toast("success", "Resultado guardado correctamente");
    },
    onError: () => {
      toast("error", "Error al guardar el resultado");
    },
  });

  const startGame = useCallback((selectedGame: Game) => {
    setGame(selectedGame);
    setMetrics({ ...defaultMetrics, level: 1 });
    setState("playing");
  }, []);

  const updateMetrics = useCallback((updates: Partial<GameMetrics>) => {
    setMetrics((prev) => ({ ...prev, ...updates }));
  }, []);

  const pauseGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState("paused");
  }, []);

  const resumeGame = useCallback(() => {
    setState("playing");
  }, []);

  const endGame = useCallback(async (): Promise<GameResult | null> => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!game) return null;

    const durationSeconds = metrics.time_seconds;
    const payload = {
      game_id: game.id,
      metrics,
      skills_scores: {},
      duration_seconds: durationSeconds,
    };

    try {
      const result = await submitMutation.mutateAsync(payload);
      setState("completed");
      return result;
    } catch {
      return null;
    }
  }, [game, metrics, submitMutation]);

  const resetGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setGame(null);
    setMetrics(defaultMetrics);
    setState("idle");
  }, []);

  useEffect(() => {
    if (state === "playing") {
      timerRef.current = window.setInterval(() => {
        setMetrics((prev) => ({
          ...prev,
          time_seconds: prev.time_seconds + 1,
        }));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state]);

  return (
    <GameContext.Provider
      value={{
        game,
        state,
        metrics,
        startGame,
        updateMetrics,
        pauseGame,
        resumeGame,
        endGame,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

interface GamePlayerProps {
  game: Game;
  children: ReactNode;
}

export function GamePlayer({ game, children }: GamePlayerProps) {
  const { state, metrics, startGame, pauseGame, resumeGame, endGame, resetGame } = useGame();

  useEffect(() => {
    startGame(game);
    return () => {
      resetGame();
    };
  }, [game, startGame, resetGame]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-vocari-bg">
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div>
              <h1 className="text-lg font-bold text-vocari-text">{game.name}</h1>
              <p className="text-sm text-vocari-text-muted">{game.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-vocari-primary">
                  {formatTime(metrics.time_seconds)}
                </p>
                <p className="text-xs text-vocari-text-muted">Tiempo</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-vocari-accent">{metrics.score}</p>
                <p className="text-xs text-vocari-text-muted">Puntaje</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50">
            <div className="flex items-center gap-4">
              <span className="text-sm text-vocari-text">
                Nivel: <strong>{metrics.level}</strong>
              </span>
              <span className="text-sm text-vocari-text">
                Errores: <strong>{metrics.errors}</strong>
              </span>
            </div>
            <div className="flex gap-2">
              {state === "playing" ? (
                <button
                  onClick={pauseGame}
                  className="px-4 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                >
                  Pausar
                </button>
              ) : state === "paused" ? (
                <button
                  onClick={resumeGame}
                  className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                >
                  Continuar
                </button>
              ) : null}
              <button
                onClick={() => endGame()}
                className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                Terminar
              </button>
            </div>
          </div>
        </div>

        <div className="game-content">{children}</div>
      </div>
    </div>
  );
}
