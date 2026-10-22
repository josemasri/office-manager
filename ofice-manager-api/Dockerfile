# Reemplaza el build de Nixpacks (que fijaba un Node viejo) replicando sus pasos:
# install "pnpm i --frozen-lockfile" -> build "pnpm run build" -> start ("nest start").
# Node fijado a una versión con el parche de CVE-2026-111497 (Brotli). No bajar de aquí.
FROM node:22.23.4-bookworm-slim

# Mismas variables que inyecta Nixpacks en el build y en runtime.
ENV NODE_ENV=production \
    NPM_CONFIG_PRODUCTION=false \
    CI=true \
    PATH=/app/node_modules/.bin:$PATH

WORKDIR /app
COPY . .

# Sin "packageManager" y con lockfile v9, Nixpacks usa pnpm 9.
RUN npm install -g pnpm@9.15.9
RUN pnpm i --frozen-lockfile
RUN pnpm run build

EXPOSE 3000
# Equivale a "nest start" (CLI 11): este recompila igual que "pnpm run build" y luego ejecuta
# "node --enable-source-maps dist/src/main.js" (prueba dist/src/main antes que dist/main).
# Como ormconfig.ts está fuera de src/, tsc deja la salida en dist/src/, así que "node dist/main" NO arranca.
CMD ["node", "--enable-source-maps", "dist/src/main"]
