# Pipeline 说明

## 1. 命令入口

在仓库根目录可用的核心命令：

```bash
npm run pipeline                    # 运行完整生成链路
npm run baseline                    # 基线复现实验（prd -> structure -> frontend + 耗时）
npm run patch -- "<instruction>"    # 对 output/structure.json 做增量修改
npm run build                       # turbo 构建
npm run lint                        # eslint
npm run test                        # turbo 测试
npm run typecheck                   # turbo 类型检查
npm run check                       # lint + test + typecheck + build
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
2. **ui_generator**
   - 输入：`output/structure.json`
   - 产出：`apps/web-preview` 下预览依赖文件
3. **svg_exporter**
   - 产出：`output/prototype.svg`
4. **html_exporter**
   - 产出：`output/preview.html`
5. **log writer**
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

