#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
IMAGE_NAME="brdocker2020/homefinance"
DOCKER_USER="${DOCKER_USER:-}"
VERSION="$(node -e 'process.stdout.write(require(process.argv[1]).version)' "$ROOT_DIR/frontend/package.json")"
MULTI_ARCH_PUSHED=0

if [[ -z "$VERSION" ]]; then
  echo "Nao foi possivel ler a versao em frontend/package.json."
  exit 1
fi

TAG_VERSION="${IMAGE_NAME}:${VERSION}"
TAG_LATEST="${IMAGE_NAME}:latest"

read -r -p "Build multi-arch (amd64+arm64) e publicar? (s/N): " MULTI_ARCH

ensure_docker_login() {
  if docker info 2>/dev/null | grep -qi "Username:"; then
    return 0
  fi

  echo
  if [[ -z "${DOCKER_USER:-}" ]]; then
    read -r -p "Usuario Docker Hub: " DOCKER_USER
  fi
  if [[ -z "${DOCKER_USER:-}" ]]; then
    echo "Usuario Docker Hub obrigatorio."
    exit 1
  fi

  echo "============================================"
  echo " Login no Docker Hub"
  echo " Usuario: ${DOCKER_USER}"
  echo "============================================"
  echo

  docker login -u "$DOCKER_USER"
}

if [[ "${MULTI_ARCH,,}" == "s" || "${MULTI_ARCH,,}" == "sim" ]]; then
  ensure_docker_login
  if ! docker buildx inspect homefinance_multiarch >/dev/null 2>&1; then
    docker buildx create --use --name homefinance_multiarch >/dev/null
  else
    docker buildx use homefinance_multiarch >/dev/null
  fi

  docker buildx build \
    -f "$SCRIPT_DIR/Dockerfile" \
    --platform linux/amd64,linux/arm64 \
    --build-arg "APP_VERSION=$VERSION" \
    -t "$TAG_VERSION" \
    -t "$TAG_LATEST" \
    --push \
    "$ROOT_DIR"

  MULTI_ARCH_PUSHED=1
else
  docker build \
    -f "$SCRIPT_DIR/Dockerfile" \
    --build-arg "APP_VERSION=$VERSION" \
    -t "$TAG_VERSION" \
    -t "$TAG_LATEST" \
    "$ROOT_DIR"
fi

if [[ "$MULTI_ARCH_PUSHED" -ne 1 ]]; then
  read -r -p "Deseja enviar para o Docker Hub? (s/N): " DO_PUSH
  if [[ "${DO_PUSH,,}" == "s" || "${DO_PUSH,,}" == "sim" ]]; then
    ensure_docker_login
    docker push "$TAG_VERSION"
    docker push "$TAG_LATEST"
  fi
fi

echo
echo "============================================"
echo " Build concluido com sucesso!"
echo " Versao da aplicacao: $VERSION"
echo " Imagem: $TAG_VERSION"
echo "============================================"
