# PRD2PROTOTYPE

## Setup

```bash
npm install
npm run pipeline
# or run baseline (prd -> structure.json -> frontend with timing stats)
npm run baseline
npm run quality:gate  # generate + checks + auto-fix retries + report
npm run quality:gate:ci # CI gate (merge to main requires baseline score threshold)
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
npm run quality:gate  # generate + checks + auto-fix retries + report
npm run quality:gate:ci # CI gate (merge to main requires baseline score threshold)
```

## Parser Evaluation

```bash
npm run eval:parser
# outputs comparable scoring reports:
# - output/parser-eval-report.json
# - output/parser-eval-report.md
```

## Quality Gate Metrics

`npm run quality:gate` now outputs per-attempt metrics:

- success_rate（成功率）
- duration_ms（耗时）
- error_distribution（错误分布）
- editable_stability_rate（可编辑稳定率）
- baseline_score（基准分数）

CI can enforce thresholds with `npm run quality:gate:ci`.  
DoD：合并到主分支前，`baseline_score` 必须达到门禁阈值。

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
