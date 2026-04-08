import fs from 'node:fs';
import path from 'node:path';
import { UISchema, UIComponent, Position, CURRENT_UI_SCHEMA_VERSION } from '@prd2prototype/schema';

const toSnakeCase = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const inferComponent = (line: string, index: number): UIComponent => {
  const text = line.toLowerCase();
  const id = `component_${index + 1}`;

  if (text.includes('chart'))
    return { id, type: 'chart', props: { title: line.trim() }, style: {}, children: [] };
  if (text.includes('table'))
    return { id, type: 'table', props: { title: line.trim() }, style: {}, children: [] };
  if (text.includes('button'))
    return {
      id,
      type: 'button',
      props: { label: line.replace(/[-*]/g, '').trim() },
      style: {},
      children: []
    };
  if (text.includes('card'))
    return { id, type: 'card', props: { title: line.trim() }, style: {}, children: [] };
  return {
    id,
    type: 'text',
    props: { content: line.replace(/[-*]/g, '').trim() },
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

export const parsePrdToSchema = (markdown: string): UISchema => {
  const lines = markdown.split(/\r?\n/);
  const sections: UISchema['sections'] = [];
  let currentSection: UISchema['sections'][number] | null = null;
  let componentIndex = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('##') || line.startsWith('###')) {
      const sectionName = line.replace(/^#+/, '').trim();
      currentSection = {
        id: `section_${sections.length + 1}`,
        name: toSnakeCase(sectionName || `section_${sections.length + 1}`),
        position: inferPosition(sectionName),
        components: []
      };
      sections.push(currentSection);
      continue;
    }

    if (line.startsWith('#')) {
      const heading = line.replace(/^#+/, '').trim();
      if (!currentSection) {
        currentSection = {
          id: 'section_1',
          name: toSnakeCase(heading || 'main'),
          position: inferPosition(heading),
          components: []
        };
        sections.push(currentSection);
      }
      continue;
    }

    if (!currentSection) {
      currentSection = { id: 'section_1', name: 'main', position: 'center', components: [] };
      sections.push(currentSection);
    }

    componentIndex += 1;
    currentSection.components.push(inferComponent(line, componentIndex));
  }

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

  const firstHeading = lines.find((line) => line.trim().startsWith('#')) ?? 'Generated Page';

  return {
    schemaVersion: CURRENT_UI_SCHEMA_VERSION,
    page_name: toSnakeCase(firstHeading.replace(/^#+/, '')) || 'generated_page',
    layout: { type: 'grid', columns: 24 },
    sections,
    interactions: []
  };
};

if (process.argv[1]?.endsWith('index.ts')) {
  const repoRoot = process.env.INIT_CWD ?? process.cwd();
  const inputPath = path.resolve(repoRoot, 'input/prd.md');
  const outputPath = path.resolve(repoRoot, 'output/structure.json');
  const markdown = fs.readFileSync(inputPath, 'utf8');
  const schema = parsePrdToSchema(markdown);
  fs.writeFileSync(outputPath, `${JSON.stringify(schema, null, 2)}\n`);
}
