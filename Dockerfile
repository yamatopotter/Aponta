# syntax=docker/dockerfile:1
#
# Uma única imagem serve dois papéis (ver docker-entrypoint.sh):
#   docker run <imagem> web     -> aplica migrations e sobe o Next.js
#   docker run <imagem> worker  -> roda o worker de sincronização com o RHiD
# Ver docker-compose.prod.yml para como isso é usado em produção.

FROM node:20-alpine AS base
# Prisma em Alpine precisa do openssl explicitamente (musl não traz por padrão).
RUN apk add --no-cache openssl
WORKDIR /app

# ---- deps: instalação completa (com devDependencies), usada só pra build ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: gera o client do Prisma e compila o Next ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runtime-deps: só dependências de produção (sem typescript/tailwind/playwright) ----
FROM base AS runtime-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate

# ---- runner: imagem final ----
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=runtime-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
# src/ e tsconfig.json ficam porque o worker roda via tsx (transpila na hora,
# não usa o build do Next) — o server do Next em si só depende de .next/.
COPY --from=builder /app/src ./src
COPY --from=builder /app/worker ./worker
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh \
  && mkdir -p uploads \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["web"]
