"""
Vocari Backend - Motor de recomendaciones de carreras.

Calcula compatibilidad entre codigo Holland del estudiante y carreras disponibles.
"""


def calcular_compatibilidad(codigo_usuario: str, codigos_carrera: list[str]) -> float:
    """
    Calcula compatibilidad (0-100) entre un codigo Holland de usuario y los codigos de una carrera.

    Algoritmo:
    - Match exacto en posicion: peso decreciente (40, 25, 15)
    - Match parcial (letra presente pero en otra posicion): +10
    - Maximo posible: 100
    """
    if not codigo_usuario or not codigos_carrera:
        return 0.0

    # Usar el primer codigo de carrera si es lista
    codigo_carrera = codigos_carrera[0] if codigos_carrera else ""
    if len(codigo_carrera) < 3 or len(codigo_usuario) < 3:
        return 0.0

    score = 0.0
    weights = [40.0, 25.0, 15.0]

    for i in range(min(3, len(codigo_usuario))):
        if i < len(codigo_carrera) and codigo_usuario[i] == codigo_carrera[i]:
            score += weights[i]
        elif codigo_usuario[i] in codigo_carrera:
            score += 10.0

    return min(100.0, score)


def generar_razones_match(
    codigo_usuario: str,
    codigos_carrera: list[str],
    nombre_carrera: str,
) -> list[str]:
    """Genera explicaciones legibles de por que una carrera es compatible."""
    razones: list[str] = []

    if not codigos_carrera:
        return razones

    codigo_carrera = codigos_carrera[0]

    # Mapeo de letras a nombres
    dimension_nombres = {
        "R": "Realista",
        "I": "Investigador/a",
        "A": "Artistico/a",
        "S": "Social",
        "E": "Emprendedor/a",
        "C": "Convencional",
    }

    # Matches por posicion
    for i in range(min(3, len(codigo_usuario), len(codigo_carrera))):
        if codigo_usuario[i] == codigo_carrera[i]:
            dim = dimension_nombres.get(codigo_usuario[i], codigo_usuario[i])
            if i == 0:
                razones.append(f"Tu dimension principal ({dim}) coincide con la carrera")
            elif i == 1:
                razones.append(f"Tu segunda dimension ({dim}) tambien es relevante")
            else:
                razones.append(f"Comparten afinidad en dimension {dim}")

    # Matches parciales
    for i in range(min(3, len(codigo_usuario))):
        letra = codigo_usuario[i]
        if i < len(codigo_carrera) and letra != codigo_carrera[i] and letra in codigo_carrera:
            dim = dimension_nombres.get(letra, letra)
            razones.append(f"Tu perfil {dim} esta presente en esta carrera")

    if not razones:
        razones.append(f"{nombre_carrera} puede ampliar tu horizonte vocacional")

    return razones
