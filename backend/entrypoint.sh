#!/bin/bash
set -e

PORT=${PORT:-8080}

exec uvicorn app.main:create_app --factory --host 0.0.0.0 --port "$PORT"
