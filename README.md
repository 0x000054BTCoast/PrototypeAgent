# PRD2PROTOTYPE

## Setup

```bash
npm install
npm run pipeline
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

## Patch Iteration

```bash
npm run patch -- "add button to header interaction"
npm run pipeline
```

## File Tree

```text
project-root/
  input/
    prd.md
  output/
    structure.json
    prototype.svg
    preview.html
    pipeline-log.json
  frontend/
    app/
    components/
    lib/
  scripts/
```
