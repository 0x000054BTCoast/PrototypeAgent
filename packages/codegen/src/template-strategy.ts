import type { UISchema } from '@prd2prototype/schema';

export type EngineeringTemplate = 'dashboard' | 'crm' | 'landing' | 'admin';

export interface TemplateIntentRule {
  intent: EngineeringTemplate;
  keywords: string[];
  weight?: number;
}

export interface TemplateSelectionConfig {
  rules?: TemplateIntentRule[];
  fallbackTemplate?: EngineeringTemplate;
  intentToTemplate?: Partial<Record<string, EngineeringTemplate>>;
}

export const DEFAULT_TEMPLATE_INTENT_RULES: TemplateIntentRule[] = [
  {
    intent: 'dashboard',
    keywords: ['dashboard', 'analytics', 'kpi', 'metric', 'report', '看板', '分析', '指标', '报表'],
    weight: 3
  },
  {
    intent: 'crm',
    keywords: [
      'crm',
      'lead',
      'customer',
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

const collectIntentCorpus = (schema: UISchema): string[] => {
  const sectionNames = schema.sections.map((section) => section.name);
  const componentHints = schema.sections.flatMap((section) =>
    section.components.map(
      (component) => `${component.type} ${String(component.props.title ?? '')}`
    )
  );
  const interactions = schema.interactions.map((interaction) =>
    [interaction.event, interaction.targetAction, interaction.sourceText].filter(Boolean).join(' ')
  );

  return [
    String(schema.page_name ?? ''),
    String(schema.intent ?? ''),
    ...sectionNames,
    ...componentHints,
    ...interactions
  ]
    .join(' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
};

export const inferSchemaIntent = (
  schema: UISchema,
  config: TemplateSelectionConfig = {}
): EngineeringTemplate => {
  const explicitIntent =
    typeof schema.intent === 'string' ? schema.intent.toLowerCase().trim() : '';
  const intentToTemplate = {
    dashboard: 'dashboard',
    crm: 'crm',
    landing: 'landing',
    admin: 'admin',
    ...config.intentToTemplate
  } satisfies Record<string, EngineeringTemplate>;

  if (explicitIntent && explicitIntent in intentToTemplate) {
    return intentToTemplate[explicitIntent];
  }

  const corpus = collectIntentCorpus(schema);
  const rules = config.rules ?? DEFAULT_TEMPLATE_INTENT_RULES;
  const scores = new Map<EngineeringTemplate, number>();

  for (const rule of rules) {
    const weight = rule.weight ?? 1;
    let score = scores.get(rule.intent) ?? 0;
    for (const keyword of rule.keywords) {
      if (corpus.some((token) => token.includes(keyword.toLowerCase()))) {
        score += weight;
      }
    }
    scores.set(rule.intent, score);
  }

  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const best = sorted[0];

  if (!best || best[1] <= 0) {
    return config.fallbackTemplate ?? 'dashboard';
  }

  return best[0];
};
