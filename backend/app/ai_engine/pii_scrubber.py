"""
Vocari Backend - PII Scrubbing (T3.10).

Remueve datos personales identificables de transcripciones
antes de enviarlas al LLM.

Datos removidos:
- Nombres propios (reemplazados por "Estudiante" / "Orientador")
- RUT chileno (XX.XXX.XXX-X)
- Emails
- Telefonos
- Direcciones
"""

from __future__ import annotations

import re
from typing import Any

import structlog

logger = structlog.get_logger()

# ---------------------------------------------------------------------------
# Patrones de PII
# ---------------------------------------------------------------------------

# RUT chileno: formatos comunes
_RUT_PATTERN = re.compile(
    r"\b\d{1,2}[\.\s]?\d{3}[\.\s]?\d{3}[-\s]?[\dkK]\b"
)

# Email
_EMAIL_PATTERN = re.compile(
    r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b"
)

# Telefono chileno: +56 9 XXXX XXXX, 09XXXXXXXX, etc.
_PHONE_PATTERN = re.compile(
    r"(?:\+56\s*)?(?:9\s*)?\d{4}[\s-]?\d{4}\b"
)

# Direccion: calle + numero (heuristico simple)
_ADDRESS_PATTERN = re.compile(
    r"\b(?:calle|avenida|av\.|pasaje|psje\.)\s+[A-Za-záéíóúñÁÉÍÓÚÑ\s]+\s+\d+",
    re.IGNORECASE,
)


def scrub_pii(
    text: str,
    speaker_map: dict[str, str] | None = None,
) -> str:
    """
    Remueve PII de un texto de transcripcion.

    Args:
        text: Texto original
        speaker_map: Mapeo de nombres reales a pseudonimos.
                     Ej: {"Juan Perez": "Estudiante", "Maria Garcia": "Orientador"}

    Returns:
        Texto limpio sin PII
    """
    cleaned = text

    # 1. Reemplazar nombres de speakers
    if speaker_map:
        for real_name, pseudonym in speaker_map.items():
            # Reemplazar nombre completo
            cleaned = cleaned.replace(real_name, pseudonym)
            # Reemplazar solo primer nombre
            first_name = real_name.split()[0]
            if len(first_name) > 2:  # Evitar reemplazar palabras muy cortas
                cleaned = re.sub(
                    rf"\b{re.escape(first_name)}\b",
                    pseudonym,
                    cleaned,
                )

    # 2. RUT
    cleaned = _RUT_PATTERN.sub("[RUT_REMOVIDO]", cleaned)

    # 3. Email
    cleaned = _EMAIL_PATTERN.sub("[EMAIL_REMOVIDO]", cleaned)

    # 4. Telefono (cuidado con falsos positivos)
    cleaned = _PHONE_PATTERN.sub("[TELEFONO_REMOVIDO]", cleaned)

    # 5. Direcciones
    cleaned = _ADDRESS_PATTERN.sub("[DIRECCION_REMOVIDA]", cleaned)

    return cleaned


def scrub_transcript_segments(
    segments: list[dict[str, str]],
    speaker_map: dict[str, str] | None = None,
) -> list[dict[str, str]]:
    """
    Aplica scrubbing a una lista de segmentos de transcripcion.

    Anonimiza nombres de speakers en el campo "speaker" y texto.
    """
    cleaned_segments: list[dict[str, str]] = []

    for segment in segments:
        cleaned = dict(segment)

        # Anonimizar speaker
        speaker = cleaned.get("speaker", "")
        if speaker_map and speaker in speaker_map:
            cleaned["speaker"] = speaker_map[speaker]

        # Limpiar texto
        if "text" in cleaned:
            cleaned["text"] = scrub_pii(cleaned["text"], speaker_map)

        cleaned_segments.append(cleaned)

    return cleaned_segments


def build_speaker_map(
    student_name: str | None = None,
    orientador_name: str | None = None,
) -> dict[str, str]:
    """
    Construye un mapeo de nombres reales a pseudonimos.

    Los pseudonimos son genericos para proteger la identidad.
    """
    speaker_map: dict[str, str] = {}

    if student_name:
        speaker_map[student_name] = "Estudiante"
    if orientador_name:
        speaker_map[orientador_name] = "Orientador"

    return speaker_map


def verify_no_pii(text: str) -> list[str]:
    """
    Verifica que un texto no contenga PII residual.

    Retorna lista de warnings si se detecta algo sospechoso.
    Util para tests.
    """
    warnings: list[str] = []

    if _RUT_PATTERN.search(text):
        warnings.append("Se detecto un posible RUT en el texto")
    if _EMAIL_PATTERN.search(text):
        warnings.append("Se detecto un posible email en el texto")

    return warnings
