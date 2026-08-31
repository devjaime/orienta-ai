"""
Vocari Backend - Catalogo inicial del recorrido adulto.
"""

ADULT_PATH_SLUG = "adult-reconversion-v1"
ADULT_PATH_TITLE = "Reconversion adulta"

JOURNEY_NODES: list[dict] = [
    {
        "slug": "objetivo",
        "node_type": "onboarding",
        "title": "Elige tu objetivo",
        "position": 0,
        "prerequisites": [],
        "xp_reward": 10,
        "estimated_minutes": 5,
    },
    {
        "slug": "diagnostico",
        "node_type": "diagnostic",
        "title": "Diagnostico base",
        "position": 1,
        "prerequisites": ["objetivo"],
        "xp_reward": 40,
        "estimated_minutes": 8,
    },
    {
        "slug": "energia",
        "node_type": "challenge",
        "title": "Mapa de energia",
        "position": 2,
        "prerequisites": ["diagnostico"],
        "xp_reward": 25,
        "estimated_minutes": 6,
    },
    {
        "slug": "habilidades",
        "node_type": "challenge",
        "title": "Habilidades transferibles",
        "position": 3,
        "prerequisites": ["energia"],
        "xp_reward": 25,
        "estimated_minutes": 6,
    },
    {
        "slug": "tradeoffs",
        "node_type": "challenge",
        "title": "Decisiones con trade-offs",
        "position": 4,
        "prerequisites": ["habilidades"],
        "xp_reward": 25,
        "estimated_minutes": 7,
    },
    {
        "slug": "mapa",
        "node_type": "results",
        "title": "Mapa de posibilidades",
        "position": 5,
        "prerequisites": ["tradeoffs"],
        "xp_reward": 20,
        "estimated_minutes": 6,
    },
    {
        "slug": "plan-30",
        "node_type": "action_plan",
        "title": "Plan de 30 dias",
        "position": 6,
        "prerequisites": ["mapa"],
        "xp_reward": 30,
        "estimated_minutes": 8,
    },
]

ACHIEVEMENTS: list[dict] = [
    {
        "slug": "primera-mision",
        "title": "Primera mision",
        "description": "Completaste una mision de exploracion.",
    },
    {
        "slug": "comparar-rutas",
        "title": "Contrastar rutas",
        "description": "Revisaste hipotesis de futuro con senales y limites.",
    },
    {
        "slug": "plan-iniciado",
        "title": "Plan en marcha",
        "description": "Convertiste una hipotesis en acciones de 30 dias.",
    },
]

PLAN_TEMPLATES: list[str] = [
    "Revisar tres ofertas reales del area elegida y anotar requisitos comunes.",
    "Conversar 20 minutos con alguien que trabaje en esa ruta.",
    "Probar una tarea pequena del oficio durante 45 minutos.",
    "Ajustar la hipotesis segun energia, friccion y evidencia reunida.",
]
