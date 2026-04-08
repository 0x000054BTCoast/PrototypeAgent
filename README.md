# PRD2Prototype

把 PRD 转成可继续评审、迭代和演示的产品原型。

当前仓库包含两层能力：

- `planner pipeline`：把 `input/prd.md` 转成结构化产物和静态预览。
- `web-preview`：把最新 `structure.json` 渲染成一个更接近 `v0.app` 风格的原型工作台，支持输入需求、触发 run、查看日志、切换历史版本、直接预览完整画布。

## 1. 现在能做什么

从一个 PRD 出发，仓库会输出：

- 结构化结果：`llm-structured.json`、`structure.json`、`app-schema-v2.json`
- 静态预览：`preview.html`、`prototype.svg`
- 运行日志：`pipeline-log.json`
- 可交互工作台：`apps/web-preview`

`apps/web-preview` 的首页现在就是生成器入口，不再只是单页 demo：

- 左侧：PRD 输入、Provider 选择、运行触发、日志与历史 run
- 右侧：由最新 `structure.json` 自动生成的完整产品级原型画布
- 画布视图：桌面工作台、详情流、移动端快照

## 2. 仓库结构

```text
project-root/
  input/
    prd.md
  runs/
    2026-04-08T12-30-45Z_<traceId>/
      input/prd.md
      artifacts/
        llm-structured.json
        structure.json
        app-schema-v2.json
      output/
        preview.html
        prototype.svg
      logs/
        pipeline-log.json
  output/
    latest -> ../runs/<runId>/    # 软链接，若系统支持
    latest-run.json
  packages/
    schema/
    parser/
    planner/
    codegen/
    evaluator/
  apps/
    web-preview/                  # Next.js 原型工作台
  docs/
    architecture.md
    pipeline.md
    deployment-guide.zh-CN.md
    user-manual.zh-CN.md
```

## 3. 环境要求

- Node.js 20+
- pnpm 10+（项目声明为 `pnpm@10.7.1`）

建议先检查：

```bash
node -v
pnpm -v
```

如果本机还没有 `pnpm`，推荐：

```bash
corepack enable
corepack prepare pnpm@10.7.1 --activate
```

## 4. 快速开始

### 4.1 安装依赖

```bash
pnpm install
```

### 4.2 准备 PRD

把你的需求写到：

```text
input/prd.md
```

### 4.3 跑一次 pipeline

```bash
pnpm pipeline
```

这一步会生成新的 `runs/<runId>/...` 目录，并刷新 `output/latest-run.json`。

重点查看：

- `runs/<runId>/artifacts/structure.json`
- `runs/<runId>/output/preview.html`
- `runs/<runId>/output/prototype.svg`
- `runs/<runId>/logs/pipeline-log.json`

### 4.4 启动原型工作台

在仓库根目录执行：

```bash
pnpm --filter web-preview dev
```

默认访问：

```text
http://localhost:3000
```

打开后你会看到：

- 首页即生成工作台
- 可直接修改 PRD 文本并触发 `/api/run`
- 可切换历史 run 查看不同 `structure.json`
- 可在一个更高保真的画布里查看生成结果

## 5. 常用命令

```bash
# 运行 pipeline
pnpm pipeline

# 启动 web-preview
pnpm --filter web-preview dev

# 构建 web-preview
pnpm --filter web-preview build

# 端到端 baseline（含耗时统计）
pnpm baseline

# 根据自然语言指令迭代 patch
pnpm patch -- "add button to header interaction"

# 解析器评估
pnpm eval:parser

# 质量门禁（本地）
pnpm quality:gate

# 质量门禁（CI）
pnpm quality:gate:ci

# 全量检查
pnpm check
```

## 6. 运行目录与清理

```bash
# 指定本次运行目录（两个参数等价）
pnpm pipeline --run-dir runs/my-debug-run
pnpm pipeline --workspace-dir runs/my-debug-run

# 清理旧运行（例：保留最近 20 个，且删除 7 天前数据）
pnpm runs:prune -- --keep 20 --days 7
```

如果你计划长期部署，建议把 `runs/` 和 `output/` 视为持久化目录处理。

## 7. 发布前建议验证

至少跑以下命令：

```bash
pnpm --filter web-preview build
pnpm quality:gate
```

如果你这次主要改的是前端工作台，最小验证可以先跑：

```bash
pnpm --filter web-preview build
```

## 8. 质量门禁指标说明

`pnpm quality:gate` 会输出：

- `success_rate`
- `duration_ms`
- `error_distribution`
- `editable_stability_rate`
- `baseline_score`

建议合并前至少达到 `pnpm quality:gate:ci` 的门槛。

## 9. 文档入口

- 部署指南：[`docs/deployment-guide.zh-CN.md`](docs/deployment-guide.zh-CN.md)
- 使用说明：[`docs/user-manual.zh-CN.md`](docs/user-manual.zh-CN.md)
