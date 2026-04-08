# 架构说明（Architecture）

> 目标：让新成员在 10 分钟内理解「从 PRD 到原型」的整体链路，并知道每一步由哪个包负责。

## 1. 系统定位

本仓库是一个 Monorepo（pnpm workspace + turbo），核心流程是：

1. 读取 `input/prd.md`
2. 解析为统一 UI Schema
3. 生成前端预览产物
4. 导出静态预览文件（SVG / HTML）
5. 输出本次执行日志

## 2. 当前流程（As-Is）

当前 pipeline 由 `packages/planner/src/pipeline.ts` 串联执行，包含重试机制（每个阶段最多 3 次）。

```text
input/prd.md
  -> parser.parsePrdToSchema
  -> output/structure.json
  -> codegen.generateFrontend（写入 apps/web-preview）
  -> codegen.exportSvg -> output/prototype.svg
  -> codegen.exportHtml -> output/preview.html
  -> output/pipeline-log.json
```

### 2.1 包职责

- `@prd2prototype/parser`：把 PRD Markdown 解析为 UI Schema。
- `@prd2prototype/schema`：定义和复用 schema 类型。
- `@prd2prototype/codegen`：根据 schema 生成前端预览代码，并导出 SVG/HTML。
- `@prd2prototype/planner`：流程编排（pipeline 入口 + 阶段重试 + 日志落盘）。
- `@prd2prototype/evaluator`：对 `output/structure.json` 做指令式 patch。
- `apps/web-preview`：用于本地可视化验证的 Next.js 应用。

### 2.2 输入与输出

- 输入：`input/prd.md`
- 关键输出：
  - `output/structure.json`
  - `apps/web-preview/lib/structure.json`（由生成逻辑维护）
  - `output/prototype.svg`
  - `output/preview.html`
  - `output/pipeline-log.json`

## 3. 目标流程（To-Be）

为满足「新成员 10 分钟可跑通」，建议将流程固定为三段闭环：

1. **Generate**：`prd.md -> schema -> preview`（一次命令可出全部产物）
2. **Inspect**：通过 web-preview 快速验收 UI 结构
3. **Iterate**：patch 指令修改 schema，再次 pipeline 生成

```text
编辑 input/prd.md
  -> npm run pipeline
  -> (可选) npm run dev:web-preview
  -> npm run patch -- "你的修改指令"
  -> npm run pipeline
```

### 3.1 工程化目标

- 单入口命令清晰（根目录 scripts 统一暴露）。
- 输入输出路径固定（避免找不到文件）。
- 新人无需了解包内部实现即可完成首轮迭代。
- 执行后可直接查看 `output/pipeline-log.json` 做结果确认。

## 4. 失败定位建议

- `Patch instruction required.`：`npm run patch -- "..."` 未传入指令。
- `input/prd.md` 不存在：补齐输入文件后重试。
- 预览不更新：先确认是否已重新执行 `npm run pipeline`。

