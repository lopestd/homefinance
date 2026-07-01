#!/usr/bin/env bash

set -euo pipefail

IMAGE_NAME="brdocker2020/homefinance"
VERSION="latest"
CONTAINER_NAME="homefinance"
HOST_PORT="3000"
DB_PORT="5432"

read -r -p "Tag da imagem (ENTER para latest): " VERSION_INPUT
if [[ -n "${VERSION_INPUT:-}" ]]; then
  VERSION="$VERSION_INPUT"
fi

IMAGE="${IMAGE_NAME}:${VERSION}"

read -r -p "Nome do container (ENTER para homefinance): " CONTAINER_NAME_INPUT
if [[ -n "${CONTAINER_NAME_INPUT:-}" ]]; then
  CONTAINER_NAME="$CONTAINER_NAME_INPUT"
fi

read -r -p "Porta local (ENTER para 3000): " HOST_PORT_INPUT
if [[ -n "${HOST_PORT_INPUT:-}" ]]; then
  HOST_PORT="$HOST_PORT_INPUT"
fi

read -r -p "DB_HOST: " DB_HOST
if [[ -z "${DB_HOST:-}" ]]; then
  echo "DB_HOST obrigatorio."
  exit 1
fi

read -r -p "DB_PORT (ENTER para 5432): " DB_PORT_INPUT
if [[ -n "${DB_PORT_INPUT:-}" ]]; then
  DB_PORT="$DB_PORT_INPUT"
fi

read -r -p "DB_NAME: " DB_NAME
if [[ -z "${DB_NAME:-}" ]]; then
  echo "DB_NAME obrigatorio."
  exit 1
fi

read -r -p "DB_USER: " DB_USER
if [[ -z "${DB_USER:-}" ]]; then
  echo "DB_USER obrigatorio."
  exit 1
fi

read -r -s -p "DB_PASS: " DB_PASS
echo
if [[ -z "${DB_PASS:-}" ]]; then
  echo "DB_PASS obrigatorio."
  exit 1
fi

read -r -s -p "JWT_SECRET: " JWT_SECRET
echo
if [[ -z "${JWT_SECRET:-}" ]]; then
  echo "JWT_SECRET obrigatorio."
  exit 1
fi

docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${HOST_PORT}:3000" \
  -e "DB_HOST=$DB_HOST" \
  -e "DB_PORT=$DB_PORT" \
  -e "DB_NAME=$DB_NAME" \
  -e "DB_USER=$DB_USER" \
  -e "DB_PASS=$DB_PASS" \
  -e "JWT_SECRET=$JWT_SECRET" \
  "$IMAGE"
