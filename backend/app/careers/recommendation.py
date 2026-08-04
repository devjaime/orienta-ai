"""
Vocari Backend - Motor de recomendaciones de carreras.

Calcula compatibilidad entre codigo Holland del estudiante y carreras disponibles.
"""


def calcular_compatibilidad(codigo_usuario: str, codigos_carrera: list[str]) -> float:
    """
    Calcula compatibilidad (0-100) entre un codigo Holland del usuario y los codigos de una carrera.

    Algoritmo:
    - Usa solo el primer codigo Holland de la carrera
    - Coincidencia exacta: primera letra = 40pts, segunda = 25pts, tercera = 15pts
    - Letra presente en otra posicion: 10pts
    - Requiere codigos completos de tres letras
    """
    if not codigo_usuario or not codigos_carrera:
        return 0.0

    codigo_carrera = codigos_carrera[0] if isinstance(codigos_carrera[0], str) else ""
    if len(codigo_usuario) < 3 or len(codigo_carrera) < 3:
        return 0.0

    score = 0.0
    weights = [40.0, 25.0, 15.0]

    for i, letra in enumerate(codigo_usuario[:3]):
        if codigo_carrera[i] == letra:
            score += weights[i]
        elif letra in codigo_carrera:
            score += 10.0

    return score


def generar_razones_match(
    codigo_usuario: str,
    codigos_carrera: list[str],
    nombre_carrera: str,
) -> list[str]:
    """Genera explicaciones legibles de por que una carrera es compatible."""
    razones: list[str] = []

    if not codigos_carrera:
        return razones

    # Combinar todos los codigos en un solo string
    codigo_combinado = ""
    for c in codigos_carrera:
        if isinstance(c, str):
            codigo_combinado += c

    dimension_nombres = {
        "R": "Realista",
        "I": "Investigador/a",
        "A": "Artistico/a",
        "S": "Social",
        "E": "Emprendedor/a",
        "C": "Convencional",
    }

    # Verificar cada letra del codigo del usuario
    for i, letra in enumerate(codigo_usuario[:3]):
        if letra in codigo_combinado:
            dim = dimension_nombres.get(letra, letra)
            if i == 0:
                razones.append(f"Tu dimensión principal ({dim}) coincide con esta carrera")
            elif i == 1:
                razones.append(f"Tu segunda dimensión ({dim}) también es relevante")
            elif i == 2:
                razones.append(f"Tu tercera dimensión ({dim}) está presente en esta carrera")

    if not razones:
        razones.append(f"{nombre_carrera} puede ampliar tu horizonte vocacional")

    return razones
