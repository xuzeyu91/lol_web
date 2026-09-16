#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
PORT="${1:-5173}"
exec python3 serve.py "$PORT"