import fs from 'node:fs';
import path from 'node:path';
import {
  UISchema,
  UIComponent,
  Position,
  CURRENT_UI_SCHEMA_VERSION,
  type UISchemaIntent
} from '@prd2prototype/schema';

const toSnakeCase = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

type MarkdownToken =
  | {
      kind: 'heading';
      level: number;
      text: string;
      line: number;
    }
  | {
      kind: 'list';
      marker: '-' | '*' | '+' | `${number}.`;
      text: string;
      line: number;
    }
  | {
      kind: 'narrative';
      text: string;
      line: number;
    }
  | {
      kind: 'block';
      blockType: 'code' | 'quote';
      text: string;
      startLine: number;
      endLine: number;
    };

type AstNode =
  | {
      type: 'heading';
      level: number;
      text: string;
      line: number;
    }
  | {
      type: 'list';
      items: Array<{
        marker: '-' | '*' | '+' | `${number}.`;
        text: string;
        line: number;
      }>;
      startLine: number;
      endLine: number;
    }
  | {
      type: 'narrative';
      text: string;
      startLine: number;
      endLine: number;
    }
  | {
      type: 'block';
      blockType: 'code' | 'quote';
      text: string;
      startLine: number;
      endLine: number;
    };

export type DocumentAst = {
  type: 'document';
  nodes: AstNode[];
};

export type SectionAst = {
  id: string;
  name: string;
  headingLevel: number;
  headingLine: number;
  position: Position;
  nodes: AstNode[];
};

export type ParsedPrdAst = {
  document: DocumentAst;
  sections: SectionAst[];
};

export type SchemaTraceEntry = {
  sourceLine: number;
  schemaPath: string;
  detail?: string;
};

export type AstToSchemaResult = {
  schema: UISchema;
  trace: SchemaTraceEntry[];
};

type InferComponentContext = {
  sectionName: string;
  nodeType: AstNode['type'];
};

type ComponentType = UIComponent['type'];
type ParsedInteraction = Record<string, unknown>;

export interface IntentInferenceRule {
  intent: UISchemaIntent;
  keywords: readonly string[];
  weight?: number;
}

export interface IntentInferenceConfig {
  rules?: IntentInferenceRule[];
  fallbackIntent?: UISchemaIntent;
}

export interface ParsePrdToSchemaOptions {
  intent?: IntentInferenceConfig;
}

export const DEFAULT_INTENT_INFERENCE_RULES: IntentInferenceRule[] = [
  {
    intent: 'dashboard',
    keywords: [
      'dashboard',
      'analytics',
      'kpi',
      'metrics',
      'report',
      '看板',
      '分析',
      '指标',
      '报表'
    ],
    weight: 3
  },
  {
    intent: 'crm',
    keywords: [
      'crm',
      'customer',
      'lead',
      'client',
      'sales',
      'pipeline',
      '客户',
      '线索',
      '商机',
      '销售'
    ],
    weight: 3
  },
  {
    intent: 'landing',
    keywords: [
      'landing',
      'hero',
      'pricing',
      'marketing',
      'campaign',
      'cta',
      '落地页',
      '营销',
      '活动页'
    ],
    weight: 3
  },
  {
    intent: 'admin',
    keywords: [
      'admin',
      'management',
      'permission',
      'role',
      'settings',
      'console',
      '后台',
      '管理',
      '权限',
      '配置'
    ],
    weight: 3
  }
];

const COMPONENT_KEYWORDS: Record<ComponentType, readonly string[]> = {
  chart: [
    'chart',
    'graph',
    'trend',
    'funnel',
    'histogram',
    'line chart',
    'bar chart',
    'pie chart',
    'dashboard',
    '图表',
    '趋势',
    '漏斗',
    '柱状图',
    '折线图',
    '饼图',
    '可视化',
    '看板'
  ],
  table: [
    'table',
    'grid',
    'rows',
    'columns',
    'list view',
    'data table',
    'table view',
    '列表',
    '表格',
    '数据表',
    '清单',
    '明细',
    '行',
    '列'
  ],
  button: [
    'button',
    'cta',
    'click',
    'submit',
    'save',
    'confirm',
    'cancel',
    'export',
    'download',
    'btn',
    '按钮',
    '点击',
    '提交',
    '保存',
    '确认',
    '取消',
    '导出',
    '下载'
  ],
  card: [
    'card',
    'panel',
    'tile',
    'widget',
    'summary',
    'kpi',
    'stat',
    '卡片',
    '面板',
    '指标',
    '摘要',
    '统计'
  ],
  text: []
};

const REGEX_RULES: Array<{ type: Exclude<ComponentType, 'text'>; pattern: RegExp; score: number }> =
  [
    { type: 'chart', pattern: /\b(line|bar|pie|area|radar)\s+chart\b/i, score: 5 },
    { type: 'chart', pattern: /(折线图|柱状图|饼图|趋势图|漏斗图)/i, score: 5 },
    { type: 'table', pattern: /\b(data\s+)?table\b/i, score: 5 },
    { type: 'table', pattern: /(数据表|表格|列表|明细表)/i, score: 5 },
    {
      type: 'button',
      pattern: /\b(click|tap|submit|save|confirm|cancel|export|download)\b/i,
      score: 4
    },
    { type: 'button', pattern: /(点击|提交|保存|确认|取消|导出|下载)/i, score: 4 },
    { type: 'card', pattern: /\b(kpi|summary|metric)\b/i, score: 4 },
    { type: 'card', pattern: /(指标卡|摘要卡|统计卡|卡片)/i, score: 4 }
  ];

const scoreByKeywords = (text: string, keywords: readonly string[]): number =>
  keywords.reduce((score, keyword) => {
    if (!keyword) return score;
    if (text.includes(keyword)) {
      return score + (keyword.includes(' ') ? 3 : 2);
    }
    return score;
  }, 0);

const inferComponent = (
  content: string,
  index: number,
  context: InferComponentContext
): UIComponent => {
  const text = content.toLowerCase();
  const section = context.sectionName.toLowerCase();
  const id = `component_${index}`;

  const scores: Record<ComponentType, number> = {
    chart: scoreByKeywords(text, COMPONENT_KEYWORDS.chart),
    table: scoreByKeywords(text, COMPONENT_KEYWORDS.table),
    button: scoreByKeywords(text, COMPONENT_KEYWORDS.button),
    card: scoreByKeywords(text, COMPONENT_KEYWORDS.card),
    text: 0
  };

  for (const rule of REGEX_RULES) {
    if (rule.pattern.test(content)) {
      scores[rule.type] += rule.score;
    }
  }

  // 上下文增强：章节名与节点类型共同影响组件判断。
  scores.chart += scoreByKeywords(section, COMPONENT_KEYWORDS.chart);
  scores.table += scoreByKeywords(section, COMPONENT_KEYWORDS.table);
  scores.button += scoreByKeywords(section, COMPONENT_KEYWORDS.button);
  scores.card += scoreByKeywords(section, COMPONENT_KEYWORDS.card);

  if (context.nodeType === 'list') {
    scores.button += 1;
    scores.card += 1;
  } else if (context.nodeType === 'narrative') {
    scores.chart += 1;
    scores.table += 1;
  }

  const bestMatch = (['chart', 'table', 'button', 'card'] as const).reduce(
    (best, current) => (scores[current] > scores[best] ? current : best),
    'chart'
  );

  if (scores[bestMatch] <= 0) {
    return {
      id,
      type: 'text',
      props: { content: content.trim() },
      style: {},
      children: []
    };
  }

  if (bestMatch === 'button') {
    return {
      id,
      type: 'button',
      props: { label: content.trim() },
      style: {},
      children: []
    };
  }

  if (bestMatch === 'card') {
    return { id, type: 'card', props: { title: content.trim() }, style: {}, children: [] };
  }

  return {
    id,
    type: bestMatch,
    props: { title: content.trim() },
    style: {},
    children: []
  };
};

const inferPosition = (name: string): Position => {
  const lower = name.toLowerCase();
  if (lower.includes('header') || lower.includes('top')) return 'top';
  if (lower.includes('sidebar') || lower.includes('left')) return 'left';
  if (lower.includes('right')) return 'right';
  if (lower.includes('footer') || lower.includes('bottom')) return 'bottom';
  return 'center';
};

const pushNarrativeToken = (
  tokens: MarkdownToken[],
  narrativeLines: string[],
  startLine: number
): void => {
  if (narrativeLines.length === 0) return;
  tokens.push({
    kind: 'narrative',
    text: narrativeLines.join(' ').trim(),
    line: startLine
  });
  narrativeLines.length = 0;
};

export const tokenizeMarkdown = (markdown: string): MarkdownToken[] => {
  const lines = markdown.split(/\r?\n/);
  const tokens: MarkdownToken[] = [];

  let inCodeBlock = false;
  let codeStartLine = 0;
  const codeLines: string[] = [];

  let narrativeStartLine = 0;
  const narrativeLines: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const rawLine = lines[index] ?? '';
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('```')) {
      pushNarrativeToken(tokens, narrativeLines, narrativeStartLine);

      if (!inCodeBlock) {
        inCodeBlock = true;
        codeStartLine = lineNumber;
        codeLines.length = 0;
      } else {
        inCodeBlock = false;
        tokens.push({
          kind: 'block',
          blockType: 'code',
          text: codeLines.join('\n'),
          startLine: codeStartLine,
          endLine: lineNumber
        });
      }

      continue;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      continue;
    }

    if (!trimmed) {
      pushNarrativeToken(tokens, narrativeLines, narrativeStartLine);
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      pushNarrativeToken(tokens, narrativeLines, narrativeStartLine);
      tokens.push({
        kind: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
        line: lineNumber
      });
      continue;
    }

    const listMatch = trimmed.match(/^([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      pushNarrativeToken(tokens, narrativeLines, narrativeStartLine);
      tokens.push({
        kind: 'list',
        marker: listMatch[1] as '-' | '*' | '+' | `${number}.`,
        text: listMatch[2].trim(),
        line: lineNumber
      });
      continue;
    }

    if (trimmed.startsWith('>')) {
      pushNarrativeToken(tokens, narrativeLines, narrativeStartLine);
      tokens.push({
        kind: 'block',
        blockType: 'quote',
        text: trimmed.replace(/^>\s?/, ''),
        startLine: lineNumber,
        endLine: lineNumber
      });
      continue;
    }

    if (narrativeLines.length === 0) {
      narrativeStartLine = lineNumber;
    }

    narrativeLines.push(trimmed);
  }

  pushNarrativeToken(tokens, narrativeLines, narrativeStartLine);

  if (inCodeBlock) {
    tokens.push({
      kind: 'block',
      blockType: 'code',
      text: codeLines.join('\n'),
      startLine: codeStartLine,
      endLine: lines.length
    });
  }

  return tokens;
};

export const buildDocumentAst = (tokens: MarkdownToken[]): DocumentAst => {
  const nodes: AstNode[] = [];

  for (const token of tokens) {
    if (token.kind === 'heading') {
      nodes.push({
        type: 'heading',
        level: token.level,
        text: token.text,
        line: token.line
      });
      continue;
    }

    if (token.kind === 'list') {
      const previous = nodes[nodes.length - 1];
      if (previous?.type === 'list' && previous.endLine + 1 >= token.line) {
        previous.items.push({ marker: token.marker, text: token.text, line: token.line });
        previous.endLine = token.line;
      } else {
        nodes.push({
          type: 'list',
          items: [{ marker: token.marker, text: token.text, line: token.line }],
          startLine: token.line,
          endLine: token.line
        });
      }
      continue;
    }

    if (token.kind === 'narrative') {
      nodes.push({
        type: 'narrative',
        text: token.text,
        startLine: token.line,
        endLine: token.line
      });
      continue;
    }

    nodes.push({
      type: 'block',
      blockType: token.blockType,
      text: token.text,
      startLine: token.startLine,
      endLine: token.endLine
    });
  }

  return { type: 'document', nodes };
};

export const parseSectionsFromAst = (document: DocumentAst): SectionAst[] => {
  const sections: SectionAst[] = [];
  let currentSection: SectionAst | null = null;

  const getOrCreateFallbackSection = (line: number): SectionAst => {
    if (currentSection) return currentSection;

    currentSection = {
      id: `section_${sections.length + 1}`,
      name: sections.length === 0 ? 'main' : `section_${sections.length + 1}`,
      headingLevel: 1,
      headingLine: line,
      position: 'center',
      nodes: []
    };
    sections.push(currentSection);
    return currentSection;
  };

  for (const node of document.nodes) {
    if (node.type === 'heading' && node.level <= 3) {
      currentSection = {
        id: `section_${sections.length + 1}`,
        name: toSnakeCase(node.text || `section_${sections.length + 1}`),
        headingLevel: node.level,
        headingLine: node.line,
        position: inferPosition(node.text),
        nodes: []
      };
      sections.push(currentSection);
      continue;
    }

    const target = getOrCreateFallbackSection(
      node.type === 'heading'
        ? node.line
        : node.type === 'narrative'
          ? node.startLine
          : node.startLine
    );
    target.nodes.push(node);
  }

  if (sections.length === 0) {
    sections.push({
      id: 'section_1',
      name: 'main',
      headingLevel: 1,
      headingLine: 1,
      position: 'center',
      nodes: []
    });
  }

  return sections;
};

export const parsePrdToAst = (markdown: string): ParsedPrdAst => {
  const tokens = tokenizeMarkdown(markdown);
  const document = buildDocumentAst(tokens);
  const sections = parseSectionsFromAst(document);

  return {
    document,
    sections
  };
};

const collectNodeTexts = (node: AstNode): string[] => {
  if (node.type === 'list') return node.items.map((item) => item.text);
  if (node.type === 'heading') return [node.text];
  return [node.text];
};

const collectNodeTextEntries = (node: AstNode): Array<{ text: string; line: number }> => {
  if (node.type === 'list') return node.items.map((item) => ({ text: item.text, line: item.line }));
  if (node.type === 'heading') return [{ text: node.text, line: node.line }];
  return [{ text: node.text, line: node.startLine }];
};

const EVENT_PATTERNS: Array<{ type: string; pattern: RegExp }> = [
  { type: 'click', pattern: /\b(click|tap|press)\b/i },
  { type: 'submit', pattern: /\b(submit|save|confirm)\b/i },
  { type: 'filter', pattern: /\b(filter|search|query)\b/i },
  { type: 'navigate', pattern: /\b(navigate|jump|redirect|go to|open)\b/i },
  { type: 'click', pattern: /(点击|点按|按下)/ },
  { type: 'submit', pattern: /(提交|保存|确认)/ },
  { type: 'filter', pattern: /(筛选|过滤|查询|搜索)/ },
  { type: 'navigate', pattern: /(跳转|进入|打开|前往)/ }
];

const CONDITION_PATTERNS: RegExp[] = [
  /\b(if|when|after|once|on)\b[^,.，。;；]*/i,
  /(如果|当|在.+后|满足.+时|选择.+后|点击.+后)[^,.，。;；]*/
];

const ACTION_PATTERNS: Array<{ action: string; pattern: RegExp }> = [
  { action: 'navigate', pattern: /\b(navigate|jump|redirect|go to|open)\b/i },
  { action: 'submit', pattern: /\b(submit|save|confirm)\b/i },
  { action: 'filter', pattern: /\b(filter|search|query)\b/i },
  { action: 'navigate', pattern: /(跳转|进入|打开|前往)/ },
  { action: 'submit', pattern: /(提交|保存|确认)/ },
  { action: 'filter', pattern: /(筛选|过滤|查询|搜索)/ }
];

const inferInteractionComponent = (
  components: UIComponent[],
  eventType: string
): UIComponent | undefined => {
  const button = components.find((component) => component.type === 'button');
  const table = components.find((component) => component.type === 'table');

  if (eventType === 'submit' || eventType === 'click') return button ?? components[0];
  if (eventType === 'filter') return table ?? button ?? components[0];
  return components[0];
};

const parseInteractionFromText = (
  text: string,
  sectionId: string,
  components: UIComponent[],
  interactionIndex: number
): ParsedInteraction | null => {
  const event = EVENT_PATTERNS.find((rule) => rule.pattern.test(text));
  const targetAction = ACTION_PATTERNS.find((rule) => rule.pattern.test(text));
  const condition = CONDITION_PATTERNS.map((pattern) => text.match(pattern)?.[0]?.trim()).find(
    Boolean
  );

  if (!event && !targetAction && !condition) return null;

  const normalizedEvent = event?.type ?? 'change';
  const normalizedAction =
    targetAction?.action ?? (normalizedEvent === 'navigate' ? 'navigate' : 'update');
  const component = inferInteractionComponent(components, normalizedEvent);

  return {
    id: `interaction_${interactionIndex}`,
    sectionId,
    event: normalizedEvent,
    triggerCondition: condition ?? 'always',
    targetAction: normalizedAction,
    componentId: component?.id,
    sourceText: text.trim()
  };
};

const inferInteractions = (
  parsed: ParsedPrdAst,
  sections: UISchema['sections']
): ParsedInteraction[] => {
  const interactions: ParsedInteraction[] = [];

  parsed.sections.forEach((section, sectionIndex) => {
    const schemaSection = sections[sectionIndex];
    const sectionId = schemaSection?.id ?? `section_${sectionIndex + 1}`;
    const components = schemaSection?.components ?? [];

    section.nodes.forEach((node) => {
      collectNodeTexts(node).forEach((text) => {
        const interaction = parseInteractionFromText(
          text,
          sectionId,
          components,
          interactions.length + 1
        );
        if (interaction) interactions.push(interaction);
      });
    });
  });

  return interactions;
};

export const inferSchemaIntent = (
  schema: Pick<UISchema, 'page_name' | 'sections' | 'interactions'>,
  config: IntentInferenceConfig = {}
): UISchemaIntent => {
  const rules = config.rules ?? DEFAULT_INTENT_INFERENCE_RULES;
  const corpus = [
    schema.page_name,
    ...schema.sections.map((section) => section.name),
    ...schema.sections.flatMap((section) =>
      section.components.flatMap((component) => [
        component.type,
        String(component.props.title ?? ''),
        String(component.props.content ?? '')
      ])
    ),
    ...schema.interactions.flatMap((interaction) =>
      [interaction.event, interaction.targetAction, interaction.sourceText]
        .map((value) => String(value ?? ''))
        .filter(Boolean)
    )
  ]
    .join(' ')
    .toLowerCase();

  const scores = new Map<UISchemaIntent, number>();
  for (const rule of rules) {
    let score = scores.get(rule.intent) ?? 0;
    const weight = rule.weight ?? 1;
    for (const keyword of rule.keywords) {
      if (corpus.includes(keyword.toLowerCase())) {
        score += weight;
      }
    }
    scores.set(rule.intent, score);
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const winner = ranked[0];

  if (!winner || winner[1] <= 0) {
    return config.fallbackIntent ?? 'dashboard';
  }

  return winner[0];
};

export const parsePrdToSchema = (
  markdown: string,
  options: ParsePrdToSchemaOptions = {}
): UISchema => {
  return astToSchema(parsePrdToAst(markdown), options).schema;
};

export const astToSchema = (
  parsed: ParsedPrdAst,
  options: ParsePrdToSchemaOptions = {}
): AstToSchemaResult => {
  let componentIndex = 0;
  const trace: SchemaTraceEntry[] = [];
  const pushTrace = (sourceLine: number, schemaPath: string, detail?: string): void => {
    if (sourceLine <= 0) return;
    trace.push({ sourceLine, schemaPath, detail });
  };

  const firstHeadingNode = parsed.document.nodes.find((node) => node.type === 'heading');

  const sections: UISchema['sections'] = parsed.sections.map((section, sectionIndex) => {
    const components: UIComponent[] = [];
    const sectionPath = `$.sections[${sectionIndex}]`;

    pushTrace(section.headingLine, `${sectionPath}.id`, section.id);
    pushTrace(section.headingLine, `${sectionPath}.name`, section.name);
    pushTrace(section.headingLine, `${sectionPath}.position`, section.position);

    for (const node of section.nodes) {
      const entries = collectNodeTextEntries(node);
      for (const entry of entries) {
        const text = entry.text;
        if (!text.trim()) continue;
        componentIndex += 1;
        const component = inferComponent(text, componentIndex, {
          sectionName: section.name,
          nodeType: node.type
        });
        const componentPath = `${sectionPath}.components[${components.length}]`;

        pushTrace(entry.line, `${componentPath}.id`, component.id);
        pushTrace(entry.line, `${componentPath}.type`, component.type);
        pushTrace(entry.line, `${componentPath}.props`, text.trim());
        components.push(component);
      }
    }

    return {
      id: `section_${sectionIndex + 1}`,
      name: section.name || `section_${sectionIndex + 1}`,
      position: section.position,
      components
    };
  });

  if (!sections.length) {
    sections.push({
      id: 'section_1',
      name: 'main',
      position: 'center',
      components: [
        {
          id: 'component_1',
          type: 'text',
          props: { content: 'empty_prd' },
          style: {},
          children: []
        }
      ]
    });
    pushTrace(1, '$.sections[0].id', 'section_1');
    pushTrace(1, '$.sections[0].components[0].id', 'component_1');
  }

  if (!sections.some((section) => section.components.length > 0)) {
    sections[0].components.push({
      id: 'component_1',
      type: 'text',
      props: { content: 'placeholder' },
      style: {},
      children: []
    });
    pushTrace(1, '$.sections[0].components[0].id', 'component_1');
  }

  const interactions = inferInteractions(parsed, sections);
  interactions.forEach((interaction, interactionIndex) => {
    const interactionPath = `$.interactions[${interactionIndex}]`;
    const sourceText = String(interaction.sourceText ?? '');
    const sourceLine =
      parsed.document.nodes.find((node) =>
        collectNodeTexts(node).some((text) => text.trim() === sourceText.trim())
      )?.type === 'heading'
        ? (
            parsed.document.nodes.find(
              (node) => node.type === 'heading' && node.text.trim() === sourceText.trim()
            ) as Extract<AstNode, { type: 'heading' }>
          ).line
        : ((
            parsed.document.nodes.find((node) =>
              collectNodeTexts(node).some((text) => text.trim() === sourceText.trim())
            ) as Exclude<AstNode, { type: 'heading' }> | undefined
          )?.startLine ?? 1);
    pushTrace(sourceLine, `${interactionPath}.id`, String(interaction.id ?? ''));
    pushTrace(sourceLine, `${interactionPath}.event`, String(interaction.event ?? ''));
    pushTrace(
      sourceLine,
      `${interactionPath}.targetAction`,
      String(interaction.targetAction ?? '')
    );
    pushTrace(sourceLine, `${interactionPath}.componentId`, String(interaction.componentId ?? ''));
  });

  const pageLine = firstHeadingNode?.line ?? 1;
  const pageName = toSnakeCase(firstHeadingNode?.text ?? 'generated_page') || 'generated_page';
  pushTrace(pageLine, '$.schemaVersion', String(CURRENT_UI_SCHEMA_VERSION));
  pushTrace(pageLine, '$.page_name', pageName);
  pushTrace(pageLine, '$.intent', 'inferred');
  pushTrace(pageLine, '$.layout.type', 'grid');
  pushTrace(pageLine, '$.layout.columns', '24');

  const schema: UISchema = {
    schemaVersion: CURRENT_UI_SCHEMA_VERSION,
    page_name: pageName,
    intent: inferSchemaIntent(
      {
        page_name: pageName,
        sections,
        interactions
      },
      options.intent
    ),
    layout: { type: 'grid', columns: 24 },
    sections,
    interactions
  };
  return { schema, trace };
};

if (process.argv[1]?.endsWith('index.ts')) {
  const repoRoot = process.env.INIT_CWD ?? process.cwd();
  const inputPath = path.resolve(repoRoot, 'input/prd.md');
  const outputPath = path.resolve(repoRoot, 'output/structure.json');
  const astOutputPath = path.resolve(repoRoot, 'output/ast.json');
  const traceOutputPath = path.resolve(repoRoot, 'output/trace.json');
  const markdown = fs.readFileSync(inputPath, 'utf8');
  const ast = parsePrdToAst(markdown);
  const { schema, trace } = astToSchema(ast);
  fs.writeFileSync(astOutputPath, `${JSON.stringify(ast, null, 2)}\n`);
  fs.writeFileSync(outputPath, `${JSON.stringify(schema, null, 2)}\n`);
  fs.writeFileSync(traceOutputPath, `${JSON.stringify(trace, null, 2)}\n`);
}
