# Directorio de Datos Raw MINEDUC

Este directorio almacena los archivos descargados desde el portal de Datos Abiertos del MINEDUC.

## Estructura

```
mineduc-raw/
├── matricula/          # Archivos de matrícula
│   ├── Matricula-Ed-Superior-2024.rar
│   └── *.csv (extraídos)
├── titulados/          # Archivos de titulados
│   ├── Titulados-Ed-Superior-2023.rar
│   └── *.csv (extraídos)
└── admision/           # Archivos de pruebas de admisión (opcional)
```

## Instrucciones de Descarga

### 1. Matrícula en Educación Superior

1. Visita: https://datosabiertos.mineduc.cl/matricula-en-educacion-superior/
2. Descarga el archivo más reciente (2024 o 2025)
3. Guarda en `matricula/`
4. Extrae el archivo RAR

### 2. Titulados de Educación Superior

1. Visita: https://datosabiertos.mineduc.cl/titulados-en-educacion-superior/
2. Descarga el archivo más reciente (2023 o 2024)
3. Guarda en `titulados/`
4. Extrae el archivo RAR

## Notas

- Los archivos RAR originales pueden conservarse para respaldo
- Los archivos CSV extraídos son los que procesan los scripts
- Este directorio NO debe incluirse en Git (ver .gitignore)
- Tamaño aproximado: ~200-500MB por dataset
