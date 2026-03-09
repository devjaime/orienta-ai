export type GameDifficulty = "easy" | "medium" | "hard";

export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string;
  skills_evaluated: string[];
  duration_minutes: number;
  difficulty: GameDifficulty;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface GameMetrics {
  level: number;
  time_seconds: number;
  errors: number;
  hints_used: number;
  score: number;
  extra: Record<string, unknown>;
}

export interface GameResult {
  id: string;
  game_id: string;
  student_id: string;
  institution_id: string;
  metrics: GameMetrics;
  skills_scores: Record<string, number>;
  duration_seconds: number;
  created_at: string;
}

export interface GameSession {
  session_id: string;
  game: Game;
  started_at: string;
}

export type GameState = "idle" | "playing" | "paused" | "completed";

export interface GameContextValue {
  game: Game | null;
  state: GameState;
  metrics: GameMetrics;
  startGame: (game: Game) => void;
  updateMetrics: (updates: Partial<GameMetrics>) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => Promise<GameResult | null>;
  resetGame: () => void;
}

export type GameConfig = Record<string, unknown>;
