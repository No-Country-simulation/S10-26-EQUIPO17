FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# pnpm vía corepack (viene con Node 22). La versión exacta para el equipo queda
# fijada en el campo "packageManager" del package.json (`corepack use pnpm@10`).
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable pnpm \
    # psql para inspeccionar la base local desde la terminal
    && apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# El Supabase CLI NO se instala acá: es una devDependency del proyecto
# (`pnpm add -D supabase`) y se usa con `pnpm supabase ...`.
