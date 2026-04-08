import { UISchema, UIComponent } from '@prd2prototype/schema';

export interface RequirementPriority {
  minimalism: number;
  density: number;
}

export interface PatchEngineOptions {
  priorities?: Partial<RequirementPriority>;
}

const DEFAULT_PRIORITIES: RequirementPriority = {
  minimalism: 2,
  density: 1
};

type DecisionLog = {
  type: 'decision_log';
  category: 'requirement_conflict' | 'normalization';
  summary: string;
  details: Record<string, unknown>;
};

const mergePriorities = (priorities?: Partial<RequirementPriority>): RequirementPriority => ({
  ...DEFAULT_PRIORITIES,
  ...priorities
});

const appendDecisionLog = (schema: UISchema, decision: DecisionLog): void => {
  schema.interactions.push(decision);
};

const toSnakeCase = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const applyPatchInstruction = (
  schema: UISchema,
  instruction: string,
  options: PatchEngineOptions = {}
): UISchema => {
  const next = JSON.parse(JSON.stringify(schema)) as UISchema;
  const normalized = instruction.toLowerCase();
  const priorities = mergePriorities(options.priorities);

  const mentionsMinimalism =
    normalized.includes('minimal') || normalized.includes('简约') || normalized.includes('极简');
  const mentionsHighDensity =
    normalized.includes('high density') ||
    normalized.includes('dense') ||
    normalized.includes('高密度');

  if (mentionsMinimalism && mentionsHighDensity) {
    const selectedMode =
      priorities.minimalism >= priorities.density ? 'minimalism' : 'high_density';
    appendDecisionLog(next, {
      type: 'decision_log',
      category: 'requirement_conflict',
      summary: 'Detected conflicting style requirements; applied configurable priority.',
      details: {
        conflict: ['minimalism', 'high_density'],
        priorities,
        selected: selectedMode,
        instruction
      }
    });
  }

  if (normalized.includes('columns') || normalized.includes('layout')) {
    const columnsMatch = normalized.match(/(\d{1,2})\s*columns?/);
    if (columnsMatch) {
      const requestedColumns = Number(columnsMatch[1]);
      next.layout.columns = 24;
      appendDecisionLog(next, {
        type: 'decision_log',
        category: 'normalization',
        summary: 'Layout columns were normalized to schema constraint.',
        details: {
          requested_columns: requestedColumns,
          applied_columns: 24,
          reason: 'UISchema layout currently supports 24 columns only.'
        }
      });
    }
  }

  if (normalized.includes('add section')) {
    const nameMatch = instruction.match(/add section\s+([a-z0-9 _-]+)/i);
    const nameRaw = nameMatch?.[1]?.trim() ?? `section_${next.sections.length + 1}`;
    next.sections.push({
      id: `section_${next.sections.length + 1}`,
      name: toSnakeCase(nameRaw),
      position: 'center',
      components: []
    });
  }

  if (normalized.includes('add') && normalized.includes('button')) {
    if (next.sections.length === 0) {
      next.sections.push({
        id: 'section_1',
        name: 'section_1',
        position: 'center',
        components: []
      });
    }
    const section = next.sections[0];
    const button: UIComponent = {
      id: `component_${section.components.length + 1}`,
      type: 'button',
      props: { label: 'New Action' },
      style: {},
      children: []
    };
    section.components.push(button);
  }

  if (normalized.includes('remove') && normalized.includes('component')) {
    const target = normalized.match(/component[_\s-]?(\d+)/)?.[1];
    if (target) {
      for (const section of next.sections) {
        const before = section.components.length;
        section.components = section.components.filter(
          (component) => component.id !== `component_${target}`
        );
        if (section.components.length !== before) break;
      }
    }
  }

  if (normalized.includes('style') || normalized.includes('color')) {
    const colorMatch = instruction.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
    if (colorMatch && next.sections[0]?.components[0]) {
      next.sections[0].components[0].style = {
        ...next.sections[0].components[0].style,
        color: colorMatch[0]
      };
    }
  }

  if (normalized.includes('interaction')) {
    next.interactions.push({ type: 'interaction_update', detail: instruction });
  }

  return next;
};
