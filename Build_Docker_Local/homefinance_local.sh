#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.local.yml"
ENV_FILE="${SCRIPT_DIR}/.env.docker.local"
ENV_EXAMPLE="${SCRIPT_DIR}/.env.docker.local.example"

if [[ ! -f "${ENV_FILE}" ]]; then
  cp "${ENV_EXAMPLE}" "${ENV_FILE}"
  echo "Arquivo .env criado em: ${ENV_FILE}"
  echo "Edite as variaveis de banco/JWT e execute novamente."
  exit 1
fi

run_compose() {
  docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" "$@"
}

ACTION="${1:-up}"
HOST_PORT_VALUE="$(grep -E '^HOST_PORT=' "${ENV_FILE}" | tail -n 1 | cut -d '=' -f2-)"
HOST_PORT_VALUE="${HOST_PORT_VALUE:-3000}"

case "${ACTION}" in
  up)
    run_compose up --build -d
    echo "HomeFinance local iniciado em http://localhost:${HOST_PORT_VALUE}"
    ;;
  down)
    run_compose down
    echo "HomeFinance local parado."
    ;;
  restart)
    run_compose down
    run_compose up --build -d
    echo "HomeFinance local reiniciado em http://localhost:${HOST_PORT_VALUE}"
    ;;
  logs)
    run_compose logs -f
    ;;
  status)
    run_compose ps
    ;;
  *)
    echo "Uso: $0 [up|down|restart|logs|status]"
    exit 1
    ;;
esac
