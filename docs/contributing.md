# 贡献指南（Contributing）

> DoD：新成员在 10 分钟内完成一次「生成 + 预览 + patch 迭代」。

## 1. 10 分钟快速上手

### Step 0：环境准备（约 2 分钟）

- Node.js 18+
- npm（仓库脚本可直接用 npm；底层 workspace 使用 pnpm）

### Step 1：安装依赖（约 2 分钟）

```bash
npm install
```

### Step 2：首次生成（约 2 分钟）

```bash
npm run pipeline
```

执行后检查以下文件是否存在：

- `output/structure.json`
- `output/prototype.svg`
- `output/preview.html`
- `output/pipeline-log.json`

### Step 3：本地预览（约 2 分钟）

```bash
cd apps/web-preview
npm run dev
```

浏览器访问 Next.js 默认地址（通常为 `http://localhost:3000`）。

### Step 4：做一次 patch 迭代（约 2 分钟）

回到仓库根目录后执行：

```bash
npm run patch -- "add button to header interaction"
npm run pipeline
```

## 2. 提交前检查

建议在根目录执行：

```bash
npm run lint
npm run typecheck
npm run test
```

如需一次性全量检查：

```bash
npm run check
```

## 3. 目录与协作约定

- 输入来源：`input/prd.md`
- 生成产物：`output/*`
- 前端预览：`apps/web-preview`
- 核心包：`packages/parser|schema|planner|codegen|evaluator`

协作建议：

- 改 PRD 或 patch 指令后，务必重新跑 `npm run pipeline`。
- 尽量保持命令在仓库根目录执行，避免路径偏差。
- 提交 PR 时附上：改动说明、复现命令、关键产物变化。

