# PRD2Prototype 使用说明书（给零基础同学）

> 一句话：你写一份 PRD，项目会帮你生成结构化页面和可预览原型。

---

## 1. 先认识这个项目

你可以把它理解成一个“需求转页面草图机”：

1. 把需求写到 `input/prd.md`
2. 运行命令
3. 自动得到：
   - 页面结构 JSON（给程序用）
   - HTML/SVG 预览（给人看）
   - Web 预览站点（可交互查看）

---

## 2. 第一次使用（一步一步来）

### 第 1 步：安装依赖

在项目根目录执行：

```bash
pnpm install
```

### 第 2 步：准备你的需求文档

编辑这个文件：

```text
input/prd.md
```

可以用自然语言描述页面，比如：

- 登录页有什么输入框
- 仪表盘有哪些卡片
- 列表页有哪些筛选条件

### 第 3 步：运行生成流程

```bash
pnpm pipeline
```

### 第 4 步：查看结果

执行后重点看：

- `output/structure.json`：结构化数据（机器可读）
- `output/preview.html`：浏览器可打开预览
- `output/prototype.svg`：原型图
- `output/pipeline-log.json`：运行日志

### 第 5 步：启动可交互预览站点

```bash
cd apps/web-preview
pnpm dev
```

然后浏览器访问终端里显示的地址（通常 `http://localhost:3000`）。

---

## 3. 你最常用的 6 条命令

```bash
# 1) 安装依赖
pnpm install

# 2) 根据 PRD 生成原型
pnpm pipeline

# 3) 启动预览站点
pnpm --filter web-preview dev

# 4) 快速跑一遍 baseline（带统计）
pnpm baseline

# 5) 质量检查
pnpm quality:gate

# 6) 全量检查（lint/test/typecheck/build）
pnpm check
```

---

## 4. 新手建议工作流（每天照着做）

1. 写/改 `input/prd.md`
2. 执行 `pnpm pipeline`
3. 打开 `apps/web-preview` 看效果
4. 不满意就继续改 PRD，再跑一遍
5. 准备提交前跑 `pnpm quality:gate`

---

## 5. 输出文件到底有什么区别？

- `structure.json`：给程序消费，适合后续自动化处理。
- `preview.html`：最轻量预览，双击或浏览器打开都可看。
- `prototype.svg`：适合设计评审、文档引用。
- `pipeline-log.json`：排查问题时最有用。

---

## 6. 常见报错与解决

### 1) `pnpm` 命令找不到

先确认是否安装 pnpm：

```bash
pnpm -v
```

没有版本号就先安装 pnpm。

### 2) `pipeline` 执行失败

先看日志文件：

```text
output/pipeline-log.json
```

通常是 PRD 语义不完整、依赖未安装或环境版本不匹配。

### 3) 页面没变化

请确认你是否：

- 改的是 `input/prd.md`
- 改完后重新执行了 `pnpm pipeline`
- 刷新了浏览器页面

### 4) 本地端口 3000 被占用

换个端口启动：

```bash
pnpm --filter web-preview dev -- --port 3001
```

---

## 7. 给产品/运营同学的建议

如果你不写代码，也可以高效使用：

- 用自然语言清楚描述页面区域（顶部、侧边栏、内容区）
- 明确每个模块的目标（展示、输入、筛选、提交）
- 把异常状态写出来（空状态、加载中、报错提示）

这样生成结果会更稳定、可用性更高。

---

## 8. 术语翻译（看不懂时查这里）

- **PRD**：产品需求文档
- **Pipeline**：一条自动处理流水线
- **Schema/Structure**：结构化定义
- **Patch**：在已有结果上做增量调整
- **Quality Gate**：质量门禁检查

---

## 9. 30 秒上手版（超短）

```bash
pnpm install
# 编辑 input/prd.md
pnpm pipeline
pnpm --filter web-preview dev
```

到这一步，你就已经能跑起来了。

---

## 10. 仅用 Web 工作台完成一次生成

如果你不想碰命令行，可以直接在 Web 工作台完成一次完整生成：

1. 启动 Web 站点：

```bash
pnpm --filter web-preview dev
```

2. 浏览器打开 `http://localhost:3000/workbench`。
3. 在“输入区”填写：
   - PRD 文本（直接粘贴）或
   - PRD 文件路径（例如 `input/prd.md`）。
4. 在“运行配置区”设置：
   - 模型 Provider（`auto/deepseek/fallback/local`）
   - 输出目录（可留空，默认 `output/runs/{runName}`）
   - run 名称（建议填有业务含义的名字）
5. 点击“运行 Planner”。
6. 在“结果区”查看：
   - 结构化 JSON（`structure.json`）
   - Prototype 预览（`preview.html`）
   - 日志事件流（来自 `pipeline-log.json`，可看阶段耗时和错误码）
7. 在“历史运行”里切换不同 run，回看之前产物与状态。

这样就能完成从需求输入到原型查看的闭环，无需手动执行 `pnpm pipeline`。
