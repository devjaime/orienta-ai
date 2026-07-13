"""
Vocari Backend - Servicio de reconversion vocacional para adultos.
"""

import secrets
import uuid
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.common.exceptions import NotFoundError, ValidationError
from app.reconversion.models import (
    AdultReconversionPhaseResult,
    AdultReconversionReport,
    AdultReconversionSession,
)
from app.reconversion.schemas import (
    AdultReconversionGenerateReportResponse,
    AdultReconversionGraphPoint,
    AdultReconversionPhaseFourRequest,
    AdultReconversionPhaseFourSummary,
    AdultReconversionPhaseOneRequest,
    AdultReconversionPhaseSummary,
    AdultReconversionPhaseThreeRequest,
    AdultReconversionPhaseThreeSummary,
    AdultReconversionPhaseTwoRequest,
    AdultReconversionPhaseTwoSummary,
    AdultReconversionProfileSnapshot,
    AdultReconversionPublicReportResponse,
    AdultReconversionReportPayload,
    AdultReconversionReviewItemResponse,
    AdultReconversionReviewListResponse,
    AdultReconversionRouteRecommendation,
    AdultReconversionSessionCreateRequest,
    AdultReconversionSessionResponse,
)

PHASE_ONE_DIMENSIONS: dict[int, str] = {
    1: "energia_social",
    2: "energia_social",
    3: "energia_social",
    4: "energia_analitica",
    5: "energia_analitica",
    6: "energia_analitica",
    7: "energia_creativa",
    8: "energia_creativa",
    9: "energia_creativa",
    10: "energia_practica",
    11: "energia_practica",
    12: "energia_practica",
    13: "autonomia",
    14: "autonomia",
    15: "autonomia",
    16: "seguridad",
    17: "seguridad",
    18: "seguridad",
    19: "proposito",
    20: "proposito",
    21: "proposito",
    22: "aprendizaje",
    23: "aprendizaje",
    24: "aprendizaje",
    25: "liderazgo",
    26: "liderazgo",
    27: "liderazgo",
    28: "tolerancia_al_cambio",
    29: "tolerancia_al_cambio",
    30: "tolerancia_al_cambio",
}

DIMENSION_LABELS: dict[str, str] = {
    "energia_social": "energia social",
    "energia_analitica": "energia analitica",
    "energia_creativa": "energia creativa",
    "energia_practica": "energia practica",
    "autonomia": "autonomia",
    "seguridad": "seguridad",
    "proposito": "proposito",
    "aprendizaje": "aprendizaje",
    "liderazgo": "liderazgo",
    "tolerancia_al_cambio": "tolerancia al cambio",
}

PHASE_TWO_DIMENSIONS: dict[int, str] = {
    1: "personas",
    2: "personas",
    3: "personas",
    4: "analisis",
    5: "analisis",
    6: "analisis",
    7: "creatividad",
    8: "creatividad",
    9: "creatividad",
    10: "ejecucion",
    11: "ejecucion",
    12: "ejecucion",
}

PHASE_TWO_LABELS: dict[str, str] = {
    "personas": "trabajo con personas",
    "analisis": "analisis y resolucion",
    "creatividad": "creacion e ideacion",
    "ejecucion": "ejecucion y operacion",
}

PHASE_THREE_DIMENSIONS: dict[int, str] = {
    1: "people_guidance",
    2: "people_guidance",
    3: "analytical_depth",
    4: "analytical_depth",
    5: "creative_expression",
    6: "creative_expression",
    7: "operational_drive",
    8: "operational_drive",
    9: "autonomy_need",
    10: "autonomy_need",
    11: "transition_readiness",
    12: "transition_readiness",
}

PHASE_THREE_LABELS: dict[str, str] = {
    "people_guidance": "trabajo con personas y guia",
    "analytical_depth": "analisis y resolucion profunda",
    "creative_expression": "creacion y expresion",
    "operational_drive": "ejecucion concreta",
    "autonomy_need": "autonomia de trabajo",
    "transition_readiness": "disposicion real al cambio",
}

PHASE_ONE_TO_THREE_MAP: dict[str, str] = {
    "energia_social": "people_guidance",
    "energia_analitica": "analytical_depth",
    "energia_creativa": "creative_expression",
    "energia_practica": "operational_drive",
    "autonomia": "autonomy_need",
    "aprendizaje": "transition_readiness",
    "tolerancia_al_cambio": "transition_readiness",
    "proposito": "people_guidance",
}

PHASE_TWO_TO_THREE_MAP: dict[str, str] = {
    "personas": "people_guidance",
    "analisis": "analytical_depth",
    "creatividad": "creative_expression",
    "ejecucion": "operational_drive",
}

PHASE_FOUR_OPTION_SCORES: dict[int, dict[str, dict[str, int]]] = {
    1: {
        "a": {"security": 2},
        "b": {"security": 1, "future_growth": 1},
        "c": {"future_growth": 2, "change_drive": 1},
    },
    2: {
        "a": {"security": 2},
        "b": {"security": 1, "autonomy": 1},
        "c": {"autonomy": 2, "change_drive": 1},
    },
    3: {
        "a": {"people": 2},
        "b": {"people": 1, "systems": 1},
        "c": {"systems": 2},
    },
    4: {
        "a": {"study_ready": 1, "security": 1},
        "b": {"study_ready": 2, "future_growth": 1},
        "c": {"study_ready": 3, "future_growth": 1},
    },
    5: {
        "a": {"remote": 2},
        "b": {"remote": 1, "in_person": 1},
        "c": {"in_person": 2},
    },
    6: {
        "a": {"local_rooted": 2},
        "b": {"local_rooted": 1, "mobility": 1},
        "c": {"mobility": 2, "change_drive": 1},
    },
    7: {
        "a": {"local_rooted": 1, "security": 1},
        "b": {"english": 1, "future_growth": 1},
        "c": {"english": 2, "future_growth": 1},
    },
    8: {
        "a": {"security": 2},
        "b": {"security": 1, "change_drive": 1},
        "c": {"change_drive": 2, "autonomy": 1},
    },
}

PHASE_FOUR_MAX_SCORES: dict[str, int] = {
    "future_growth": 5,
    "security": 8,
    "autonomy": 3,
    "people": 2,
    "systems": 2,
    "study_ready": 3,
    "remote": 2,
    "in_person": 2,
    "mobility": 2,
    "local_rooted": 3,
    "english": 2,
    "change_drive": 5,
}

PHASE_FOUR_PROFILE_LABELS: dict[str, str] = {
    "future_growth": "crecimiento futuro",
    "security": "estabilidad y resguardo financiero",
    "autonomy": "autonomia laboral",
    "people": "trabajo con personas",
    "systems": "trabajo con sistemas o procesos",
    "study_ready": "disposicion a aprender y certificarte",
    "remote": "preferencia por flexibilidad remota",
    "in_person": "preferencia por trabajo presencial o de contacto",
    "mobility": "apertura a moverte si el cambio lo amerita",
}

RECONVERSION_ROUTE_TEMPLATES: list[dict] = [
    {
        "slug": "customer-success",
        "nombre_ruta": "Customer Success y Experiencia de Cliente",
        "tipo": "empleo",
        "base_income": 1_250_000,
        "tiempo_meses": 6,
        "friction_base": 34,
        "mobility": "optional",
        "requires_english": False,
        "risk": "medium",
        "energy_key": "personas",
        "phase_three_weights": {
            "people_guidance": 0.4,
            "operational_drive": 0.2,
            "autonomy_need": 0.15,
            "transition_readiness": 0.25,
        },
        "phase_four_weights": {
            "people": 0.3,
            "future_growth": 0.2,
            "remote": 0.15,
            "security": 0.15,
            "change_drive": 0.2,
        },
        "aprendizajes": [
            "gestion de clientes",
            "herramientas CRM",
            "comunicacion consultiva",
        ],
        "porque": "combina relacion humana, seguimiento y mejora de experiencia.",
    },
    {
        "slug": "analista-procesos",
        "nombre_ruta": "Analista de Procesos y Mejora Continua",
        "tipo": "empleo",
        "base_income": 1_350_000,
        "tiempo_meses": 8,
        "friction_base": 38,
        "mobility": "none",
        "requires_english": False,
        "risk": "low",
        "energy_key": "analisis",
        "phase_three_weights": {
            "analytical_depth": 0.4,
            "operational_drive": 0.25,
            "autonomy_need": 0.1,
            "transition_readiness": 0.25,
        },
        "phase_four_weights": {
            "systems": 0.25,
            "security": 0.2,
            "study_ready": 0.2,
            "future_growth": 0.15,
            "change_drive": 0.2,
        },
        "aprendizajes": [
            "mapeo de procesos",
            "excel o sheets avanzado",
            "indicadores operativos",
        ],
        "porque": "aprovecha tu capacidad de ordenar, diagnosticar y mejorar operaciones reales.",
    },
    {
        "slug": "analista-datos-junior",
        "nombre_ruta": "Analista de Datos Junior",
        "tipo": "reestudio",
        "base_income": 1_450_000,
        "tiempo_meses": 10,
        "friction_base": 46,
        "mobility": "none",
        "requires_english": True,
        "risk": "medium",
        "energy_key": "analisis",
        "phase_three_weights": {
            "analytical_depth": 0.5,
            "autonomy_need": 0.15,
            "transition_readiness": 0.35,
        },
        "phase_four_weights": {
            "systems": 0.25,
            "study_ready": 0.25,
            "future_growth": 0.2,
            "remote": 0.1,
            "english": 0.2,
        },
        "aprendizajes": [
            "SQL",
            "visualizacion de datos",
            "analisis con Python o BI",
        ],
        "porque": "tiene buen calce con perfiles que disfrutan entender datos y detectar patrones.",
    },
    {
        "slug": "marketing-contenidos",
        "nombre_ruta": "Marketing de Contenidos y Estrategia Digital",
        "tipo": "empleo",
        "base_income": 1_180_000,
        "tiempo_meses": 7,
        "friction_base": 40,
        "mobility": "none",
        "requires_english": False,
        "risk": "medium",
        "energy_key": "creatividad",
        "phase_three_weights": {
            "creative_expression": 0.45,
            "people_guidance": 0.15,
            "autonomy_need": 0.15,
            "transition_readiness": 0.25,
        },
        "phase_four_weights": {
            "future_growth": 0.25,
            "autonomy": 0.2,
            "remote": 0.15,
            "study_ready": 0.15,
            "change_drive": 0.25,
        },
        "aprendizajes": [
            "contenido digital",
            "copywriting",
            "metricas y embudos",
        ],
        "porque": "abre espacio para crear mensajes, propuestas y experiencias con impacto visible.",
    },
    {
        "slug": "diseno-instruccional",
        "nombre_ruta": "Diseno Instruccional y Formacion",
        "tipo": "empleo",
        "base_income": 1_220_000,
        "tiempo_meses": 8,
        "friction_base": 37,
        "mobility": "none",
        "requires_english": False,
        "risk": "low",
        "energy_key": "creatividad",
        "phase_three_weights": {
            "people_guidance": 0.3,
            "creative_expression": 0.35,
            "analytical_depth": 0.1,
            "transition_readiness": 0.25,
        },
        "phase_four_weights": {
            "people": 0.2,
            "study_ready": 0.25,
            "future_growth": 0.15,
            "security": 0.2,
            "change_drive": 0.2,
        },
        "aprendizajes": [
            "diseno de experiencias de aprendizaje",
            "facilitacion",
            "herramientas de contenido",
        ],
        "porque": "une guia a personas con estructuracion creativa de contenidos y experiencias.",
    },
    {
        "slug": "coordinacion-proyectos",
        "nombre_ruta": "Coordinacion de Proyectos",
        "tipo": "empleo",
        "base_income": 1_300_000,
        "tiempo_meses": 6,
        "friction_base": 33,
        "mobility": "optional",
        "requires_english": False,
        "risk": "low",
        "energy_key": "ejecucion",
        "phase_three_weights": {
            "operational_drive": 0.35,
            "people_guidance": 0.2,
            "autonomy_need": 0.15,
            "transition_readiness": 0.3,
        },
        "phase_four_weights": {
            "security": 0.2,
            "autonomy": 0.15,
            "people": 0.2,
            "future_growth": 0.15,
            "change_drive": 0.15,
            "in_person": 0.15,
        },
        "aprendizajes": [
            "gestion de proyectos",
            "seguimiento de hitos",
            "coordinacion de stakeholders",
        ],
        "porque": "permite convertir organizacion y ejecucion en un rol de avance concreto con personas.",
    },
    {
        "slug": "customer-operations",
        "nombre_ruta": "Customer Operations",
        "tipo": "empleo",
        "base_income": 1_240_000,
        "tiempo_meses": 6,
        "friction_base": 31,
        "mobility": "none",
        "requires_english": False,
        "risk": "low",
        "energy_key": "ejecucion",
        "phase_three_weights": {
            "operational_drive": 0.35,
            "analytical_depth": 0.2,
            "people_guidance": 0.15,
            "transition_readiness": 0.3,
        },
        "phase_four_weights": {
            "systems": 0.2,
            "security": 0.2,
            "future_growth": 0.15,
            "remote": 0.15,
            "change_drive": 0.15,
            "people": 0.15,
        },
        "aprendizajes": [
            "operacion de servicios",
            "automatizaciones livianas",
            "gestion de tickets y calidad",
        ],
        "porque": "combina ejecucion, orden y contacto con la experiencia real del cliente.",
    },
    {
        "slug": "servicios-freelance",
        "nombre_ruta": "Servicios Freelance Especializados",
        "tipo": "freelance",
        "base_income": 1_100_000,
        "tiempo_meses": 5,
        "friction_base": 49,
        "mobility": "none",
        "requires_english": False,
        "risk": "high",
        "energy_key": "creatividad",
        "phase_three_weights": {
            "autonomy_need": 0.35,
            "creative_expression": 0.25,
            "operational_drive": 0.1,
            "transition_readiness": 0.3,
        },
        "phase_four_weights": {
            "autonomy": 0.3,
            "remote": 0.2,
            "future_growth": 0.15,
            "change_drive": 0.25,
            "security": 0.1,
        },
        "aprendizajes": [
            "oferta de servicios",
            "portafolio",
            "captacion comercial",
        ],
        "porque": "es una ruta con mayor libertad para empaquetar habilidades transferibles y operar con autonomia.",
    },
]


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _readiness_label(score: float) -> str:
    if score >= 70:
        return "Alta"
    if score >= 50:
        return "Media"
    return "Baja"


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _weighted_score(source: dict[str, float], weights: dict[str, float]) -> float:
    total_weight = sum(weights.values()) or 1
    return round(
        sum(source.get(key, 0) * weight for key, weight in weights.items()) / total_weight,
        2,
    )


def _infer_transferable_strengths(
    session: AdultReconversionSession,
    phase_one_summary: AdultReconversionPhaseSummary,
) -> list[str]:
    profession = session.profesion_actual.lower()
    strengths: list[str] = []

    keyword_map = [
        (
            ("admin", "secret", "conta", "asistente"),
            ["orden operativo", "seguimiento de tareas", "detalle administrativo"],
        ),
        (
            ("venta", "comercial", "ejecutiv", "retail"),
            ["comunicacion persuasiva", "relacion con clientes", "resiliencia comercial"],
        ),
        (
            ("operaci", "logist", "terreno", "tecnico"),
            ["resolucion practica", "coordinacion operativa", "manejo de imprevistos"],
        ),
        (
            ("enfer", "profe", "docente", "social", "psico"),
            ["acompanamiento humano", "escucha activa", "guia de procesos"],
        ),
        (
            ("marketing", "dise", "contenido", "publici"),
            ["comunicacion creativa", "traduccion de ideas", "produccion de contenido"],
        ),
    ]

    for keywords, values in keyword_map:
        if any(keyword in profession for keyword in keywords):
            strengths.extend(values)
            break

    dimension_to_strength = {
        "energia_social": "vinculo con personas",
        "energia_analitica": "analisis estructurado",
        "energia_creativa": "pensamiento creativo",
        "energia_practica": "ejecucion concreta",
        "autonomia": "criterio propio",
        "aprendizaje": "capacidad de aprender rapido",
        "liderazgo": "coordinacion de otros",
        "proposito": "orientacion a impacto",
    }
    for dimension in phase_one_summary.top_dimensions:
        label = dimension_to_strength.get(dimension)
        if label and label not in strengths:
            strengths.append(label)

    return strengths[:4]


def _infer_route_fit(
    template: dict,
    phase_two_summary: AdultReconversionPhaseTwoSummary,
    phase_three_summary: AdultReconversionPhaseThreeSummary,
    phase_four_summary: AdultReconversionPhaseFourSummary,
) -> float:
    phase_three_fit = _weighted_score(
        phase_three_summary.confirmation_scores,
        template["phase_three_weights"],
    )
    phase_four_fit = _weighted_score(
        phase_four_summary.tradeoff_scores,
        template["phase_four_weights"],
    )
    energy_fit = phase_two_summary.energy_scores.get(template["energy_key"], 50)
    return round(phase_three_fit * 0.55 + phase_four_fit * 0.25 + energy_fit * 0.20, 2)


def _build_route_recommendation(
    template: dict,
    session: AdultReconversionSession,
    phase_two_summary: AdultReconversionPhaseTwoSummary,
    phase_three_summary: AdultReconversionPhaseThreeSummary,
    phase_four_summary: AdultReconversionPhaseFourSummary,
) -> AdultReconversionRouteRecommendation:
    route_fit = _infer_route_fit(
        template,
        phase_two_summary,
        phase_three_summary,
        phase_four_summary,
    )

    friction = float(template["friction_base"])
    current_english = (session.nivel_ingles or "").lower()
    low_english = current_english in {"", "nulo", "basico"}
    if template["requires_english"] and low_english:
        friction += 14
    if template["mobility"] == "recommended" and phase_four_summary.mobility_readiness == "Baja":
        friction += 14
    if template["tiempo_meses"] >= 8 and phase_four_summary.upskilling_readiness == "Baja":
        friction += 12
    if template["risk"] == "high" and phase_four_summary.tradeoff_scores.get("security", 0) >= 65:
        friction += 10

    friction = round(_clamp(friction, 18, 92), 2)

    happiness = round(
        _clamp(
            route_fit * 0.72
            + phase_four_summary.change_readiness * 0.18
            + (100 - friction) * 0.10,
            48,
            94,
        ),
        2,
    )

    income_estimate = float(template["base_income"])
    if session.ingreso_actual_aprox and phase_four_summary.tradeoff_scores.get("security", 0) >= 70:
        income_estimate = max(income_estimate, session.ingreso_actual_aprox * 0.92)

    needs_relocation = template["mobility"] == "recommended"
    relocation_detail = (
        "Puede abrirse mas rapido si consideras oportunidades fuera de tu ciudad."
        if needs_relocation
        else "Se puede explorar sin exigir una mudanza como condicion principal."
    )
    needs_english = bool(template["requires_english"])
    english_detail = (
        "Conviene subir el ingles a nivel funcional para capturar mejores oportunidades."
        if needs_english
        else "El ingles suma, pero no debiera bloquear el primer movimiento."
    )

    highest_signals = [
        label
        for label in phase_three_summary.confirmed_signals[:2]
        if label
    ]
    signals_text = ", ".join(highest_signals) if highest_signals else "las señales combinadas de tu perfil"
    because = (
        f"Encaja porque cruza {signals_text} con {template['porque']}"
    )

    return AdultReconversionRouteRecommendation(
        nombre_ruta=template["nombre_ruta"],
        tipo=template["tipo"],
        porque_encaja=because,
        felicidad_estimada=happiness,
        ingreso_estimado=round(income_estimate, 0),
        friccion_cambio=friction,
        necesita_relocalizacion=needs_relocation,
        relocalizacion_detalle=relocation_detail,
        necesita_ingles=needs_english,
        ingles_detalle=english_detail,
        tiempo_reconversion_meses=template["tiempo_meses"],
        aprendizajes_sugeridos=template["aprendizajes"],
    )


def _build_alerts(
    session: AdultReconversionSession,
    phase_three_summary: AdultReconversionPhaseThreeSummary,
    phase_four_summary: AdultReconversionPhaseFourSummary,
    top_routes: list[AdultReconversionRouteRecommendation],
) -> list[str]:
    alerts: list[str] = []
    if phase_four_summary.change_readiness < 55:
        alerts.append(
            "Tu deseo de cambio existe, pero conviene estructurarlo en pasos pequenos para no sabotear la ejecucion."
        )
    if phase_four_summary.tradeoff_scores.get("security", 0) >= 70:
        alerts.append(
            "La variable financiera pesa bastante en tus decisiones, asi que prioriza una reconversion con transicion protegida."
        )
    if phase_four_summary.upskilling_readiness == "Baja":
        alerts.append(
            "Una ruta con demasiada exigencia formativa podria agotarte; mejor partir por aprendizaje modular."
        )
    if (
        (session.nivel_ingles or "").lower() in {"", "nulo", "basico"}
        and any(route.necesita_ingles for route in top_routes)
    ):
        alerts.append(
            "El ingles no tiene que frenarte, pero si aparece como palanca importante en al menos una de tus mejores rutas."
        )
    if phase_three_summary.tension_signals:
        alerts.append(
            "Tus tensiones actuales ayudan a descartar contextos que probablemente volverian a drenarte."
        )
    return alerts[:4]


def _build_report_payload(
    session: AdultReconversionSession,
    phase_one_summary: AdultReconversionPhaseSummary,
    phase_two_summary: AdultReconversionPhaseTwoSummary,
    phase_three_summary: AdultReconversionPhaseThreeSummary,
    phase_four_summary: AdultReconversionPhaseFourSummary,
) -> AdultReconversionReportPayload:
    strengths = _infer_transferable_strengths(session, phase_one_summary)
    drains = (phase_two_summary.drain_map + phase_three_summary.tension_signals)[:4]
    current_profile = AdultReconversionProfileSnapshot(
        profesion_actual=session.profesion_actual,
        fortalezas_transferibles=strengths or ["experiencia acumulada en tu rol actual"],
        factores_que_drenan=drains or ["todavia no aparece un drenaje dominante"],
    )

    route_candidates = [
        _build_route_recommendation(
            template,
            session,
            phase_two_summary,
            phase_three_summary,
            phase_four_summary,
        )
        for template in RECONVERSION_ROUTE_TEMPLATES
    ]
    top_routes = sorted(
        route_candidates,
        key=lambda item: (item.felicidad_estimada, item.ingreso_estimado - item.friccion_cambio * 5000),
        reverse=True,
    )[:3]

    summary = (
        f"Vienes desde {session.profesion_actual} y el cruce entre tus respuestas, "
        "tu energia real y tus decisiones de cambio sugiere que tu mejor reconversion no pasa por "
        "repetir exactamente tu contexto actual, sino por moverte hacia trabajos que combinen "
        f"{', '.join(phase_four_summary.tradeoff_profile[:2]) if phase_four_summary.tradeoff_profile else 'mejor ajuste personal'}."
    )

    graph_points = [
        AdultReconversionGraphPoint(
            ruta=route.nombre_ruta,
            felicidad=route.felicidad_estimada,
            dinero=route.ingreso_estimado,
        )
        for route in top_routes
    ]

    plan_30_dias = [
        f"Elegir una ruta principal entre {top_routes[0].nombre_ruta} y {top_routes[1].nombre_ruta if len(top_routes) > 1 else top_routes[0].nombre_ruta}.",
        f"Hacer una auditoria de habilidades transferibles enfocada en {', '.join(strengths[:3])}.",
        f"Tomar una micro-accion concreta: {top_routes[0].aprendizajes_sugeridos[0]} y un proyecto pequeno de prueba.",
    ]

    plan_90_dias = [
        f"Construir evidencia publica o portafolio en torno a {top_routes[0].nombre_ruta}.",
        f"Completar un tramo de aprendizaje practico: {', '.join(top_routes[0].aprendizajes_sugeridos[:2])}.",
        "Conversar con al menos 3 personas del area para validar realidad salarial, entrada y fricciones.",
    ]

    alerts = _build_alerts(
        session,
        phase_three_summary,
        phase_four_summary,
        top_routes,
    )

    return AdultReconversionReportPayload(
        resumen_personalizado=summary,
        perfil_actual=current_profile,
        rutas_recomendadas=top_routes,
        grafico_bienestar_ingreso=graph_points,
        plan_30_dias=plan_30_dias,
        plan_90_dias=plan_90_dias,
        alertas=alerts,
    )


def _build_report_text(report: AdultReconversionReportPayload) -> str:
    route_lines = "\n".join(
        [
            f"- {route.nombre_ruta}: bienestar estimado {route.felicidad_estimada}/100, ingreso estimado {int(route.ingreso_estimado)} CLP, friccion {route.friccion_cambio}/100."
            for route in report.rutas_recomendadas
        ]
    )
    return (
        f"{report.resumen_personalizado}\n\n"
        f"Fortalezas transferibles: {', '.join(report.perfil_actual.fortalezas_transferibles)}.\n"
        f"Factores que drenan: {', '.join(report.perfil_actual.factores_que_drenan)}.\n\n"
        f"Rutas recomendadas:\n{route_lines}\n\n"
        f"Plan 30 dias: {' | '.join(report.plan_30_dias)}\n"
        f"Plan 90 dias: {' | '.join(report.plan_90_dias)}"
    )


def _score_phase_one(answers: dict[int, int]) -> AdultReconversionPhaseSummary:
    grouped_scores: dict[str, list[int]] = {}

    for question_id, answer_value in answers.items():
        dimension = PHASE_ONE_DIMENSIONS[question_id]
        grouped_scores.setdefault(dimension, []).append(answer_value)

    dimension_scores = {
        dimension: round((sum(values) / len(values)) * 20, 2)
        for dimension, values in grouped_scores.items()
        if values
    }
    top_dimensions = [
        dimension
        for dimension, _score in sorted(
            dimension_scores.items(),
            key=lambda item: item[1],
            reverse=True,
        )[:3]
    ]

    top_labels = [DIMENSION_LABELS.get(item, item) for item in top_dimensions]
    profile_summary = (
        "Tu perfil inicial muestra mayor afinidad con "
        f"{', '.join(top_labels[:2])}"
    )
    if len(top_labels) >= 3:
        profile_summary += f", junto con una señal importante en {top_labels[2]}"
    profile_summary += "."

    spread = max(dimension_scores.values()) - min(dimension_scores.values())
    consistency_hint = (
        "Tus respuestas se ven bastante coherentes, lo que nos da una primera base solida."
        if spread >= 18
        else "Tu perfil parece mas abierto o mixto; por eso conviene profundizar con desafios posteriores."
    )

    return AdultReconversionPhaseSummary(
        dimension_scores=dimension_scores,
        top_dimensions=top_dimensions,
        profile_summary=profile_summary,
        consistency_hint=consistency_hint,
    )


def _score_phase_two(answers: dict[int, str]) -> AdultReconversionPhaseTwoSummary:
    grouped_scores: dict[str, int] = {}
    energy_counts: dict[str, int] = {}
    drain_counts: dict[str, int] = {}
    score_map = {"energiza": 2, "neutral": 0, "drena": -2}

    for scenario_id, answer_value in answers.items():
        dimension = PHASE_TWO_DIMENSIONS[scenario_id]
        grouped_scores[dimension] = grouped_scores.get(dimension, 0) + score_map[answer_value]
        if answer_value == "energiza":
            energy_counts[dimension] = energy_counts.get(dimension, 0) + 1
        if answer_value == "drena":
            drain_counts[dimension] = drain_counts.get(dimension, 0) + 1

    energy_scores = {
        dimension: round(((score + 6) / 12) * 100, 2)
        for dimension, score in grouped_scores.items()
    }

    energy_map = [
        PHASE_TWO_LABELS[dimension]
        for dimension, _score in sorted(
            grouped_scores.items(),
            key=lambda item: item[1],
            reverse=True,
        )
        if _score > 0
    ][:3]

    drain_map = [
        PHASE_TWO_LABELS[dimension]
        for dimension, _score in sorted(
            grouped_scores.items(),
            key=lambda item: item[1],
        )
        if _score < 0
    ][:3]

    dominant_work_modes = []
    if energy_counts.get("personas", 0) >= 2:
        dominant_work_modes.append("interaccion humana frecuente")
    if energy_counts.get("analisis", 0) >= 2:
        dominant_work_modes.append("trabajo analitico o de resolucion")
    if energy_counts.get("creatividad", 0) >= 2:
        dominant_work_modes.append("espacios para crear y proponer")
    if energy_counts.get("ejecucion", 0) >= 2:
        dominant_work_modes.append("implementacion y avance concreto")

    if not dominant_work_modes:
        dominant_work_modes.append("un entorno mixto con mas exploracion")

    if energy_map:
        challenge_readout = (
            "Este desafio muestra que hoy te activan especialmente "
            f"{', '.join(energy_map[:2])}."
        )
    else:
        challenge_readout = (
            "Este desafio muestra una senal mas mixta; todavia no aparece una fuente de energia claramente dominante."
        )

    if drain_map:
        transition_signal = (
            "Para una reconversion sana conviene alejarte de contextos dominados por "
            f"{', '.join(drain_map[:2])}."
        )
    else:
        transition_signal = (
            "No aparece un drenaje fuerte en esta etapa, lo que sugiere buena apertura para explorar varios caminos."
        )

    return AdultReconversionPhaseTwoSummary(
        energy_scores=energy_scores,
        energy_map=energy_map,
        drain_map=drain_map,
        dominant_work_modes=dominant_work_modes,
        challenge_readout=challenge_readout,
        transition_signal=transition_signal,
    )


def _score_phase_three(
    answers: dict[int, int],
    phase_one_summary: AdultReconversionPhaseSummary,
    phase_two_summary: AdultReconversionPhaseTwoSummary,
) -> AdultReconversionPhaseThreeSummary:
    grouped_scores: dict[str, list[int]] = {}
    for question_id, answer_value in answers.items():
        dimension = PHASE_THREE_DIMENSIONS[question_id]
        grouped_scores.setdefault(dimension, []).append(answer_value)

    confirmation_scores = {
        dimension: round((sum(values) / len(values)) * 20, 2)
        for dimension, values in grouped_scores.items()
        if values
    }

    confirmed_signals = [
        PHASE_THREE_LABELS[dimension]
        for dimension, score in sorted(
            confirmation_scores.items(),
            key=lambda item: item[1],
            reverse=True,
        )
        if score >= 70
    ][:3]

    tension_signals = [
        PHASE_THREE_LABELS[dimension]
        for dimension, score in sorted(
            confirmation_scores.items(),
            key=lambda item: item[1],
        )
        if score <= 45
    ][:3]

    base_confidence = sum(confirmation_scores.values()) / max(len(confirmation_scores), 1)
    alignment_bonus = 0.0

    for old_dimension in phase_one_summary.top_dimensions:
        mapped_dimension = PHASE_ONE_TO_THREE_MAP.get(old_dimension)
        if mapped_dimension and confirmation_scores.get(mapped_dimension, 0) >= 65:
            alignment_bonus += 5

    for old_dimension, score in phase_two_summary.energy_scores.items():
        mapped_dimension = PHASE_TWO_TO_THREE_MAP.get(old_dimension)
        if mapped_dimension and score >= 60 and confirmation_scores.get(mapped_dimension, 0) >= 65:
            alignment_bonus += 5

    confidence_score = min(100.0, round(base_confidence * 0.7 + alignment_bonus, 2))
    if confidence_score >= 75:
        confidence_label = "Alta"
    elif confidence_score >= 55:
        confidence_label = "Media"
    else:
        confidence_label = "Exploratoria"

    if confirmed_signals:
        confirmation_readout = (
            "La tercera fase confirma con mas fuerza una preferencia por "
            f"{', '.join(confirmed_signals[:2])}."
        )
    else:
        confirmation_readout = (
            "La tercera fase todavia muestra un perfil abierto, por lo que conviene seguir contrastando escenarios."
        )

    if tension_signals:
        confirmation_readout += (
            " Tambien aparece tension en "
            f"{', '.join(tension_signals[:2])}, lo que ayuda a descartar caminos menos sostenibles."
        )

    return AdultReconversionPhaseThreeSummary(
        confirmation_scores=confirmation_scores,
        confirmed_signals=confirmed_signals,
        tension_signals=tension_signals,
        confidence_score=confidence_score,
        confidence_label=confidence_label,
        confirmation_readout=confirmation_readout,
    )


def _score_phase_four(
    answers: dict[int, str],
    session: AdultReconversionSession,
    phase_three_summary: AdultReconversionPhaseThreeSummary,
) -> AdultReconversionPhaseFourSummary:
    raw_scores = {metric: 0 for metric in PHASE_FOUR_MAX_SCORES}

    for scenario_id, option in answers.items():
        option_scores = PHASE_FOUR_OPTION_SCORES[scenario_id][option]
        for metric, increment in option_scores.items():
            raw_scores[metric] = raw_scores.get(metric, 0) + increment

    tradeoff_scores = {
        metric: round((raw_scores[metric] / maximum) * 100, 2)
        for metric, maximum in PHASE_FOUR_MAX_SCORES.items()
        if maximum > 0
    }

    profile_candidates = [
        (metric, score)
        for metric, score in tradeoff_scores.items()
        if metric in PHASE_FOUR_PROFILE_LABELS and score >= 45
    ]
    tradeoff_profile = [
        PHASE_FOUR_PROFILE_LABELS[metric]
        for metric, _score in sorted(
            profile_candidates,
            key=lambda item: item[1],
            reverse=True,
        )[:4]
    ]

    transition_anchor = phase_three_summary.confirmation_scores.get(
        "transition_readiness",
        0,
    )
    behavioral_change = (
        tradeoff_scores["future_growth"] * 0.25
        + tradeoff_scores["autonomy"] * 0.15
        + tradeoff_scores["study_ready"] * 0.2
        + tradeoff_scores["mobility"] * 0.1
        + tradeoff_scores["english"] * 0.1
        + tradeoff_scores["change_drive"] * 0.2
    )
    change_readiness = round(
        transition_anchor * 0.45 + behavioral_change * 0.55,
        2,
    )

    declared_mobility = {
        "ninguna": 10,
        "regional": 55,
        "internacional": 85,
    }.get((session.disponibilidad_para_relocalizarse or "").lower(), 35)
    mobility_score = round(
        tradeoff_scores["mobility"] * 0.7 + declared_mobility * 0.3,
        2,
    )
    mobility_readiness = _readiness_label(mobility_score)

    declared_study = {
        "baja": 20,
        "media": 55,
        "alta": 85,
    }.get((session.disponibilidad_para_estudiar or "").lower(), 40)
    upskilling_score = round(
        (
            tradeoff_scores["study_ready"] * 0.6
            + tradeoff_scores["english"] * 0.15
            + declared_study * 0.25
        ),
        2,
    )
    upskilling_readiness = _readiness_label(upskilling_score)

    setup_gap = tradeoff_scores["remote"] - tradeoff_scores["in_person"]
    if setup_gap >= 20:
        preferred_work_setup = "Prefieres una estructura remota o muy flexible."
    elif setup_gap <= -20:
        preferred_work_setup = "Prefieres una estructura presencial o con contacto frecuente."
    else:
        preferred_work_setup = "Tu mejor ajuste parece estar en un esquema hibrido."

    growth_gap = tradeoff_scores["future_growth"] - tradeoff_scores["security"]
    if growth_gap >= 15:
        income_tension = "Aceptas resignar algo de seguridad hoy a cambio de mayor proyeccion futura."
    elif growth_gap <= -15:
        income_tension = "Necesitas cuidar ingresos y estabilidad de corto plazo mientras haces el cambio."
    else:
        income_tension = "Buscas un equilibrio entre seguridad presente y crecimiento futuro."

    constraints_to_respect: list[str] = []
    if tradeoff_scores["security"] >= 70:
        constraints_to_respect.append(
            "La reconversion debiera proteger tu estabilidad financiera inicial."
        )
    if tradeoff_scores["local_rooted"] > tradeoff_scores["mobility"]:
        constraints_to_respect.append(
            "Conviene priorizar caminos compatibles con tu ciudad actual."
        )
    if upskilling_score < 50:
        constraints_to_respect.append(
            "La ruta ideal debiera permitir aprendizaje modular y aplicacion rapida."
        )
    if tradeoff_scores["english"] < 45 and (session.nivel_ingles or "").lower() in {
        "nulo",
        "basico",
    }:
        constraints_to_respect.append(
            "Es mejor partir por opciones locales o donde el ingles pueda crecer de forma gradual."
        )

    if not constraints_to_respect:
        constraints_to_respect.append(
            "Tienes una base flexible para explorar rutas con mediana o alta transformacion."
        )

    priorities_text = (
        ", ".join(tradeoff_profile[:2])
        if tradeoff_profile
        else "equilibrio entre varias alternativas"
    )
    decision_summary = (
        "Tus decisiones muestran que hoy priorizas "
        f"{priorities_text}. "
        f"Tu disposicion al cambio se ve {change_readiness:.0f}/100, "
        f"con movilidad {mobility_readiness.lower()} y aprendizaje {upskilling_readiness.lower()}."
    )

    return AdultReconversionPhaseFourSummary(
        tradeoff_scores=tradeoff_scores,
        tradeoff_profile=tradeoff_profile,
        change_readiness=change_readiness,
        mobility_readiness=mobility_readiness,
        upskilling_readiness=upskilling_readiness,
        preferred_work_setup=preferred_work_setup,
        income_tension=income_tension,
        decision_summary=decision_summary,
        constraints_to_respect=constraints_to_respect[:3],
    )


async def create_public_session(
    db: AsyncSession,
    data: AdultReconversionSessionCreateRequest,
) -> AdultReconversionSession:
    """Crea una sesion publica de reconversion."""
    session = AdultReconversionSession(
        share_token=secrets.token_urlsafe(24),
        nombre=data.nombre.strip(),
        email=_normalize_email(data.email),
        profesion_actual=data.profesion_actual.strip(),
        edad=data.edad,
        pais=data.pais.strip() if data.pais else None,
        ciudad=data.ciudad.strip() if data.ciudad else None,
        nivel_educativo=data.nivel_educativo.strip() if data.nivel_educativo else None,
        ingreso_actual_aprox=data.ingreso_actual_aprox,
        nivel_ingles=data.nivel_ingles.strip() if data.nivel_ingles else None,
        situacion_actual=data.situacion_actual.strip() if data.situacion_actual else None,
        disponibilidad_para_estudiar=(
            data.disponibilidad_para_estudiar.strip()
            if data.disponibilidad_para_estudiar
            else None
        ),
        disponibilidad_para_relocalizarse=(
            data.disponibilidad_para_relocalizarse.strip()
            if data.disponibilidad_para_relocalizarse
            else None
        ),
        current_phase=0,
        status="in_progress",
        summary_json={},
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_session_by_id(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> AdultReconversionSession:
    """Obtiene una sesion publica por id."""
    result = await db.execute(
        select(AdultReconversionSession).where(AdultReconversionSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError("Sesion de reconversion no encontrada")
    return session


async def get_session_by_share_token(
    db: AsyncSession,
    share_token: str,
) -> AdultReconversionSession:
    """Obtiene una sesion publica por share token."""
    result = await db.execute(
        select(AdultReconversionSession).where(
            AdultReconversionSession.share_token == share_token
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError("Sesion de reconversion no encontrada")
    return session


async def get_completed_phases(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> list[str]:
    """Obtiene las fases completas de la sesion."""
    result = await db.execute(
        select(AdultReconversionPhaseResult.phase_key)
        .where(AdultReconversionPhaseResult.session_id == session_id)
        .order_by(AdultReconversionPhaseResult.completed_at.asc())
    )
    return [row[0] for row in result.all()]


async def get_phase_result(
    db: AsyncSession,
    session_id: uuid.UUID,
    phase_key: str,
) -> AdultReconversionPhaseResult | None:
    """Obtiene un resultado de fase por sesion y clave."""
    result = await db.execute(
        select(AdultReconversionPhaseResult).where(
            AdultReconversionPhaseResult.session_id == session_id,
            AdultReconversionPhaseResult.phase_key == phase_key,
        )
    )
    return result.scalar_one_or_none()


async def get_report_record(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> AdultReconversionReport | None:
    """Obtiene el ultimo reporte generado para una sesion."""
    result = await db.execute(
        select(AdultReconversionReport)
        .where(AdultReconversionReport.session_id == session_id)
        .order_by(AdultReconversionReport.updated_at.desc())
    )
    return result.scalars().first()


async def submit_phase_one(
    db: AsyncSession,
    session_id: uuid.UUID,
    data: AdultReconversionPhaseOneRequest,
) -> AdultReconversionPhaseSummary:
    """Guarda la fase 1 y calcula el resumen base."""
    session = await get_session_by_id(db, session_id)
    summary = _score_phase_one(data.answers)

    phase_result = await get_phase_result(db, session_id, "phase_1")
    if phase_result is None:
        phase_result = AdultReconversionPhaseResult(
            session_id=session_id,
            phase_key="phase_1",
            answers_json={"answers": data.answers},
            derived_scores_json=summary.model_dump(),
        )
        db.add(phase_result)
    else:
        phase_result.answers_json = {"answers": data.answers}
        phase_result.derived_scores_json = summary.model_dump()

    session.current_phase = max(session.current_phase, 1)
    session.summary_json = {
        **(session.summary_json or {}),
        "phase_1": summary.model_dump(),
    }

    await db.commit()
    return summary


async def submit_phase_two(
    db: AsyncSession,
    session_id: uuid.UUID,
    data: AdultReconversionPhaseTwoRequest,
) -> AdultReconversionPhaseTwoSummary:
    """Guarda la fase 2 y calcula el resumen del desafio intencional."""
    session = await get_session_by_id(db, session_id)
    summary = _score_phase_two(data.answers)

    phase_result = await get_phase_result(db, session_id, "phase_2")
    if phase_result is None:
        phase_result = AdultReconversionPhaseResult(
            session_id=session_id,
            phase_key="phase_2",
            answers_json={"answers": data.answers},
            derived_scores_json=summary.model_dump(),
        )
        db.add(phase_result)
    else:
        phase_result.answers_json = {"answers": data.answers}
        phase_result.derived_scores_json = summary.model_dump()

    session.current_phase = max(session.current_phase, 2)
    session.summary_json = {
        **(session.summary_json or {}),
        "phase_2": summary.model_dump(),
    }

    await db.commit()
    return summary


async def submit_phase_three(
    db: AsyncSession,
    session_id: uuid.UUID,
    data: AdultReconversionPhaseThreeRequest,
) -> AdultReconversionPhaseThreeSummary:
    """Guarda la fase 3 y calcula la señal confirmatoria."""
    session = await get_session_by_id(db, session_id)
    phase_one_result = await get_phase_result(db, session_id, "phase_1")
    phase_two_result = await get_phase_result(db, session_id, "phase_2")

    if phase_one_result is None or phase_two_result is None:
        raise ValidationError("Debes completar fase 1 y fase 2 antes de enviar fase 3")

    phase_one_summary = AdultReconversionPhaseSummary.model_validate(
        phase_one_result.derived_scores_json
    )
    phase_two_summary = AdultReconversionPhaseTwoSummary.model_validate(
        phase_two_result.derived_scores_json
    )
    summary = _score_phase_three(data.answers, phase_one_summary, phase_two_summary)

    phase_result = await get_phase_result(db, session_id, "phase_3")
    if phase_result is None:
        phase_result = AdultReconversionPhaseResult(
            session_id=session_id,
            phase_key="phase_3",
            answers_json={"answers": data.answers},
            derived_scores_json=summary.model_dump(),
        )
        db.add(phase_result)
    else:
        phase_result.answers_json = {"answers": data.answers}
        phase_result.derived_scores_json = summary.model_dump()

    session.current_phase = max(session.current_phase, 3)
    session.summary_json = {
        **(session.summary_json or {}),
        "phase_3": summary.model_dump(),
    }

    await db.commit()
    return summary


async def submit_phase_four(
    db: AsyncSession,
    session_id: uuid.UUID,
    data: AdultReconversionPhaseFourRequest,
) -> AdultReconversionPhaseFourSummary:
    """Guarda la fase 4 y calcula el perfil de trade-offs."""
    session = await get_session_by_id(db, session_id)
    phase_three_result = await get_phase_result(db, session_id, "phase_3")

    if phase_three_result is None:
        raise ValidationError("Debes completar fase 3 antes de enviar fase 4")

    phase_three_summary = AdultReconversionPhaseThreeSummary.model_validate(
        phase_three_result.derived_scores_json
    )
    summary = _score_phase_four(data.answers, session, phase_three_summary)

    phase_result = await get_phase_result(db, session_id, "phase_4")
    if phase_result is None:
        phase_result = AdultReconversionPhaseResult(
            session_id=session_id,
            phase_key="phase_4",
            answers_json={"answers": data.answers},
            derived_scores_json=summary.model_dump(),
        )
        db.add(phase_result)
    else:
        phase_result.answers_json = {"answers": data.answers}
        phase_result.derived_scores_json = summary.model_dump()

    session.current_phase = max(session.current_phase, 4)
    session.status = "ready_for_report"
    session.summary_json = {
        **(session.summary_json or {}),
        "phase_4": summary.model_dump(),
    }

    await db.commit()
    return summary


async def generate_report(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> AdultReconversionGenerateReportResponse:
    """Genera o actualiza el informe final de reconversion para una sesion."""
    session = await get_session_by_id(db, session_id)
    phase_one_result = await get_phase_result(db, session_id, "phase_1")
    phase_two_result = await get_phase_result(db, session_id, "phase_2")
    phase_three_result = await get_phase_result(db, session_id, "phase_3")
    phase_four_result = await get_phase_result(db, session_id, "phase_4")

    if not all([phase_one_result, phase_two_result, phase_three_result, phase_four_result]):
        raise ValidationError("Debes completar fases 1 a 4 antes de generar el informe final")

    phase_one_summary = AdultReconversionPhaseSummary.model_validate(
        phase_one_result.derived_scores_json
    )
    phase_two_summary = AdultReconversionPhaseTwoSummary.model_validate(
        phase_two_result.derived_scores_json
    )
    phase_three_summary = AdultReconversionPhaseThreeSummary.model_validate(
        phase_three_result.derived_scores_json
    )
    phase_four_summary = AdultReconversionPhaseFourSummary.model_validate(
        phase_four_result.derived_scores_json
    )

    report_payload = _build_report_payload(
        session,
        phase_one_summary,
        phase_two_summary,
        phase_three_summary,
        phase_four_summary,
    )
    report_text = _build_report_text(report_payload)

    report_record = await get_report_record(db, session_id)
    if report_record is None:
        report_record = AdultReconversionReport(
            session_id=session_id,
            report_json=report_payload.model_dump(),
            report_text=report_text,
            model_name="heuristic-local",
            prompt_version="adult-reconversion-v1",
        )
        db.add(report_record)
    else:
        report_record.report_json = report_payload.model_dump()
        report_record.report_text = report_text
        report_record.model_name = "heuristic-local"
        report_record.prompt_version = "adult-reconversion-v1"

    session.status = "report_ready"
    session.summary_json = {
        **(session.summary_json or {}),
        "report_ready": True,
    }

    await db.commit()
    await db.refresh(report_record)

    return AdultReconversionGenerateReportResponse(
        success=True,
        session_id=session.id,
        share_token=session.share_token,
        public_url=f"/informe-reconversion/{session.share_token}",
        model_name=report_record.model_name,
        prompt_version=report_record.prompt_version,
        generated_at=report_record.updated_at,
        report=report_payload,
    )


async def get_public_report(
    db: AsyncSession,
    share_token: str,
) -> AdultReconversionPublicReportResponse:
    """Obtiene la vista pública del informe final."""
    session = await get_session_by_share_token(db, share_token)
    report_record = await get_report_record(db, session.id)

    if report_record is None:
        raise NotFoundError("Informe de reconversion no encontrado")

    return AdultReconversionPublicReportResponse(
        success=True,
        share_token=session.share_token,
        generated_at=report_record.updated_at,
        model_name=report_record.model_name,
        prompt_version=report_record.prompt_version,
        session=AdultReconversionSessionResponse.model_validate(session),
        report=AdultReconversionReportPayload.model_validate(report_record.report_json),
    )


async def list_review_reports(
    db: AsyncSession,
    user: User,
    search: str | None = None,
    status: str | None = None,
    generated_from: date | None = None,
    generated_to: date | None = None,
    limit: int = 50,
) -> AdultReconversionReviewListResponse:
    """Lista informes generados para revision interna de orientacion."""
    del user  # El control de acceso se resuelve en el router.

    normalized_search = search.strip() if search else None
    normalized_status = status.strip() if status else None

    filters = []
    if normalized_search:
        pattern = f"%{normalized_search}%"
        filters.append(
            or_(
                AdultReconversionSession.nombre.ilike(pattern),
                AdultReconversionSession.email.ilike(pattern),
                AdultReconversionSession.profesion_actual.ilike(pattern),
            )
        )

    if normalized_status:
        filters.append(AdultReconversionSession.status == normalized_status)

    if generated_from:
        generated_from_dt = datetime.combine(
            generated_from,
            time.min,
            tzinfo=UTC,
        )
        filters.append(AdultReconversionReport.updated_at >= generated_from_dt)

    if generated_to:
        generated_to_dt = datetime.combine(
            generated_to + timedelta(days=1),
            time.min,
            tzinfo=UTC,
        )
        filters.append(AdultReconversionReport.updated_at < generated_to_dt)

    count_query = (
        select(func.count())
        .select_from(AdultReconversionReport)
        .join(
            AdultReconversionSession,
            AdultReconversionSession.id == AdultReconversionReport.session_id,
        )
    )
    if filters:
        count_query = count_query.where(*filters)

    total = (await db.execute(count_query)).scalar_one()

    query = (
        select(AdultReconversionSession, AdultReconversionReport)
        .join(
            AdultReconversionReport,
            AdultReconversionReport.session_id == AdultReconversionSession.id,
        )
        .order_by(AdultReconversionReport.updated_at.desc())
        .limit(limit)
    )
    if filters:
        query = query.where(*filters)

    rows = (await db.execute(query)).all()

    items = [
        AdultReconversionReviewItemResponse(
            session_id=session.id,
            share_token=session.share_token,
            public_url=f"/informe-reconversion/{session.share_token}",
            nombre=session.nombre,
            email=session.email,
            profesion_actual=session.profesion_actual,
            edad=session.edad,
            pais=session.pais,
            ciudad=session.ciudad,
            situacion_actual=session.situacion_actual,
            current_phase=session.current_phase,
            status=session.status,
            resumen_personalizado=str(
                (report.report_json or {}).get("resumen_personalizado", "")
            ),
            top_routes=[
                str(route.get("nombre_ruta", ""))
                for route in (report.report_json or {}).get("rutas_recomendadas", [])
                if route.get("nombre_ruta")
            ][:3],
            report_excerpt=(
                report.report_text[:280] + "..."
                if len(report.report_text) > 280
                else report.report_text
            ),
            model_name=report.model_name,
            prompt_version=report.prompt_version,
            generated_at=report.updated_at,
            updated_at=session.updated_at,
        )
        for session, report in rows
    ]

    return AdultReconversionReviewListResponse(items=items, total=total)
