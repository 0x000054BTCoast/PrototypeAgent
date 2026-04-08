# Fixtures

用于 CI 的基线样例目录：

- `prd/`：输入 PRD（Markdown）
- `expected/`：期望结构（JSON）
- `screenshots/`：截图基线占位（Markdown，可由 CI 替换为真实截图产物）
- `schema-references/`：`AppSchemaV2` 参考示例（JSON），可通过 `pnpm --filter @prd2prototype/schema test` 做批量校验

当前包含 5 个初始 pipeline 样例（`sample-01` ~ `sample-05`）和 10 个 schema reference 样例（`sample-01-dashboard` ~ `sample-10-support`）。
