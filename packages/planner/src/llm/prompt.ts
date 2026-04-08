export const buildStructuredPlanningPrompt = (
  prdMarkdown: string
): string => `你是一个资深前端架构规划助手。请把下面的 PRD 转换为严格 JSON。

输出要求：
1. 仅输出 JSON 对象，不要输出 markdown 代码块，不要输出解释文本。
2. 字段必须完整：schemaVersion,page_name,layout,sections,interactions。
3. schemaVersion 固定为 2。
4. layout 固定为 {"type":"grid","columns":24}。
5. sections 为数组；每个 section 需包含 id,name,position,components。
6. position 仅可取 top/left/center/right/bottom。
7. components 中每项需包含 id,type,props,style,children。
8. type 仅可取 chart/table/button/card/text。
9. interactions 必须是数组（可为空）。
10. 无法确定时给出最保守且可解析的默认值，禁止省略必填字段。

PRD 内容如下：
${prdMarkdown}`;
