"""
Vocari Backend - Integracion con Google Calendar / Meet / Drive / Docs.

Usa Service Account con Domain-Wide Delegation para crear eventos,
acceder a grabaciones y extraer transcripciones.
"""

from __future__ import annotations

import re
from datetime import datetime, timedelta
from typing import Any

import structlog
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

from app.common.exceptions import GoogleAPIError
from app.config import get_settings

logger = structlog.get_logger()

# Scopes requeridos para Workspace
SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/documents.readonly",
]


def _get_credentials(delegated_email: str | None = None) -> Credentials:
    """Obtiene credenciales del Service Account con delegacion opcional."""
    settings = get_settings()

    if not settings.google_service_account_file:
        raise GoogleAPIError("google_service_account_file no configurado")

    creds = Credentials.from_service_account_file(
        settings.google_service_account_file,
        scopes=SCOPES,
    )

    target_email = delegated_email or settings.google_delegated_user
    if target_email:
        creds = creds.with_subject(target_email)

    return creds


def _get_calendar_service(delegated_email: str | None = None) -> Any:
    """Construye cliente de Google Calendar API v3."""
    creds = _get_credentials(delegated_email)
    return build("calendar", "v3", credentials=creds, cache_discovery=False)


def _get_drive_service(delegated_email: str | None = None) -> Any:
    """Construye cliente de Google Drive API v3."""
    creds = _get_credentials(delegated_email)
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def _get_docs_service(delegated_email: str | None = None) -> Any:
    """Construye cliente de Google Docs API v1."""
    creds = _get_credentials(delegated_email)
    return build("docs", "v1", credentials=creds, cache_discovery=False)


# ---------------------------------------------------------------------------
# T2.2 - Google Calendar / Meet
# ---------------------------------------------------------------------------


def create_meet_event(
    *,
    summary: str,
    start_time: datetime,
    duration_minutes: int = 30,
    attendees: list[str] | None = None,
    description: str = "",
    delegated_email: str | None = None,
) -> dict[str, str]:
    """
    Crea un evento en Google Calendar con conferencia Meet automatica.

    Retorna:
        {"event_id": "...", "meet_link": "https://meet.google.com/..."}
    """
    service = _get_calendar_service(delegated_email)

    end_time = start_time + timedelta(minutes=duration_minutes)

    event_body: dict[str, Any] = {
        "summary": summary,
        "description": description,
        "start": {
            "dateTime": start_time.isoformat(),
            "timeZone": "America/Santiago",
        },
        "end": {
            "dateTime": end_time.isoformat(),
            "timeZone": "America/Santiago",
        },
        "conferenceData": {
            "createRequest": {
                "requestId": f"vocari-{start_time.timestamp():.0f}",
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
    }

    if attendees:
        event_body["attendees"] = [{"email": email} for email in attendees]

    try:
        event = (
            service.events()
            .insert(
                calendarId="primary",
                body=event_body,
                conferenceDataVersion=1,
                sendUpdates="all",
            )
            .execute()
        )
    except Exception as exc:
        logger.error("Error creando evento Calendar", error=str(exc))
        raise GoogleAPIError(f"No se pudo crear evento en Calendar: {exc}") from exc

    meet_link = ""
    conference_data = event.get("conferenceData", {})
    for entry_point in conference_data.get("entryPoints", []):
        if entry_point.get("entryPointType") == "video":
            meet_link = entry_point.get("uri", "")
            break

    result = {
        "event_id": event["id"],
        "meet_link": meet_link,
    }

    logger.info(
        "Evento Calendar+Meet creado",
        event_id=result["event_id"],
        meet_link=result["meet_link"],
    )
    return result


def update_event(
    *,
    event_id: str,
    updates: dict[str, Any],
    delegated_email: str | None = None,
) -> dict[str, Any]:
    """Actualiza un evento existente en Google Calendar."""
    service = _get_calendar_service(delegated_email)

    try:
        event = (
            service.events()
            .patch(
                calendarId="primary",
                eventId=event_id,
                body=updates,
                sendUpdates="all",
            )
            .execute()
        )
    except Exception as exc:
        logger.error("Error actualizando evento Calendar", event_id=event_id, error=str(exc))
        raise GoogleAPIError(f"No se pudo actualizar evento: {exc}") from exc

    logger.info("Evento Calendar actualizado", event_id=event_id)
    return event  # type: ignore[no-any-return]


def cancel_event(
    *,
    event_id: str,
    delegated_email: str | None = None,
) -> None:
    """Cancela (elimina) un evento de Google Calendar."""
    service = _get_calendar_service(delegated_email)

    try:
        service.events().delete(
            calendarId="primary",
            eventId=event_id,
            sendUpdates="all",
        ).execute()
    except Exception as exc:
        logger.error("Error cancelando evento Calendar", event_id=event_id, error=str(exc))
        raise GoogleAPIError(f"No se pudo cancelar evento: {exc}") from exc

    logger.info("Evento Calendar cancelado", event_id=event_id)


def get_event(
    *,
    event_id: str,
    delegated_email: str | None = None,
) -> dict[str, Any]:
    """Obtiene un evento de Google Calendar por su ID."""
    service = _get_calendar_service(delegated_email)

    try:
        event = (
            service.events()
            .get(calendarId="primary", eventId=event_id)
            .execute()
        )
    except Exception as exc:
        logger.error("Error obteniendo evento Calendar", event_id=event_id, error=str(exc))
        raise GoogleAPIError(f"No se pudo obtener evento: {exc}") from exc

    return event  # type: ignore[no-any-return]


# ---------------------------------------------------------------------------
# T2.5 - Google Meet Recording Access (Drive API)
# ---------------------------------------------------------------------------


def get_recording_metadata(
    *,
    drive_file_id: str,
    delegated_email: str | None = None,
) -> dict[str, Any]:
    """
    Obtiene metadata de la grabacion de Meet en Google Drive.

    Vocari NO descarga el video, solo accede a metadata.
    """
    service = _get_drive_service(delegated_email)

    try:
        file_meta = (
            service.files()
            .get(
                fileId=drive_file_id,
                fields="id,name,mimeType,size,createdTime,webViewLink,videoMediaMetadata",
            )
            .execute()
        )
    except Exception as exc:
        logger.error("Error obteniendo metadata de grabacion", file_id=drive_file_id, error=str(exc))
        raise GoogleAPIError(f"No se pudo acceder a grabacion en Drive: {exc}") from exc

    # Extraer duracion si disponible
    duration_seconds = 0
    video_meta = file_meta.get("videoMediaMetadata", {})
    if "durationMillis" in video_meta:
        duration_seconds = int(video_meta["durationMillis"]) // 1000

    return {
        "drive_file_id": file_meta["id"],
        "name": file_meta.get("name", ""),
        "mime_type": file_meta.get("mimeType", ""),
        "file_size_bytes": int(file_meta.get("size", 0)),
        "duration_seconds": duration_seconds,
        "web_view_link": file_meta.get("webViewLink", ""),
        "created_time": file_meta.get("createdTime", ""),
    }


def find_meet_recordings(
    *,
    meet_code: str,
    delegated_email: str | None = None,
) -> list[dict[str, Any]]:
    """
    Busca grabaciones de una reunion Meet en el Drive del organizador.

    Google Meet guarda las grabaciones en 'Meet Recordings' del Drive
    del organizador de la reunion.
    """
    service = _get_drive_service(delegated_email)

    try:
        results = (
            service.files()
            .list(
                q=f"name contains '{meet_code}' and mimeType='video/mp4'",
                fields="files(id,name,size,createdTime,videoMediaMetadata)",
                orderBy="createdTime desc",
                pageSize=5,
            )
            .execute()
        )
    except Exception as exc:
        logger.error("Error buscando grabaciones Meet", meet_code=meet_code, error=str(exc))
        raise GoogleAPIError(f"No se pudo buscar grabaciones: {exc}") from exc

    return results.get("files", [])  # type: ignore[no-any-return]


# ---------------------------------------------------------------------------
# T2.6 - Transcript Extraction from Google Docs
# ---------------------------------------------------------------------------


def extract_transcript_from_doc(
    *,
    google_docs_id: str,
    delegated_email: str | None = None,
) -> dict[str, Any]:
    """
    Extrae transcripcion de un Google Doc generado por Meet.

    Google Meet genera transcripciones como Google Docs con formato:
      Speaker Name - HH:MM:SS
      Text content...

    Retorna:
        {
            "full_text": "...",
            "segments": [{"speaker": "...", "text": "...", "timestamp": "..."}],
            "word_count": int,
        }
    """
    service = _get_docs_service(delegated_email)

    try:
        doc = service.documents().get(documentId=google_docs_id).execute()
    except Exception as exc:
        logger.error(
            "Error extrayendo transcripcion de Docs",
            docs_id=google_docs_id,
            error=str(exc),
        )
        raise GoogleAPIError(f"No se pudo acceder al documento de transcripcion: {exc}") from exc

    # Extraer texto plano del documento
    full_text = _extract_text_from_doc_body(doc.get("body", {}))
    segments = _parse_meet_transcript_segments(full_text)
    word_count = len(full_text.split())

    logger.info(
        "Transcripcion extraida",
        docs_id=google_docs_id,
        segments_count=len(segments),
        word_count=word_count,
    )

    return {
        "full_text": full_text,
        "segments": segments,
        "word_count": word_count,
    }


def find_meet_transcript_doc(
    *,
    meet_code: str,
    delegated_email: str | None = None,
) -> str | None:
    """
    Busca el Google Doc de transcripcion generado por Meet.

    Google Meet guarda las transcripciones como Docs en la carpeta
    'Meet Transcripts' del Drive del organizador.
    """
    service = _get_drive_service(delegated_email)

    try:
        results = (
            service.files()
            .list(
                q=(
                    f"name contains '{meet_code}' and "
                    "mimeType='application/vnd.google-apps.document'"
                ),
                fields="files(id,name,createdTime)",
                orderBy="createdTime desc",
                pageSize=3,
            )
            .execute()
        )
    except Exception as exc:
        logger.error("Error buscando transcripcion Meet", meet_code=meet_code, error=str(exc))
        raise GoogleAPIError(f"No se pudo buscar transcripcion: {exc}") from exc

    files = results.get("files", [])
    if not files:
        return None

    return files[0]["id"]  # type: ignore[no-any-return]


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------

# Patron para parsear lineas de speaker en transcripcion Meet
# Formato: "Nombre del Speaker - HH:MM:SS" o "Nombre del Speaker HH:MM:SS"
_SPEAKER_PATTERN = re.compile(
    r"^(.+?)\s*[-–]\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*$"
)


def _extract_text_from_doc_body(body: dict[str, Any]) -> str:
    """Extrae texto plano del body de un Google Doc."""
    paragraphs: list[str] = []

    for element in body.get("content", []):
        paragraph = element.get("paragraph")
        if not paragraph:
            continue

        parts: list[str] = []
        for elem in paragraph.get("elements", []):
            text_run = elem.get("textRun")
            if text_run:
                parts.append(text_run.get("content", ""))

        line = "".join(parts).strip()
        if line:
            paragraphs.append(line)

    return "\n".join(paragraphs)


def _parse_meet_transcript_segments(text: str) -> list[dict[str, str]]:
    """
    Parsea transcripcion de Meet en segmentos estructurados.

    Formato esperado:
        Speaker Name - HH:MM:SS
        Lo que dijo el speaker...
        Mas texto...

        Otro Speaker - HH:MM:SS
        Lo que dijo otro speaker...
    """
    segments: list[dict[str, str]] = []
    current_speaker = ""
    current_timestamp = ""
    current_text_parts: list[str] = []

    for line in text.split("\n"):
        match = _SPEAKER_PATTERN.match(line)
        if match:
            # Si habia un speaker previo, guardar su segmento
            if current_speaker and current_text_parts:
                segments.append({
                    "speaker": current_speaker,
                    "text": " ".join(current_text_parts).strip(),
                    "timestamp": current_timestamp,
                })
                current_text_parts = []

            current_speaker = match.group(1).strip()
            current_timestamp = match.group(2).strip()
        elif line.strip():
            current_text_parts.append(line.strip())

    # Ultimo segmento
    if current_speaker and current_text_parts:
        segments.append({
            "speaker": current_speaker,
            "text": " ".join(current_text_parts).strip(),
            "timestamp": current_timestamp,
        })

    return segments
