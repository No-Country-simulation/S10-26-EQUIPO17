#!/usr/bin/env bash
set -euo pipefail

# Store de pnpm dentro del contenedor, para que no aparezca una carpeta
# .pnpm-store en el proyecto (que está montado desde otro disco).
pnpm config set store-dir "$HOME/.local/share/pnpm/store" --global

echo "== Versiones =="
node --version
pnpm --version

echo "== Docker del host =="
if ! docker version --format 'Docker {{.Server.Version}}' 2>/dev/null; then
  echo "AVISO: no se pudo hablar con el Docker del host. ¿Está corriendo Docker en tu máquina?"
fi

# Un solo install en la raíz cubre todo el workspace (apps/*, packages/*)
# y el Supabase CLI, que es devDependency de la raíz.
echo "== Instalando dependencias del workspace =="
if [ -f pnpm-lock.yaml ]; then
  pnpm install --frozen-lockfile
else
  pnpm install
fi

pnpm supabase --version || echo "AVISO: falta el Supabase CLI (pnpm add -Dw supabase en la raíz)"
