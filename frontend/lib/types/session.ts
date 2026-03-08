/**
 * Tipos de sesion — alineados con backend/app/sessions/schemas.py
 *
 * IMPORTANTE: Mantener sincronizado con los schemas Pydantic del backend.
 */

/* ---------- Enums ---------- */

export type SessionStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type RecordingStatus = "pending" | "processing" | "ready" | "failed";

export type TranscriptSource =
  | "google_meet_auto"
  | "manual_upload"
  | "whisper_api";

/* ---------- Session ---------- */

export interface Session {
  id: string;
  institution_id: string;
  student_id: string;
  orientador_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: SessionStatus;
  google_meet_link: string | null;
  notes_by_student: string | null;
  completed_at: string | null;
  created_at: string;
  /* Campos expandidos (no siempre presentes) */
  student_name?: string;
  orientador_name?: string;
}

/* ---------- Recording ---------- */

export interface SessionRecording {
  id: string;
  session_id: string;
  google_drive_file_id: string;
  duration_seconds: number;
  file_size_bytes: number;
  status: RecordingStatus;
  created_at: string;
}

/* ---------- Transcript ---------- */

export interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: string;
}

export interface TranscriptSummary {
  id: string;
  session_id: string;
  language: string;
  word_count: number;
  source: TranscriptSource;
  created_at: string;
}

export interface TranscriptFull extends TranscriptSummary {
  full_text: string;
  segments: TranscriptSegment[];
}

/* ---------- AI Analysis - Sub-tipos ---------- */

export interface InterestDetected {
  interest: string;
  confidence: number; // 0.0 - 1.0
  evidence: string;
  holland_category: string | null;
  explicit: boolean;
  is_new: boolean;
}

export interface SkillDetected {
  skill: string;
  confidence: number; // 0.0 - 1.0
  evidence: string;
  skill_type: "hard" | "soft";
  level: "basico" | "intermedio" | "avanzado";
}

export interface EmotionalSentiment {
  overall: "positivo" | "neutro" | "negativo" | "mixto";
  score: number; // -1.0 a 1.0
  engagement: "alto" | "medio" | "bajo";
  anxiety_indicators: string[];
  motivation: "alta" | "media" | "baja";
  key_moments: string[];
}

export interface SuggestedTest {
  test_id: string;
  test_name: string;
  reason: string;
  priority: "alta" | "media" | "baja";
}

export interface SuggestedGame {
  game_id: string;
  game_name: string;
  reason: string;
  priority: "alta" | "media" | "baja";
}

/* ---------- AI Analysis ---------- */

export interface AnalysisSummary {
  id: string;
  session_id: string;
  model_used: string;
  tokens_used: number;
  processing_time_seconds: number;
  reviewed_by_orientador: boolean;
  created_at: string;
}

export interface AnalysisFull extends AnalysisSummary {
  summary: string;
  interests_detected: InterestDetected[];
  skills_detected: SkillDetected[];
  emotional_sentiment: EmotionalSentiment;
  suggested_tests: SuggestedTest[];
  suggested_games: SuggestedGame[];
  orientador_edits: Record<string, unknown> | null;
}

/* ---------- Session Detail (con nested) ---------- */

export interface SessionDetail extends Session {
  recording: SessionRecording | null;
  transcript: TranscriptSummary | null;
  analysis: AnalysisSummary | null;
}

/* ---------- Session Complete Response ---------- */

export interface SessionCompleteResponse {
  session_id: string;
  status: SessionStatus;
  completed_at: string;
  job_id: string | null;
}

/* ---------- Session List Response ---------- */

export interface SessionListResponse {
  items: Session[];
  total: number;
  page: number;
  per_page: number;
}

/* ---------- Disponibilidad ---------- */

export interface AvailabilityBlock {
  id: string;
  orientador_id: string;
  day_of_week: number; // 1=lunes, 7=domingo (ISO 8601)
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  is_active: boolean;
}

export interface AvailabilityListResponse {
  items: AvailabilityBlock[];
}

/* ---------- Orientador (para agendar) ---------- */

export interface Orientador {
  id: string;
  name: string;
  email: string;
}
