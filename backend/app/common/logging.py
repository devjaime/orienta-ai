"""
Vocari Backend - Configuracion de logging estructurado con structlog.

Formatos:
  - json: salida JSON para produccion (parseable por herramientas de log)
  - console: salida coloreada para desarrollo local
"""

import logging
import sys

import structlog


def setup_logging(log_level: str = "INFO", log_format: str = "json") -> None:
    """
    Configura structlog y el logging estandar de Python.

    Args:
        log_level: Nivel de log (DEBUG, INFO, WARNING, ERROR, CRITICAL).
        log_format: Formato de salida ("json" o "console").
    """
    # Nivel numerico
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    # Procesadores compartidos
    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

    if log_format == "console":
        # Desarrollo: salida coloreada legible
        renderer: structlog.types.Processor = structlog.dev.ConsoleRenderer(
            colors=True,
        )
    else:
        # Produccion: JSON estructurado
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Configurar el formatter para el logging estandar de Python
    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
        foreign_pre_chain=shared_processors,
    )

    # Handler de consola
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    # Configurar root logger
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(numeric_level)

    # Reducir ruido de librerias externas
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
