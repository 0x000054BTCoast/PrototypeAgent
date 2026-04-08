import fs from 'node:fs';
import path from 'node:path';
import { UISchema, UIComponent, Position, CURRENT_UI_SCHEMA_VERSION } from '@prd2prototype/schema';

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

type InferComponentContext = {
  sectionName: string;
  nodeType: AstNode['type'];
};

type ComponentType = UIComponent['type'];

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

export const parsePrdToSchema = (markdown: string): UISchema => {
  const parsed = parsePrdToAst(markdown);
  let componentIndex = 0;

  const sections: UISchema['sections'] = parsed.sections.map((section, sectionIndex) => {
    const components: UIComponent[] = [];

    for (const node of section.nodes) {
      const texts = collectNodeTexts(node);
      for (const text of texts) {
        if (!text.trim()) continue;
        componentIndex += 1;
        components.push(
          inferComponent(text, componentIndex, {
            sectionName: section.name,
            nodeType: node.type
          })
        );
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
  }

  if (!sections.some((section) => section.components.length > 0)) {
    sections[0].components.push({
      id: 'component_1',
      type: 'text',
      props: { content: 'placeholder' },
      style: {},
      children: []
    });
  }

  const firstHeadingNode = parsed.document.nodes.find((node) => node.type === 'heading');

  return {
    schemaVersion: CURRENT_UI_SCHEMA_VERSION,
    page_name: toSnakeCase(firstHeadingNode?.text ?? 'generated_page') || 'generated_page',
    layout: { type: 'grid', columns: 24 },
    sections,
    interactions: []
  };
};

if (process.argv[1]?.endsWith('index.ts')) {
  const repoRoot = process.env.INIT_CWD ?? process.cwd();
  const inputPath = path.resolve(repoRoot, 'input/prd.md');
  const outputPath = path.resolve(repoRoot, 'output/structure.json');
  const astOutputPath = path.resolve(repoRoot, 'output/ast.json');
  const markdown = fs.readFileSync(inputPath, 'utf8');
  const ast = parsePrdToAst(markdown);
  const schema = parsePrdToSchema(markdown);
  fs.writeFileSync(astOutputPath, `${JSON.stringify(ast, null, 2)}\n`);
  fs.writeFileSync(outputPath, `${JSON.stringify(schema, null, 2)}\n`);
}
