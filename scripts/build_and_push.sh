#!/bin/bash
# ==============================================================================
# Script de Build e Push Docker - OdontoControl
# Calcula a versão incremental no Docker Hub, faz o build e publica as tags.
# ==============================================================================
set -e

# Configurações padrão
DOCKER_USER="${DOCKER_USERNAME:-williamwilmer10}"
REPOSITORY="${DOCKER_REPOSITORY:-odontocontrol}"
MIN_VERSION="0.1.0"

echo "========================================="
echo "   ODONTOCONTROL - BUILD & PUSH DOCKER   "
echo "========================================="
echo "Docker User: ${DOCKER_USER}"
echo "Repository : ${REPOSITORY}"
echo "========================================="

# 1. Login no Docker Hub se as credenciais forem fornecidas
if [ -n "$DOCKER_PASSWORD" ]; then
  echo "Efetuando login no Docker Hub..."
  echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USER" --password-stdin
else
  echo "Aviso: DOCKER_PASSWORD não informado. Assumindo login local ativo."
fi

# 2. Buscar última tag publicada para calcular versão incremental
echo "Consultando última tag no Docker Hub..."
TAGS_JSON=$(curl -s "https://registry.hub.docker.com/v2/repositories/${DOCKER_USER}/${REPOSITORY}/tags/?page_size=15")

LAST_TAG=""
if echo "$TAGS_JSON" | grep -q '"name":'; then
  # Extrai a última tag no formato vX.Y.Z sem necessidade de jq
  LAST_TAG=$(echo "$TAGS_JSON" | grep -o '"name":"v[0-9]*\.[0-9]*\.[0-9]*"' | head -n 1 | cut -d'"' -f4)
fi

if [ -z "$LAST_TAG" ]; then
  echo "Nenhuma tag vX.Y.Z encontrada. Iniciando com versão base: v${MIN_VERSION}"
  NEXT_TAG="v${MIN_VERSION}"
else
  echo "Última versão encontrada no Docker Hub: ${LAST_TAG}"
  VERSION_PART=${LAST_TAG#v}
  IFS='.' read -r major minor patch <<< "$VERSION_PART"
  NEXT_PATCH=$((patch + 1))
  NEXT_TAG="v${major}.${minor}.${NEXT_PATCH}"
fi

echo "Nova versão calculada: ${NEXT_TAG}"

# 3. Buildar imagem utilizando o Dockerfile da raiz
IMAGE_NAME="${DOCKER_USER}/${REPOSITORY}"
echo "Iniciando compilação da imagem Docker: ${IMAGE_NAME}:${NEXT_TAG}..."
docker build -t "${IMAGE_NAME}:${NEXT_TAG}" -t "${IMAGE_NAME}:latest" .

# 4. Publicar tag versionada
echo "Enviando tag versionada ${NEXT_TAG}..."
docker push "${IMAGE_NAME}:${NEXT_TAG}"

# 5. Aguardar confirmação da tag no registro do Docker Hub
echo "Aguardando indexação da tag ${NEXT_TAG} no Docker Hub..."
MAX_ATTEMPTS=12
ATTEMPT=1
while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  CHECK_TAGS=$(curl -s "https://registry.hub.docker.com/v2/repositories/${DOCKER_USER}/${REPOSITORY}/tags/?page_size=10")
  if echo "$CHECK_TAGS" | grep -q "\"name\":\"${NEXT_TAG}\""; then
    echo "Tag ${NEXT_TAG} indexada e confirmada!"
    break
  fi
  echo "Tentativa ${ATTEMPT}/${MAX_ATTEMPTS}: Ainda não indexada. Aguardando 10 segundos..."
  sleep 10
  ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
  echo "Aviso: Tempo limite esgotado para confirmação da tag, mas o push foi enviado."
fi

# 6. Publicar tag latest
echo "Enviando tag latest..."
docker push "${IMAGE_NAME}:latest"

echo "========================================="
echo "            RESUMO DE PUBLICACAO         "
echo "========================================="
echo "Imagem publicada com sucesso:"
echo "-> ${IMAGE_NAME}:${NEXT_TAG}"
echo "-> ${IMAGE_NAME}:latest"
echo "========================================="
