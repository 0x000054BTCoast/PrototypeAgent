# PRD2Prototype

将产品需求文档（PRD）快速转成可预览前端原型的 Monorepo 工程。

- 输入：`input/prd.md`
- 输出：`output/structure.json`、`output/preview.html`、`output/prototype.svg`、`apps/web-preview` 预览应用

## 1. 仓库结构

```text
project-root/
  input/                      # PRD 输入目录
    prd.md
  output/                     # 生成产物
    structure.json
    preview.html
    prototype.svg
    pipeline-log.json
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
    contributing.md
    deployment-guide.zh-CN.md # 部署指南（新增）
    user-manual.zh-CN.md      # 小白说明书（新增）
```

## 2. 环境要求

- Node.js 20+
- pnpm 10+（项目 `packageManager` 为 `pnpm@10.7.1`）

> 建议先检查：

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

- `output/structure.json`
- `output/preview.html`
- `output/prototype.svg`
- `output/pipeline-log.json`

### 3.4 启动前端预览

```bash
cd apps/web-preview
pnpm dev
```

浏览器访问终端提示地址（通常是 `http://localhost:3000`）。

## 4. 常用命令速查

```bash
# 端到端 baseline（含耗时统计）
pnpm baseline

# 根据自然语言指令迭代 patch
pnpm patch -- "add button to header interaction"

# 解析器评估
pnpm eval:parser

# 质量门禁（本地）
pnpm quality:gate

# 质量门禁（CI 严格阈值）
pnpm quality:gate:ci

# 全量检查
pnpm check
```

## 5. 质量门禁指标说明

`pnpm quality:gate` 会输出以下指标：

- `success_rate`：成功率
- `duration_ms`：执行耗时
- `error_distribution`：错误分布
- `editable_stability_rate`：可编辑稳定率
- `baseline_score`：综合基准分

合并到主分支前，建议至少满足 CI 标准（`pnpm quality:gate:ci`）。

## 6. 新手文档入口

- 部署指南：[`docs/deployment-guide.zh-CN.md`](docs/deployment-guide.zh-CN.md)
- 使用说明书（小白版）：[`docs/user-manual.zh-CN.md`](docs/user-manual.zh-CN.md)
