# PRD2PROTOTYPE

## Setup

```bash
npm install
npm run pipeline
# or run baseline (prd -> structure.json -> frontend with timing stats)
npm run baseline
```

## Run Frontend

```bash
cd apps/web-preview
npm run dev
```

## Patch Iteration

```bash
npm run patch -- "add button to header interaction"
npm run pipeline
# or run baseline (prd -> structure.json -> frontend with timing stats)
npm run baseline
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
  packages/
    schema/
    parser/
    planner/
    codegen/
    evaluator/
  apps/
    web-preview/
```
