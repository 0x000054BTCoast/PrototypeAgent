# PRD2Prototype

将产品需求文档（PRD）快速转换为可预览前端原型的 Monorepo 工程。

- 输入：`input/prd.md`
- 输出：`runs/<runId>/...` 分层产物 + `apps/web-preview` 预览应用

## 1. 仓库结构

```text
project-root/
  input/                      # PRD 输入目录
    prd.md
  runs/                       # 每次运行一个目录（自动生成）
    2026-04-08T12-30-45Z_<traceId>/
      input/prd.md
      artifacts/
        llm-structured.json
        structure.json
        app-schema-v2.json
        compatibility-report.json
      output/
        preview.html
        prototype.svg
      logs/pipeline-log.json
  output/                     # 最新运行快捷引用
    latest -> ../runs/<runId>/ (软链接，若系统支持)
    latest-run.json
  packages/
    schema/                   # 数据结构约束与校验
    parser/                   # PRD 解析
    planner/                  # 流程编排（pipeline）
    codegen/                  # 代码生成
    evaluator/                # patch 与评估能力
  apps/
    web-preview/              # Next.js 预览应用
  docs/
    architecture.md
    pipeline.md
    deployment-guide.zh-CN.md # 部署指南
    user-manual.zh-CN.md      # 使用说明书（小白版）
```

## 2. 环境要求

- Node.js 20+
- pnpm 10+（项目 `packageManager` 为 `pnpm@10.7.1`）

建议先检查：

```bash
node -v
pnpm -v
```

## 3. 快速开始（本地）

### 3.1 安装依赖

```bash
pnpm install
```

### 3.2 放入你的 PRD

将需求文档写入或替换：

```text
input/prd.md
```

### 3.3 运行生成流水线

```bash
pnpm pipeline
```

运行后重点查看：

- `runs/<runId>/artifacts/structure.json`
- `runs/<runId>/output/preview.html`
- `runs/<runId>/output/prototype.svg`
- `runs/<runId>/logs/pipeline-log.json`
- `output/latest-run.json`（默认 latest 指针）

### 3.4 启动前端预览

```bash
pnpm --filter web-preview dev
```

浏览器访问终端提示地址（通常是 `http://localhost:3000`）。

### 3.5 运行目录与清理

```bash
# 指定本次运行目录（两个参数等价）
pnpm pipeline --run-dir runs/my-debug-run
pnpm pipeline --workspace-dir runs/my-debug-run

# 清理旧运行（例：保留最近 20 个，且删除 7 天前数据）
pnpm runs:prune -- --keep 20 --days 7
```

## 4. 常用命令速查

```bash
# 端到端 baseline（含耗时统计）
pnpm baseline

# 根据自然语言指令迭代 patch
pnpm patch -- "add button to header interaction"

# 解析器评估
pnpm eval:parser

# 从 schema 生成任务 DAG
pnpm dag

# 质量门禁（本地）
pnpm quality:gate

# 质量门禁（CI 严格阈值）
pnpm quality:gate:ci

# 全量检查
pnpm check
```

## 5. 部署与运维入口

- 部署指南（Linux / PM2 / Nginx）：[`docs/deployment-guide.zh-CN.md`](docs/deployment-guide.zh-CN.md)
- 使用说明书（零基础）：[`docs/user-manual.zh-CN.md`](docs/user-manual.zh-CN.md)

推荐上线前最小检查：

```bash
pnpm install
pnpm --filter web-preview build
pnpm quality:gate
```

## 6. 常见问题（快速定位）

- **改了 PRD 但页面没变化**：重新执行 `pnpm pipeline`，并确认 `output/latest-run.json` 时间戳已更新。
- **服务可访问但产物旧**：检查是否使用了最新 run 的 `runs/<runId>/output/*`。
- **端口冲突（3000）**：`pnpm --filter web-preview dev -- --port 3001` 或 `start -- -p 3100`。
- **部署后重启失败**：优先查看进程日志（PM2 或 systemd）和 Node 版本是否仍为 20+。
