"""
Vocari Backend - Motor de recomendaciones de carreras.

Calcula compatibilidad entre codigo Holland del estudiante y carreras disponibles.
"""


def calcular_compatibilidad(codigo_usuario: str, codigos_carrera: list[str]) -> float:
    """
    Calcula compatibilidad (0-100) entre un codigo Holland del usuario y los codigos de una carrera.

    Algoritmo:
    - Por cada letra del codigo del usuario, verificar si esta en los codigos de la carrera
    - Peso: primera letra = 40pts, segunda = 30pts, tercera = 20pts
    - Si la letra esta presente pero no en la misma posicion: +10pts extra
    - Maximo posible: 100
    """
    if not codigo_usuario or not codigos_carrera:
        return 0.0

    # Combinar todos los codigos en un solo string para buscar
    # Acepta tanto ["R", "I", "C"] como ["RIC"]
    codigo_combinado = ""
    for c in codigos_carrera:
        if isinstance(c, str):
            codigo_combinado += c
    
    if len(codigo_combinado) < 1 or len(codigo_usuario) < 1:
        return 0.0

    score = 0.0
    weights = [40.0, 30.0, 20.0]

    # Verificar cada letra del codigo del usuario
    for i, letra in enumerate(codigo_usuario[:3]):  # Solo las primeras 3 letras
        peso = weights[i] if i < len(weights) else 10.0
        
        if letra in codigo_combinado:
            score += peso
            # Bonus si la letra esta en la misma posicion
            if i < len(codigo_combinado) and codigo_combinado[i] == letra:
                score += 5.0  # Bonus por posicion exacta

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
