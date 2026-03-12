#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://vocari-api.fly.dev}"
DEV_SETUP_SECRET="${DEV_SETUP_SECRET:-}"
PERIODO_DEMO="${PERIODO_DEMO:-2026-03}"
export BASE_URL DEV_SETUP_SECRET PERIODO_DEMO

if [[ -z "${DEV_SETUP_SECRET}" ]]; then
  echo "Error: falta DEV_SETUP_SECRET"
  echo "Uso: DEV_SETUP_SECRET=*** ./scripts/run-postman-sales-qa.sh"
  exit 1
fi

mkdir -p reports/postman

ENV_TMP="reports/postman/Vocari-Prod-Demo.runtime.postman_environment.json"

node -e "
const fs=require('fs');
const env=JSON.parse(fs.readFileSync('postman/Vocari-Prod-Demo.postman_environment.json','utf8'));
const vars=new Map(env.values.map(v=>[v.key,v]));
vars.get('base_url').value=process.env.BASE_URL;
vars.get('dev_secret').value=process.env.DEV_SETUP_SECRET;
vars.get('periodo_demo').value=process.env.PERIODO_DEMO;
env.values=[...vars.values()];
fs.writeFileSync(process.argv[1], JSON.stringify(env,null,2));
" "${ENV_TMP}"

npx --yes newman run postman/Vocari-Sales-QA.postman_collection.json \
  -e "${ENV_TMP}" \
  --reporters cli,json,junit \
  --reporter-json-export reports/postman/newman-report.json \
  --reporter-junit-export reports/postman/newman-report.xml

node scripts/newman-json-to-markdown.mjs \
  reports/postman/newman-report.json \
  reports/postman/newman-report.md

echo "Reportes generados en reports/postman/"
