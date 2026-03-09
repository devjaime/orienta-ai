export interface CareerSimulation {
  id: string;
  student_id: string;
  career_id: string;
  simulation_data: {
    career_name: string;
    career_area: string;
    salary_projection: Array<{ year: number; salary: number }>;
    milestones: Array<{ year: number; title: string; description: string }>;
    employability: number;
    saturation_index: number;
    skills_needed: Record<string, unknown>;
  };
  ai_narrative: string;
  model_used: string;
  created_at: string;
}
