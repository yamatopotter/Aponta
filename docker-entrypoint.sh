#!/bin/sh
set -e

case "$1" in
  web)
    echo "[entrypoint] Aplicando migrations..."
    npx prisma migrate deploy
    echo "[entrypoint] Garantindo admin padrão e dados iniciais..."
    npx tsx prisma/seed.ts
    echo "[entrypoint] Iniciando servidor Next.js..."
    exec npm run start
    ;;
  worker)
    echo "[entrypoint] Iniciando worker de sincronização com o RHiD..."
    exec npx tsx worker/sync-worker.ts
    ;;
  migrate)
    exec npx prisma migrate deploy
    ;;
  *)
    exec "$@"
    ;;
esac
