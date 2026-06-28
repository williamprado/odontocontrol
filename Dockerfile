# syntax=docker/dockerfile:1

# --- Builder Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências antes de copiar o código para aproveitar o cache de camadas do Docker
COPY package*.json ./
RUN npm ci

# Copia o restante dos arquivos do projeto
COPY . .

# Executa o build de produção (compila o frontend e o servidor Nitro/TanStack Start)
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=America/Sao_Paulo

# Copia apenas o output de produção gerado pelo Nitro
COPY --from=builder /app/.output ./.output

# Garante permissões adequadas para o usuário não-root 'node'
RUN chown -R node:node /app

# Define o usuário não-root para execução
USER node

# Expõe a porta interna configurada do servidor
EXPOSE 3000

# Executa a aplicação diretamente pelo entrypoint do Nitro
CMD ["node", ".output/server/index.mjs"]
