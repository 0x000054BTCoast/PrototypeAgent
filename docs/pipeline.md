# Pipeline 说明

## 1. 命令入口

在仓库根目录可用的核心命令：

```bash
npm run pipeline                    # 运行完整生成链路
npm run baseline                    # 基线复现实验（prd -> structure -> frontend + 耗时）
npm run patch -- "<instruction>"    # 对 output/structure.json 做增量修改
npm run dag [schemaPath] [outPath]    # 由 AppSchema 生成任务 DAG（tokens→primitives→routes→features→tests）
npm run build                       # turbo 构建
npm run lint                        # eslint
npm run test                        # turbo 测试
npm run typecheck                   # turbo 类型检查
npm run check                       # lint + test + typecheck + build
npm run quality:gate                # 生成 + typecheck + lint + build + e2e smoke + screenshot diff（失败自动修复并重试）
```

其中：

- `npm run pipeline` 实际调用：`pnpm --filter @prd2prototype/planner pipeline`
- `npm run baseline` 实际调用：`tsx scripts/baseline-run.ts`
- `npm run patch` 实际调用：`pnpm --filter @prd2prototype/evaluator patch`

## 2. Pipeline 阶段

`planner` 中的 pipeline 依次执行以下阶段（每阶段最多重试 3 次）：

1. **prd_parser**
   - 读取：`input/prd.md`
   - 产出：`output/structure.json`
2. **schema_migration_v2**
   - 输入：`output/structure.json`（UISchema）
   - 产出：`output/app-schema-v2.json`、`output/compatibility-report.json`
3. **ui_generator**
   - 输入：`output/structure.json`
   - 产出：`apps/web-preview` 下预览依赖文件
4. **svg_exporter**
   - 产出：`output/prototype.svg`
5. **html_exporter**
   - 产出：`output/preview.html`
6. **log writer**
   - 产出：`output/pipeline-log.json`

## 3. 当前流程 vs 目标流程

### 当前流程

- 开发者需要记住多个入口命令，但文档分散。
- 能跑通流程，但新人需要自行拼接路径和验证步骤。

### 目标流程（面向新成员 10 分钟上手）

统一推荐以下最短路径：

1. `npm install`
2. `npm run pipeline`
3. （可选）进入 `apps/web-preview` 执行 `npm run dev` 查看效果
4. `npm run patch -- "..."`
5. `npm run pipeline` 再生成

## 4. 常见问题（FAQ）

- **Q: patch 报错缺少指令？**
  - A: 必须使用 `npm run patch -- "你的指令"` 形式传参。
- **Q: 为什么改了 PRD 但预览没变？**
  - A: 需要重新执行 `npm run pipeline` 刷新生成产物。
- **Q: 如何确认 pipeline 真的执行完成？**
  - A: 检查 `output/pipeline-log.json` 的 `executed_at` 时间戳是否更新。
- **Q: 旧版 `output/structure.json` 如何升级到 AppSchemaV2？**
  - A: 直接执行 `npm run pipeline`，会自动生成 `output/app-schema-v2.json` 与兼容性报告 `output/compatibility-report.json`。

## 5. 从 schema 生成 DAG 任务图

可用命令：

```bash
npm run dag
# 等价于：tsx scripts/generate-dag.ts output/app-schema-v2.json output/task-dag.md

# 也支持自定义输入/输出路径
npm run dag -- fixtures/schema-references/sample-01-dashboard.json output/sample-01-task-dag.md
```

该命令会输出 Mermaid 流程图，显式展示 `tokens → primitives → routes → features → tests` 的阶段顺序及依赖关系。

默认输出：`output/task-dag.md`。

## 6. 质量闸门（自动重试 + 自动修复）

新增命令：

```bash
npm run quality:gate
# 等价于: tsx scripts/quality-gate.ts

# 指定自动修复重试上限（例如 3 次）
npm run quality:gate:strict
# 等价于: tsx scripts/quality-gate.ts --max-retries 3
```

流程顺序：

1. `pipeline`（先生成）
2. `typecheck`
3. `lint`
4. `build`
5. `e2e smoke`（`pnpm --filter web-preview test`）
6. `screenshot diff`（`fixtures/screenshots` vs `output/screenshots`）

失败处理策略：

- 任一阻断步骤失败后，自动执行：
  - `pnpm exec eslint . --fix`
  - `pnpm format`
- 然后重跑完整流程，最多重试 `N` 次（`--max-retries N`）。

报告产物：

- `output/quality-gate-report.json`
- `output/quality-gate-report.md`

> 注：若 `output/screenshots` 不存在，`screenshot diff` 记为 `WARNING`，不会阻断整体验证。
