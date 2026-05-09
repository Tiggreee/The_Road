#!/usr/bin/env bash
# Copia *.mdc desde ~/.cursor/rules al .cursor/rules de este repo.
# Uso: ./scripts/apply-vmdev-rules.sh   o   bash scripts/apply-vmdev-rules.sh [--dry-run]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROFILE_RULES="${HOME}/.cursor/rules"
DEST="${REPO_ROOT}/.cursor/rules"
CONSOLIDATED="${HOME}/.cursor/global-user-rules-consolidated.md"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

echo ""
echo "=== Aplicar reglas vmDev al repo ==="
echo "Repo:    ${REPO_ROOT}"
echo "Origen:  ${PROFILE_RULES}"
echo "Destino: ${DEST}"
echo ""

if [[ ! -d "${PROFILE_RULES}" ]]; then
  echo "No existe: ${PROFILE_RULES}" >&2
  exit 1
fi

shopt -s nullglob
mapfile -t FILES < <(find "${PROFILE_RULES}" -maxdepth 1 -name '*.mdc' -type f | sort)
if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "No hay .mdc en ${PROFILE_RULES}" >&2
  exit 1
fi

if [[ "${DRY_RUN}" == true ]]; then
  echo "[dry-run] Se copiarían ${#FILES[@]} archivo(s):"
  for f in "${FILES[@]}"; do echo "  - $(basename "$f")"; done
  exit 0
fi

mkdir -p "${DEST}"
for f in "${FILES[@]}"; do
  cp -f "${f}" "${DEST}/"
done

echo "Listo: copiados ${#FILES[@]} .mdc a .cursor/rules/"
echo ""
echo "Siguiente (reglas globales del IDE):"
if [[ -f "${CONSOLIDATED}" ]]; then
  echo "  1) Configuración del editor → Reglas de usuario"
  echo "  2) Pega todo desde: ${CONSOLIDATED}"
else
  echo "  No hay ${CONSOLIDATED}; pega tus reglas globales donde las tengas."
fi
echo ""
