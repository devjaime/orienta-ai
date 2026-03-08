"""
Vocari Backend - Worker de colas con rq (Redis Queue).

Punto de entrada para procesar tareas en background:
  - ai_analysis: analisis con IA (prioridad alta)
  - reports: generacion de reportes
  - profiles: calculo de perfiles vocacionales

Uso:
    python -m workers.worker
    python -m workers.worker --queues ai_analysis
    python -m workers.worker --queues ai_analysis reports profiles

Referencia: tasks/milestone-03-ai-engine.md T3.4
"""

import argparse
import signal
import sys

import structlog

from app.common.logging import setup_logging
from app.config import get_settings

# Importar jobs para que rq pueda encontrarlos al deserializar
import app.ai_engine.jobs  # noqa: F401

logger = structlog.get_logger()

# Queues por defecto (ordenadas por prioridad)
DEFAULT_QUEUES = ["ai_analysis", "reports", "profiles"]

# Timeout por tipo de queue
QUEUE_TIMEOUTS: dict[str, int] = {
    "ai_analysis": 300,   # 5 minutos (pipeline IA puede tardar)
    "reports": 600,        # 10 minutos (reportes complejos)
    "profiles": 120,       # 2 minutos
}

# Flag para shutdown graceful
_shutdown_requested = False


def _handle_signal(signum: int, frame: object) -> None:
    """Maneja senales de sistema para shutdown graceful."""
    global _shutdown_requested
    sig_name = signal.Signals(signum).name
    logger.info("Senal recibida, deteniendo worker", signal=sig_name)
    _shutdown_requested = True


def parse_args() -> argparse.Namespace:
    """Parsea argumentos de linea de comandos."""
    parser = argparse.ArgumentParser(description="Vocari rq Worker")
    parser.add_argument(
        "--queues",
        nargs="+",
        default=DEFAULT_QUEUES,
        help=f"Queues a procesar (default: {DEFAULT_QUEUES})",
    )
    parser.add_argument(
        "--burst",
        action="store_true",
        help="Modo burst: procesar jobs pendientes y salir",
    )
    parser.add_argument(
        "--name",
        default=None,
        help="Nombre del worker (default: vocari-worker-{env})",
    )
    return parser.parse_args()


def main() -> None:
    """Punto de entrada del worker."""
    from redis import Redis
    from rq import Worker

    args = parse_args()
    settings = get_settings()

    # Configurar logging estructurado
    setup_logging(log_level=settings.log_level, log_format=settings.log_format)

    # Registrar handlers de senales
    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    queues = args.queues
    worker_name = args.name or f"vocari-worker-{settings.app_env}"

    logger.info(
        "Iniciando Vocari worker",
        queues=queues,
        redis_url=settings.redis_url,
        worker_name=worker_name,
        burst=args.burst,
    )

    # Conexion a Redis (sincrona para rq)
    redis_conn = Redis.from_url(settings.redis_url)

    try:
        redis_conn.ping()
        logger.info("Conectado a Redis")
    except Exception as e:
        logger.error("No se pudo conectar a Redis", error=str(e))
        sys.exit(1)

    worker = Worker(
        queues=queues,
        connection=redis_conn,
        name=worker_name,
        default_worker_ttl=420,  # Worker heartbeat TTL
        default_result_ttl=86400,  # Resultados disponibles por 24h
    )

    logger.info("Worker listo, esperando tareas...")
    worker.work(
        with_scheduler=False,
        burst=args.burst,
    )

    logger.info("Worker detenido")


if __name__ == "__main__":
    main()
