"""
Tests de google_meet.py — Google Calendar, Drive, Docs APIs con mocks.

Cubre happy paths y error cases de todas las funciones publicas:
- create_meet_event, update_event, cancel_event, get_event
- get_recording_metadata, find_meet_recordings
- extract_transcript_from_doc, find_meet_transcript_doc
- _extract_text_from_doc_body, _parse_meet_transcript_segments (helpers)
"""

from __future__ import annotations

from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from app.common.exceptions import GoogleAPIError
from app.sessions.google_meet import (
    _extract_text_from_doc_body,
    _parse_meet_transcript_segments,
    cancel_event,
    create_meet_event,
    extract_transcript_from_doc,
    find_meet_recordings,
    find_meet_transcript_doc,
    get_event,
    get_recording_metadata,
    update_event,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def mock_settings():
    """Mock de settings con Service Account configurado."""
    with patch("app.sessions.google_meet.get_settings") as mock:
        settings = MagicMock()
        settings.google_service_account_file = "/fake/service-account.json"
        settings.google_delegated_user = "admin@colegio.cl"
        mock.return_value = settings
        yield settings


@pytest.fixture
def mock_credentials(mock_settings):
    """Mock de google.oauth2 Credentials."""
    with patch("app.sessions.google_meet.Credentials") as mock_creds_cls:
        mock_creds = MagicMock()
        mock_creds.with_subject.return_value = mock_creds
        mock_creds_cls.from_service_account_file.return_value = mock_creds
        yield mock_creds_cls


@pytest.fixture
def mock_calendar_service(mock_credentials):
    """Mock del servicio de Google Calendar API."""
    with patch("app.sessions.google_meet.build") as mock_build:
        service = MagicMock()
        mock_build.return_value = service
        yield service


@pytest.fixture
def mock_drive_service(mock_credentials):
    """Mock del servicio de Google Drive API."""
    with patch("app.sessions.google_meet.build") as mock_build:
        service = MagicMock()
        mock_build.return_value = service
        yield service


@pytest.fixture
def mock_docs_service(mock_credentials):
    """Mock del servicio de Google Docs API."""
    with patch("app.sessions.google_meet.build") as mock_build:
        service = MagicMock()
        mock_build.return_value = service
        yield service


# ===========================================================================
# T2.2 — Google Calendar / Meet
# ===========================================================================


class TestCreateMeetEvent:
    """Tests para create_meet_event."""

    def test_crea_evento_con_meet_link(self, mock_calendar_service):
        """Happy path: crea evento Calendar con link Meet."""
        # Arrange
        mock_calendar_service.events().insert().execute.return_value = {
            "id": "evt_12345",
            "conferenceData": {
                "entryPoints": [
                    {
                        "entryPointType": "video",
                        "uri": "https://meet.google.com/abc-defg-hij",
                    }
                ]
            },
        }

        # Act
        result = create_meet_event(
            summary="Sesion Vocari - Test",
            start_time=datetime(2026, 3, 10, 14, 0, 0),
            duration_minutes=30,
            attendees=["estudiante@test.cl"],
        )

        # Assert
        assert result["event_id"] == "evt_12345"
        assert result["meet_link"] == "https://meet.google.com/abc-defg-hij"

    def test_crea_evento_sin_meet_link_en_respuesta(self, mock_calendar_service):
        """Si conferenceData no trae entryPoints, meet_link queda vacio."""
        mock_calendar_service.events().insert().execute.return_value = {
            "id": "evt_99999",
            "conferenceData": {},
        }

        result = create_meet_event(
            summary="Sesion sin Meet",
            start_time=datetime(2026, 3, 10, 15, 0, 0),
        )

        assert result["event_id"] == "evt_99999"
        assert result["meet_link"] == ""

    def test_error_api_lanza_google_api_error(self, mock_calendar_service):
        """Si Calendar API falla, se lanza GoogleAPIError."""
        mock_calendar_service.events().insert().execute.side_effect = Exception(
            "API quota exceeded"
        )

        with pytest.raises(GoogleAPIError, match="No se pudo crear evento"):
            create_meet_event(
                summary="Falla",
                start_time=datetime(2026, 3, 10, 16, 0, 0),
            )

    def test_crea_evento_sin_attendees(self, mock_calendar_service):
        """Sin attendees, el evento se crea sin el campo."""
        mock_calendar_service.events().insert().execute.return_value = {
            "id": "evt_no_attendees",
            "conferenceData": {
                "entryPoints": [
                    {"entryPointType": "video", "uri": "https://meet.google.com/xyz"}
                ]
            },
        }

        result = create_meet_event(
            summary="Sin asistentes",
            start_time=datetime(2026, 3, 10, 17, 0, 0),
        )

        assert result["event_id"] == "evt_no_attendees"


class TestUpdateEvent:
    """Tests para update_event."""

    def test_actualiza_evento_exitosamente(self, mock_calendar_service):
        """Happy path: actualiza un evento existente."""
        mock_calendar_service.events().patch().execute.return_value = {
            "id": "evt_12345",
            "summary": "Nuevo titulo",
        }

        result = update_event(
            event_id="evt_12345",
            updates={"summary": "Nuevo titulo"},
        )

        assert result["id"] == "evt_12345"
        assert result["summary"] == "Nuevo titulo"

    def test_error_api_lanza_google_api_error(self, mock_calendar_service):
        """Si Calendar API falla al actualizar, se lanza GoogleAPIError."""
        mock_calendar_service.events().patch().execute.side_effect = Exception("Not found")

        with pytest.raises(GoogleAPIError, match="No se pudo actualizar evento"):
            update_event(event_id="evt_bad", updates={"summary": "X"})


class TestCancelEvent:
    """Tests para cancel_event."""

    def test_cancela_evento_exitosamente(self, mock_calendar_service):
        """Happy path: cancela un evento."""
        mock_calendar_service.events().delete().execute.return_value = None

        # No debe lanzar excepcion
        cancel_event(event_id="evt_12345")

    def test_error_api_lanza_google_api_error(self, mock_calendar_service):
        """Si Calendar API falla al cancelar, se lanza GoogleAPIError."""
        mock_calendar_service.events().delete().execute.side_effect = Exception("Forbidden")

        with pytest.raises(GoogleAPIError, match="No se pudo cancelar evento"):
            cancel_event(event_id="evt_bad")


class TestGetEvent:
    """Tests para get_event."""

    def test_obtiene_evento(self, mock_calendar_service):
        """Happy path: obtiene un evento por ID."""
        mock_calendar_service.events().get().execute.return_value = {
            "id": "evt_12345",
            "summary": "Sesion Vocari",
            "status": "confirmed",
        }

        result = get_event(event_id="evt_12345")
        assert result["id"] == "evt_12345"
        assert result["summary"] == "Sesion Vocari"

    def test_error_api_lanza_google_api_error(self, mock_calendar_service):
        """Si Calendar API falla, se lanza GoogleAPIError."""
        mock_calendar_service.events().get().execute.side_effect = Exception("Not found")

        with pytest.raises(GoogleAPIError, match="No se pudo obtener evento"):
            get_event(event_id="evt_bad")


# ===========================================================================
# T2.5 — Google Meet Recording Access (Drive API)
# ===========================================================================


class TestGetRecordingMetadata:
    """Tests para get_recording_metadata."""

    def test_obtiene_metadata_con_duracion(self, mock_drive_service):
        """Happy path: metadata completa con duracion de video."""
        mock_drive_service.files().get().execute.return_value = {
            "id": "file_abc",
            "name": "abc-defg-hij (2026-03-10).mp4",
            "mimeType": "video/mp4",
            "size": "52428800",
            "createdTime": "2026-03-10T15:30:00Z",
            "webViewLink": "https://drive.google.com/file/d/file_abc/view",
            "videoMediaMetadata": {"durationMillis": "1800000"},
        }

        result = get_recording_metadata(drive_file_id="file_abc")

        assert result["drive_file_id"] == "file_abc"
        assert result["duration_seconds"] == 1800
        assert result["file_size_bytes"] == 52428800
        assert result["web_view_link"] == "https://drive.google.com/file/d/file_abc/view"

    def test_obtiene_metadata_sin_duracion(self, mock_drive_service):
        """Si no hay videoMediaMetadata, duracion es 0."""
        mock_drive_service.files().get().execute.return_value = {
            "id": "file_xyz",
            "name": "recording.mp4",
            "mimeType": "video/mp4",
            "size": "10000000",
            "createdTime": "2026-03-10T16:00:00Z",
            "webViewLink": "",
        }

        result = get_recording_metadata(drive_file_id="file_xyz")

        assert result["duration_seconds"] == 0
        assert result["file_size_bytes"] == 10000000

    def test_error_api_lanza_google_api_error(self, mock_drive_service):
        """Si Drive API falla, se lanza GoogleAPIError."""
        mock_drive_service.files().get().execute.side_effect = Exception("Access denied")

        with pytest.raises(GoogleAPIError, match="No se pudo acceder a grabacion"):
            get_recording_metadata(drive_file_id="bad_id")


class TestFindMeetRecordings:
    """Tests para find_meet_recordings."""

    def test_encuentra_grabaciones(self, mock_drive_service):
        """Happy path: encuentra grabaciones por codigo Meet."""
        mock_drive_service.files().list().execute.return_value = {
            "files": [
                {"id": "rec1", "name": "abc-defg-hij.mp4", "size": "50000000"},
                {"id": "rec2", "name": "abc-defg-hij (2).mp4", "size": "30000000"},
            ]
        }

        result = find_meet_recordings(meet_code="abc-defg-hij")

        assert len(result) == 2
        assert result[0]["id"] == "rec1"

    def test_sin_grabaciones_retorna_lista_vacia(self, mock_drive_service):
        """Si no hay grabaciones, retorna lista vacia."""
        mock_drive_service.files().list().execute.return_value = {"files": []}

        result = find_meet_recordings(meet_code="no-meet-code")
        assert result == []

    def test_error_api_lanza_google_api_error(self, mock_drive_service):
        """Si Drive API falla, se lanza GoogleAPIError."""
        mock_drive_service.files().list().execute.side_effect = Exception("Quota exceeded")

        with pytest.raises(GoogleAPIError, match="No se pudo buscar grabaciones"):
            find_meet_recordings(meet_code="bad-code")


# ===========================================================================
# T2.6 — Transcript Extraction from Google Docs
# ===========================================================================


class TestExtractTranscriptFromDoc:
    """Tests para extract_transcript_from_doc."""

    def test_extrae_transcripcion_completa(self, mock_docs_service):
        """Happy path: extrae texto y segmentos de un Google Doc de Meet."""
        mock_docs_service.documents().get().execute.return_value = {
            "body": {
                "content": [
                    {
                        "paragraph": {
                            "elements": [
                                {"textRun": {"content": "Maria Garcia - 14:00:05\n"}}
                            ]
                        }
                    },
                    {
                        "paragraph": {
                            "elements": [
                                {
                                    "textRun": {
                                        "content": "Hola, bienvenido a la sesion de orientacion.\n"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "paragraph": {
                            "elements": [
                                {"textRun": {"content": "Pedro Soto - 14:00:30\n"}}
                            ]
                        }
                    },
                    {
                        "paragraph": {
                            "elements": [
                                {
                                    "textRun": {
                                        "content": "Gracias, tengo dudas sobre carreras.\n"
                                    }
                                }
                            ]
                        }
                    },
                ]
            }
        }

        result = extract_transcript_from_doc(google_docs_id="doc_abc")

        assert result["word_count"] > 0
        assert len(result["segments"]) == 2
        assert result["segments"][0]["speaker"] == "Maria Garcia"
        assert result["segments"][0]["timestamp"] == "14:00:05"
        assert "bienvenido" in result["segments"][0]["text"]
        assert result["segments"][1]["speaker"] == "Pedro Soto"

    def test_documento_vacio_retorna_sin_segmentos(self, mock_docs_service):
        """Documento vacio retorna sin segmentos."""
        mock_docs_service.documents().get().execute.return_value = {
            "body": {"content": []}
        }

        result = extract_transcript_from_doc(google_docs_id="doc_empty")

        assert result["full_text"] == ""
        assert result["segments"] == []
        assert result["word_count"] == 0  # "".split() returns []

    def test_error_api_lanza_google_api_error(self, mock_docs_service):
        """Si Docs API falla, se lanza GoogleAPIError."""
        mock_docs_service.documents().get().execute.side_effect = Exception("Not found")

        with pytest.raises(
            GoogleAPIError, match="No se pudo acceder al documento de transcripcion"
        ):
            extract_transcript_from_doc(google_docs_id="bad_id")


class TestFindMeetTranscriptDoc:
    """Tests para find_meet_transcript_doc."""

    def test_encuentra_documento_transcripcion(self, mock_drive_service):
        """Happy path: encuentra el Google Doc de transcripcion."""
        mock_drive_service.files().list().execute.return_value = {
            "files": [
                {
                    "id": "doc_transcript_1",
                    "name": "abc-defg-hij Transcript",
                    "createdTime": "2026-03-10T15:30:00Z",
                }
            ]
        }

        result = find_meet_transcript_doc(meet_code="abc-defg-hij")
        assert result == "doc_transcript_1"

    def test_sin_transcripcion_retorna_none(self, mock_drive_service):
        """Si no hay documento de transcripcion, retorna None."""
        mock_drive_service.files().list().execute.return_value = {"files": []}

        result = find_meet_transcript_doc(meet_code="no-transcript")
        assert result is None

    def test_error_api_lanza_google_api_error(self, mock_drive_service):
        """Si Drive API falla, se lanza GoogleAPIError."""
        mock_drive_service.files().list().execute.side_effect = Exception("Error")

        with pytest.raises(GoogleAPIError, match="No se pudo buscar transcripcion"):
            find_meet_transcript_doc(meet_code="bad-code")


# ===========================================================================
# Helpers internos
# ===========================================================================


class TestExtractTextFromDocBody:
    """Tests para _extract_text_from_doc_body."""

    def test_extrae_texto_de_multiples_parrafos(self):
        """Extrae texto de multiples elementos paragraph.

        _extract_text_from_doc_body joins textRun contents within a paragraph,
        strips whitespace, and treats each paragraph as a separate line.
        Two textRun elements in one paragraph produce a single joined line.
        """
        body = {
            "content": [
                {
                    "paragraph": {
                        "elements": [
                            {"textRun": {"content": "Primera linea\n"}},
                            {"textRun": {"content": "continuacion\n"}},
                        ]
                    }
                },
                {
                    "paragraph": {
                        "elements": [{"textRun": {"content": "Segunda linea\n"}}]
                    }
                },
            ]
        }

        result = _extract_text_from_doc_body(body)
        # Each paragraph becomes a separate line after strip()
        # First paragraph: "Primera linea\n" + "continuacion\n" -> joined -> stripped
        # = "Primera linea\ncontinuacion" which is non-empty, so it becomes one entry
        # But strip() only strips leading/trailing, the \n in the middle remains
        # Actually, parts are joined and then stripped, producing "Primera linea\ncontinuacion"
        # which is treated as one paragraph entry
        assert "Primera linea" in result
        assert "continuacion" in result
        assert "Segunda linea" in result

    def test_body_vacio(self):
        """Body sin content retorna string vacio."""
        result = _extract_text_from_doc_body({})
        assert result == ""

    def test_ignora_elementos_sin_paragraph(self):
        """Ignora elementos que no son paragraph (ej: sectionBreak)."""
        body = {
            "content": [
                {"sectionBreak": {}},
                {
                    "paragraph": {
                        "elements": [{"textRun": {"content": "Texto\n"}}]
                    }
                },
            ]
        }

        result = _extract_text_from_doc_body(body)
        assert "Texto" in result


class TestParseMeetTranscriptSegments:
    """Tests para _parse_meet_transcript_segments."""

    def test_parsea_formato_estandar_meet(self):
        """Parsea formato estandar de transcripcion Meet."""
        text = (
            "Maria Garcia - 14:00:05\n"
            "Hola, bienvenido a la sesion.\n"
            "Pedro Soto - 14:01:20\n"
            "Gracias, tengo preguntas sobre carreras.\n"
            "Maria Garcia - 14:02:00\n"
            "Claro, empecemos con tus intereses."
        )

        segments = _parse_meet_transcript_segments(text)

        assert len(segments) == 3
        assert segments[0]["speaker"] == "Maria Garcia"
        assert segments[0]["timestamp"] == "14:00:05"
        assert "bienvenido" in segments[0]["text"]
        assert segments[1]["speaker"] == "Pedro Soto"
        assert segments[2]["speaker"] == "Maria Garcia"

    def test_formato_con_guion_largo(self):
        """Parsea formato con guion largo (–) en lugar de guion corto (-)."""
        text = (
            "Ana Lopez – 10:30:00\n"
            "Buenos dias.\n"
            "Carlos Ruiz – 10:30:15\n"
            "Buenos dias."
        )

        segments = _parse_meet_transcript_segments(text)
        assert len(segments) == 2
        assert segments[0]["speaker"] == "Ana Lopez"

    def test_texto_sin_speakers(self):
        """Texto sin formato de speaker retorna lista vacia."""
        text = "Este es un texto plano sin formato de transcripcion Meet."

        segments = _parse_meet_transcript_segments(text)
        assert segments == []

    def test_speaker_con_timestamp_hh_mm(self):
        """Parsea timestamp con formato HH:MM (sin segundos)."""
        text = "Juan Perez - 14:30\nHola, como estas."

        segments = _parse_meet_transcript_segments(text)
        assert len(segments) == 1
        assert segments[0]["timestamp"] == "14:30"

    def test_multiples_lineas_mismo_speaker(self):
        """Multiples lineas de texto se concatenan para el mismo speaker."""
        text = (
            "Maria Garcia - 14:00:00\n"
            "Primera linea del mensaje.\n"
            "Segunda linea del mensaje.\n"
            "Tercera linea del mensaje."
        )

        segments = _parse_meet_transcript_segments(text)
        assert len(segments) == 1
        assert "Primera linea" in segments[0]["text"]
        assert "Segunda linea" in segments[0]["text"]
        assert "Tercera linea" in segments[0]["text"]


# ===========================================================================
# Credentials
# ===========================================================================


class TestCredentials:
    """Tests para _get_credentials y service builders."""

    def test_sin_service_account_lanza_error(self):
        """Si google_service_account_file no esta configurado, lanza error."""
        with patch("app.sessions.google_meet.get_settings") as mock_settings:
            settings = MagicMock()
            settings.google_service_account_file = None
            mock_settings.return_value = settings

            from app.sessions.google_meet import _get_credentials

            with pytest.raises(GoogleAPIError, match="google_service_account_file"):
                _get_credentials()

    def test_delegated_email_override(self):
        """Si se pasa delegated_email, se usa en lugar del default."""
        with (
            patch("app.sessions.google_meet.get_settings") as mock_settings,
            patch("app.sessions.google_meet.Credentials") as mock_creds_cls,
        ):
            settings = MagicMock()
            settings.google_service_account_file = "/fake/sa.json"
            settings.google_delegated_user = "default@colegio.cl"
            mock_settings.return_value = settings

            mock_creds = MagicMock()
            mock_creds.with_subject.return_value = mock_creds
            mock_creds_cls.from_service_account_file.return_value = mock_creds

            from app.sessions.google_meet import _get_credentials

            _get_credentials(delegated_email="custom@colegio.cl")
            mock_creds.with_subject.assert_called_once_with("custom@colegio.cl")
