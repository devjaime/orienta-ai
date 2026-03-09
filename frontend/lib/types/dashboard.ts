export interface SessionSummary {
  id: string;
  scheduled_at: string;
  status: string;
  orientador_id: string;
  student_id: string;
  duration_minutes: number;
}

export interface TestResultSummary {
  id: string;
  test_type: string;
  result_code: string | null;
  certainty: number | null;
  created_at: string;
}

export interface CareerSummary {
  id: string;
  name: string;
  area: string;
  employability: number;
  saturation_index: number;
}

export interface ProfileSummary {
  student_id: string;
  skills: Record<string, number>;
  interests: Record<string, number>;
  happiness_indicators: Record<string, number>;
  riasec_history: Array<{
    date: string;
    scores: Record<string, number>;
  }>;
  last_updated: string | null;
}

export interface AIAnalysisSummary {
  id: string;
  session_id: string;
  summary: string;
  reviewed_by_orientador: boolean;
  created_at: string;
}

export interface WorkloadStats {
  this_week: number;
  this_month: number;
  capacity: number;
}

export interface StudentAlert {
  student_id: string;
  student_name: string;
  alert_type: string;
  message: string;
}

export interface ChildDashboardInfo {
  student_id: string;
  student_name: string;
  student_email: string;
  profile_summary: ProfileSummary | null;
  recent_sessions: SessionSummary[];
  recent_tests: TestResultSummary[];
  happiness_indicator: number | null;
  upcoming_sessions: SessionSummary[];
}

export interface ParentDashboardResponse {
  children: ChildDashboardInfo[];
}

export interface InstitutionStats {
  total_students: number;
  active_students: number;
  sessions_this_month: number;
  tests_completed_this_month: number;
  average_engagement: number;
}

export interface OrientadorWorkloadItem {
  orientador_id: string;
  orientador_name: string;
  students_assigned: number;
  sessions_completed: number;
  workload_percentage: number;
}

export interface EngagementTrendItem {
  week: string;
  active_students: number;
}

export interface AdminDashboardResponse {
  institution_stats: InstitutionStats;
  orientador_stats: OrientadorWorkloadItem[];
  top_careers: CareerSummary[];
  engagement_trend: EngagementTrendItem[];
}

export interface PlatformStats {
  total_institutions: number;
  active_institutions: number;
  total_users: number;
  total_students: number;
  total_sessions: number;
  total_tests: number;
  sessions_this_month: number;
  tests_this_month: number;
}

export interface InstitutionOverview {
  id: string;
  name: string;
  slug: string;
  plan: string;
  total_students: number;
  total_sessions: number;
  is_active: boolean;
}

export interface SuperAdminDashboardResponse {
  platform_stats: PlatformStats;
  active_institutions: InstitutionOverview[];
  recent_sessions_count: number;
  recent_tests_count: number;
}
