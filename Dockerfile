# syntax=docker/dockerfile:1

# --- Builder Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Instala dependências antes de copiar o código para aproveitar o cache de camadas do Docker
COPY package*.json ./
RUN npm ci

# Copia o restante dos arquivos do projeto
COPY . .

# Executa o build de produção (compila o frontend e o servidor Nitro/TanStack Start)
RUN npm run build

# --- Production Stage ---
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=America/Sao_Paulo

# Copia o output do Nitro, dependências e scripts de inicialização
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Garante permissões adequadas para o usuário não-root 'node'
RUN chown -R node:node /app

# Define o usuário não-root para execução
USER node

# Expõe a porta interna configurada do servidor
EXPOSE 3000

# Executa a inicialização do super admin e inicia a aplicação
CMD ["sh", "-c", "node scripts/bootstrap-super-admin.mjs && node .output/server/index.mjs"]

