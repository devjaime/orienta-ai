"""
Vocari Backend - Schemas del modulo de reconversion vocacional.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator


class AdultReconversionSessionCreateRequest(BaseModel):
    """Datos iniciales de la fase 0."""

    nombre: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    profesion_actual: str = Field(..., min_length=2, max_length=255)
    edad: int = Field(..., ge=18, le=80)
    pais: str | None = Field(default=None, max_length=120)
    ciudad: str | None = Field(default=None, max_length=120)
    nivel_educativo: str | None = Field(default=None, max_length=120)
    ingreso_actual_aprox: float | None = Field(default=None, ge=0)
    nivel_ingles: str | None = Field(default=None, max_length=60)
    situacion_actual: str | None = Field(default=None, max_length=120)
    disponibilidad_para_estudiar: str | None = Field(default=None, max_length=120)
    disponibilidad_para_relocalizarse: str | None = Field(default=None, max_length=120)


class AdultReconversionPhaseOneRequest(BaseModel):
    """Respuestas del test base de 30 preguntas."""

    answers: dict[int, int] = Field(..., description="Mapa pregunta_id -> valor de 1 a 5")

    @model_validator(mode="after")
    def validate_answers(self) -> "AdultReconversionPhaseOneRequest":
        if len(self.answers) != 30:
            raise ValueError("La fase 1 requiere exactamente 30 respuestas")
        expected_ids = set(range(1, 31))
        if set(self.answers.keys()) != expected_ids:
            raise ValueError("Las respuestas deben incluir las preguntas 1 a 30")
        for value in self.answers.values():
            if value < 1 or value > 5:
                raise ValueError("Cada respuesta debe tener un valor entre 1 y 5")
        return self


class AdultReconversionPhaseSummary(BaseModel):
    """Resumen derivado del test base."""

    dimension_scores: dict[str, float]
    top_dimensions: list[str]
    profile_summary: str
    consistency_hint: str


class AdultReconversionPhaseTwoRequest(BaseModel):
    """Respuestas del desafio intencional de energia laboral."""

    answers: dict[int, str] = Field(
        ...,
        description="Mapa scenario_id -> energiza|neutral|drena",
    )

    @model_validator(mode="after")
    def validate_answers(self) -> "AdultReconversionPhaseTwoRequest":
        if len(self.answers) != 12:
            raise ValueError("La fase 2 requiere exactamente 12 respuestas")
        expected_ids = set(range(1, 13))
        if set(self.answers.keys()) != expected_ids:
            raise ValueError("Las respuestas deben incluir los escenarios 1 a 12")
        valid_values = {"energiza", "neutral", "drena"}
        for value in self.answers.values():
            if value not in valid_values:
                raise ValueError("Cada respuesta debe ser energiza, neutral o drena")
        return self


class AdultReconversionPhaseTwoSummary(BaseModel):
    """Resumen derivado del desafio de energia laboral."""

    energy_scores: dict[str, float]
    energy_map: list[str]
    drain_map: list[str]
    dominant_work_modes: list[str]
    challenge_readout: str
    transition_signal: str


class AdultReconversionPhaseThreeRequest(BaseModel):
    """Respuestas del test confirmatorio."""

    answers: dict[int, int] = Field(..., description="Mapa question_id -> valor de 1 a 5")

    @model_validator(mode="after")
    def validate_answers(self) -> "AdultReconversionPhaseThreeRequest":
        if len(self.answers) != 12:
            raise ValueError("La fase 3 requiere exactamente 12 respuestas")
        expected_ids = set(range(1, 13))
        if set(self.answers.keys()) != expected_ids:
            raise ValueError("Las respuestas deben incluir las preguntas 1 a 12")
        for value in self.answers.values():
            if value < 1 or value > 5:
                raise ValueError("Cada respuesta debe tener un valor entre 1 y 5")
        return self


class AdultReconversionPhaseThreeSummary(BaseModel):
    """Resumen derivado del test confirmatorio."""

    confirmation_scores: dict[str, float]
    confirmed_signals: list[str]
    tension_signals: list[str]
    confidence_score: float
    confidence_label: str
    confirmation_readout: str


class AdultReconversionPhaseFourRequest(BaseModel):
    """Respuestas del simulador de trade-offs."""

    answers: dict[int, str] = Field(..., description="Mapa scenario_id -> a|b|c")

    @model_validator(mode="after")
    def validate_answers(self) -> "AdultReconversionPhaseFourRequest":
        if len(self.answers) != 8:
            raise ValueError("La fase 4 requiere exactamente 8 respuestas")
        expected_ids = set(range(1, 9))
        if set(self.answers.keys()) != expected_ids:
            raise ValueError("Las respuestas deben incluir los escenarios 1 a 8")
        valid_values = {"a", "b", "c"}
        for value in self.answers.values():
            if value not in valid_values:
                raise ValueError("Cada respuesta debe ser a, b o c")
        return self


class AdultReconversionPhaseFourSummary(BaseModel):
    """Resumen derivado del desafio de trade-offs."""

    tradeoff_scores: dict[str, float]
    tradeoff_profile: list[str]
    change_readiness: float
    mobility_readiness: str
    upskilling_readiness: str
    preferred_work_setup: str
    income_tension: str
    decision_summary: str
    constraints_to_respect: list[str]


class AdultReconversionSessionResponse(BaseModel):
    """Respuesta base de sesion."""

    id: uuid.UUID
    share_token: str
    nombre: str
    email: str
    profesion_actual: str
    edad: int
    current_phase: int
    status: str
    summary_json: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdultReconversionSessionDetailResponse(BaseModel):
    """Detalle recuperable de la sesion publica."""

    session: AdultReconversionSessionResponse
    completed_phases: list[str]
    phase_1_summary: AdultReconversionPhaseSummary | None = None
    phase_2_summary: AdultReconversionPhaseTwoSummary | None = None
    phase_3_summary: AdultReconversionPhaseThreeSummary | None = None
    phase_4_summary: AdultReconversionPhaseFourSummary | None = None


class AdultReconversionPhaseOneResponse(BaseModel):
    """Respuesta al guardar fase 1."""

    success: bool = True
    session_id: uuid.UUID
    current_phase: int
    phase_key: str
    summary: AdultReconversionPhaseSummary


class AdultReconversionPhaseTwoResponse(BaseModel):
    """Respuesta al guardar fase 2."""

    success: bool = True
    session_id: uuid.UUID
    current_phase: int
    phase_key: str
    summary: AdultReconversionPhaseTwoSummary


class AdultReconversionPhaseThreeResponse(BaseModel):
    """Respuesta al guardar fase 3."""

    success: bool = True
    session_id: uuid.UUID
    current_phase: int
    phase_key: str
    summary: AdultReconversionPhaseThreeSummary


class AdultReconversionPhaseFourResponse(BaseModel):
    """Respuesta al guardar fase 4."""

    success: bool = True
    session_id: uuid.UUID
    current_phase: int
    phase_key: str
    summary: AdultReconversionPhaseFourSummary


class AdultReconversionProfileSnapshot(BaseModel):
    """Resumen del perfil actual detectado."""

    profesion_actual: str
    fortalezas_transferibles: list[str]
    factores_que_drenan: list[str]


class AdultReconversionRouteRecommendation(BaseModel):
    """Ruta sugerida en el informe final."""

    nombre_ruta: str
    tipo: str
    porque_encaja: str
    felicidad_estimada: float
    ingreso_estimado: float
    friccion_cambio: float
    necesita_relocalizacion: bool
    relocalizacion_detalle: str
    necesita_ingles: bool
    ingles_detalle: str
    tiempo_reconversion_meses: int
    aprendizajes_sugeridos: list[str]


class AdultReconversionGraphPoint(BaseModel):
    """Punto del grafico bienestar vs ingreso."""

    ruta: str
    felicidad: float
    dinero: float


class AdultReconversionReportPayload(BaseModel):
    """Payload completo del informe final."""

    resumen_personalizado: str
    perfil_actual: AdultReconversionProfileSnapshot
    rutas_recomendadas: list[AdultReconversionRouteRecommendation]
    grafico_bienestar_ingreso: list[AdultReconversionGraphPoint]
    plan_30_dias: list[str]
    plan_90_dias: list[str]
    alertas: list[str]


class AdultReconversionGenerateReportResponse(BaseModel):
    """Respuesta al generar el informe final."""

    success: bool = True
    session_id: uuid.UUID
    share_token: str
    public_url: str
    model_name: str
    prompt_version: str
    generated_at: datetime | None = None
    report: AdultReconversionReportPayload


class AdultReconversionPublicReportResponse(BaseModel):
    """Vista pública del informe final."""

    success: bool = True
    share_token: str
    generated_at: datetime | None = None
    model_name: str
    prompt_version: str
    session: AdultReconversionSessionResponse
    report: AdultReconversionReportPayload


class AdultReconversionReviewItemResponse(BaseModel):
    """Resumen interno para revision de informes de reconversion."""

    session_id: uuid.UUID
    share_token: str
    public_url: str
    nombre: str
    email: str
    profesion_actual: str
    edad: int
    pais: str | None = None
    ciudad: str | None = None
    situacion_actual: str | None = None
    current_phase: int
    status: str
    resumen_personalizado: str
    top_routes: list[str]
    report_excerpt: str
    model_name: str
    prompt_version: str
    generated_at: datetime | None = None
    updated_at: datetime


class AdultReconversionReviewListResponse(BaseModel):
    """Listado interno de informes de reconversion."""

    items: list[AdultReconversionReviewItemResponse]
    total: int
