#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
source venv/bin/activate
exec uvicorn main:app --host 127.0.0.1 --port 3002 --workers 1 --log-level info
