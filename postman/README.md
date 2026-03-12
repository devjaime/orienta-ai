# Postman QA Comercial Vocari

## Archivos
1. `Vocari-Sales-QA.postman_collection.json`
2. `Vocari-Prod-Demo.postman_environment.json`

## Uso en Postman
1. Importar colección y environment.
2. Seleccionar environment `Vocari Prod Demo`.
3. Ejecutar `00 - Bootstrap / POST auth/dev/setup`.
4. Ejecutar carpetas `01` a `05`.

## Runner local (Newman)
```bash
DEV_SETUP_SECRET=vocari-dev-2026 npm run postman:sales-qa
```

Genera:
1. `reports/postman/newman-report.json`
2. `reports/postman/newman-report.xml`
3. `reports/postman/newman-report.md`

## CI (GitHub Actions)
Workflow: `.github/workflows/postman-sales-qa.yml`

Requiere secret de repositorio:
1. `DEV_SETUP_SECRET`

