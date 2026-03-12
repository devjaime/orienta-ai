"""Schemas para métricas administrativas de colegio."""

from datetime import datetime

from pydantic import BaseModel, Field


class AdminMetricFilterResponse(BaseModel):
    curso: str | None = None
    periodo: str | None = None
    period_start: datetime | None = None
    period_end: datetime | None = None


class AdminMetricSummaryResponse(BaseModel):
    total_students: int = 0
    students_with_test: int = 0
    completion_rate: float = 0.0
    tests_in_period: int = 0
    average_clarity: float | None = None
    indecision_index: float | None = None


class RIASECDistributionByCourseResponse(BaseModel):
    curso: str
    total_students: int = 0
    total_with_test: int = 0
    codes: dict[str, int] = Field(default_factory=dict)


class ClarityByCourseResponse(BaseModel):
    curso: str
    total_students: int = 0
    students_with_clarity: int = 0
    average_clarity: float | None = None
    indecision_index: float | None = None


class CareerInterestItemResponse(BaseModel):
    career_name: str
    count: int


class AdminMetricsResponse(BaseModel):
    filters: AdminMetricFilterResponse
    summary: AdminMetricSummaryResponse
    cursos: list[str] = Field(default_factory=list)
    riasec_distribution_by_course: list[RIASECDistributionByCourseResponse] = Field(
        default_factory=list
    )
    clarity_by_course: list[ClarityByCourseResponse] = Field(default_factory=list)
    top_careers: list[CareerInterestItemResponse] = Field(default_factory=list)


class CourseCareerInterestResponse(BaseModel):
    curso: str
    careers: list[CareerInterestItemResponse] = Field(default_factory=list)


class ClarityTrendItemResponse(BaseModel):
    month: str
    students_with_clarity: int = 0
    average_clarity: float | None = None
    indecision_index: float | None = None


class IndecisionAlertResponse(BaseModel):
    student_id: str
    student_name: str
    student_email: str
    curso: str
    clarity_score: float
    holland_code: str | None = None
    last_activity_at: datetime | None = None
    recommended_action: str


class AdminInsightsSummaryResponse(BaseModel):
    total_students: int = 0
    students_with_clarity: int = 0
    students_with_high_indecision: int = 0
    high_indecision_rate: float = 0.0


class AdminInsightsResponse(BaseModel):
    filters: AdminMetricFilterResponse
    summary: AdminInsightsSummaryResponse
    courses: list[str] = Field(default_factory=list)
    career_interest_by_course: list[CourseCareerInterestResponse] = Field(default_factory=list)
    clarity_trend: list[ClarityTrendItemResponse] = Field(default_factory=list)
    indecision_alerts: list[IndecisionAlertResponse] = Field(default_factory=list)
