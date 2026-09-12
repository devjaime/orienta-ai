#!/usr/bin/env bash
set -euo pipefail

mode="${1:-lint}"
repo_root="$(git rev-parse --show-toplevel)"

if [[ -n "${GITHUB_BASE_REF:-}" ]]; then
  base="origin/${GITHUB_BASE_REF}"
elif [[ -n "${GITHUB_EVENT_BEFORE:-}" && "${GITHUB_EVENT_BEFORE}" != "0000000000000000000000000000000000000000" ]]; then
  base="${GITHUB_EVENT_BEFORE}"
else
  base="origin/main"
fi

files=()
while IFS= read -r file; do
  files+=("${file}")
done < <(
  git -C "${repo_root}" diff --name-only --diff-filter=ACMRT "${base}...HEAD" -- 'backend/**/*.py' \
    | sed 's#^backend/##'
)

if [[ ${#files[@]} -eq 0 ]]; then
  echo "No hay archivos Python modificados."
  exit 0
fi

case "${mode}" in
  lint)
    ruff check "${files[@]}"
    ;;
  format)
    ruff format --check "${files[@]}"
    ;;
  typecheck)
    mypy "${files[@]}" --ignore-missing-imports
    ;;
  *)
    echo "Modo no soportado: ${mode}" >&2
    exit 2
    ;;
esac
