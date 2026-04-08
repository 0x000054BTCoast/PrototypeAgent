import { z } from 'zod';

export type Position = 'top' | 'left' | 'center' | 'right' | 'bottom';

export interface UIComponent {
  id: string;
  type: 'chart' | 'table' | 'button' | 'card' | 'text';
  props: Record<string, unknown>;
  style: Record<string, unknown>;
  children: UIComponent[];
}

export interface UISection {
  id: string;
  name: string;
  position: Position;
  components: UIComponent[];
}

export interface UISchema {
  page_name: string;
  layout: {
    type: 'grid';
    columns: 24;
  };
  sections: UISection[];
  interactions: Array<Record<string, unknown>>;
}

/**
 * AppSchemaV2: 面向「路由 + 视图 + 组件 + 数据 + 动作 + 设计约束」的统一应用描述。
 *
 * 设计目标：
 * - 类型安全：所有核心结构均可静态检查。
 * - 可扩展：通过 `meta` / `paramsSchema` / `bindings` 预留扩展点。
 * - 可生成：可直接用于代码生成、预览器、设计评审和自动化测试。
 */
export interface AppSchemaV2 {
  /**
   * 路由定义。
   * @example
   * [{
   *   id: "route_dashboard",
   *   path: "/dashboard",
   *   name: "dashboard",
   *   view: "view_dashboard",
   *   guards: [{ kind: "auth", rule: "must_login" }]
   * }]
   */
  routes: AppRouteV2[];

  /**
   * 视图定义（页面级容器）。
   * @example
   * [{
   *   id: "view_dashboard",
   *   title: "运营看板",
   *   layout: { type: "grid", columns: 24, gap: 16 },
   *   rootComponentIds: ["cmp_header", "cmp_kpi_group"]
   * }]
   */
  views: AppViewV2[];

  /**
   * 组件定义（可复用节点图）。
   * @example
   * [{
   *   id: "cmp_kpi_group",
   *   type: "container",
   *   props: { direction: "horizontal" },
   *   children: ["cmp_kpi_1", "cmp_kpi_2"],
   *   bindings: [{ prop: "value", from: "data.kpi.active_users" }]
   * }]
   */
  components: AppComponentV2[];

  /**
   * 数据定义（实体、查询、状态）。
   * @example
   * {
   *   entities: [{ id: "user", shape: { id: "string", name: "string" } }],
   *   queries: [{ id: "q_users", source: "rest", endpoint: "/api/users", method: "GET" }],
   *   states: [{ id: "selectedUserId", type: "string", initial: "" }]
   * }
   */
  data: AppDataV2;

  /**
   * 动作定义（交互触发、副作用、导航）。
   * @example
   * [{
   *   id: "act_open_detail",
   *   trigger: { type: "click", componentId: "cmp_user_row" },
   *   effects: [{ type: "navigate", to: "/users/:id" }]
   * }]
   */
  actions: AppActionV2[];

  /**
   * 设计系统约束（主题、间距、排版等）。
   * @example
   * {
   *   theme: "light",
   *   tokens: { colorPrimary: "#2563eb", radiusMd: 8, spacingUnit: 4 },
   *   breakpoints: { sm: 640, md: 768, lg: 1024 }
   * }
   */
  design: AppDesignV2;

  /**
   * 全局约束（命名、可访问性、性能预算等）。
   * @example
   * [{
   *   kind: "a11y",
   *   rule: "interactive_requires_label",
   *   level: "error"
   * }]
   */
  constraints: AppConstraintV2[];
}

export interface AppRouteV2 {
  id: string;
  path: string;
  name: string;
  view: string;
  guards?: Array<{
    kind: 'auth' | 'role' | 'feature_flag';
    rule: string;
  }>;
  meta?: Record<string, unknown>;
}

export interface AppViewV2 {
  id: string;
  title: string;
  layout: {
    type: 'grid' | 'stack' | 'free';
    columns?: number;
    gap?: number;
  };
  rootComponentIds: string[];
  paramsSchema?: Record<string, string>;
  meta?: Record<string, unknown>;
}

export interface AppComponentV2 {
  id: string;
  type: 'container' | 'text' | 'button' | 'table' | 'chart' | 'form' | 'input';
  props: Record<string, unknown>;
  style?: Record<string, unknown>;
  children?: string[];
  bindings?: Array<{
    prop: string;
    from: string;
    transform?: string;
  }>;
  meta?: Record<string, unknown>;
}

export interface AppDataV2 {
  entities: AppEntityV2[];
  queries: AppQueryV2[];
  states: AppStateV2[];
}

export interface AppEntityV2 {
  id: string;
  shape: Record<string, string>;
  constraints?: string[];
}

export interface AppQueryV2 {
  id: string;
  source: 'rest' | 'graphql' | 'local';
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  dependsOn?: string[];
}

export interface AppStateV2 {
  id: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  initial: unknown;
}

export interface AppActionV2 {
  id: string;
  trigger: {
    type: 'click' | 'submit' | 'load' | 'change';
    componentId?: string;
  };
  conditions?: string[];
  effects: AppActionEffectV2[];
}

export type AppActionEffectV2 =
  | { type: 'set_state'; target: string; value: unknown }
  | { type: 'run_query'; queryId: string }
  | { type: 'navigate'; to: string }
  | { type: 'emit'; event: string; payload?: Record<string, unknown> };

export interface AppDesignV2 {
  theme: 'light' | 'dark' | 'system';
  tokens: Record<string, string | number>;
  breakpoints: Record<string, number>;
}

export interface AppConstraintV2 {
  kind: 'naming' | 'a11y' | 'performance' | 'security' | 'custom';
  rule: string;
  level: 'warn' | 'error';
  message?: string;
}

/**
 * AppSchemaV2 的 JSON Schema（Draft 2020-12）。
 * 可用于 AJV 等校验器，也可用于文档/契约同步。
 */
export const appSchemaV2JsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://prd2prototype.dev/schema/app-schema-v2.json',
  title: 'AppSchemaV2',
  type: 'object',
  additionalProperties: false,
  required: ['routes', 'views', 'components', 'data', 'actions', 'design', 'constraints'],
  properties: {
    routes: { type: 'array', items: { $ref: '#/$defs/AppRouteV2' } },
    views: { type: 'array', items: { $ref: '#/$defs/AppViewV2' } },
    components: { type: 'array', items: { $ref: '#/$defs/AppComponentV2' } },
    data: { $ref: '#/$defs/AppDataV2' },
    actions: { type: 'array', items: { $ref: '#/$defs/AppActionV2' } },
    design: { $ref: '#/$defs/AppDesignV2' },
    constraints: { type: 'array', items: { $ref: '#/$defs/AppConstraintV2' } }
  },
  $defs: {
    AppRouteV2: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'path', 'name', 'view'],
      properties: {
        id: { type: 'string', minLength: 1 },
        path: { type: 'string', minLength: 1 },
        name: { type: 'string', minLength: 1 },
        view: { type: 'string', minLength: 1 },
        guards: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['kind', 'rule'],
            properties: {
              kind: { enum: ['auth', 'role', 'feature_flag'] },
              rule: { type: 'string', minLength: 1 }
            }
          }
        },
        meta: { type: 'object', additionalProperties: true }
      }
    },
    AppViewV2: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'title', 'layout', 'rootComponentIds'],
      properties: {
        id: { type: 'string', minLength: 1 },
        title: { type: 'string', minLength: 1 },
        layout: {
          type: 'object',
          additionalProperties: false,
          required: ['type'],
          properties: {
            type: { enum: ['grid', 'stack', 'free'] },
            columns: { type: 'number' },
            gap: { type: 'number' }
          }
        },
        rootComponentIds: { type: 'array', items: { type: 'string', minLength: 1 } },
        paramsSchema: { type: 'object', additionalProperties: { type: 'string' } },
        meta: { type: 'object', additionalProperties: true }
      }
    },
    AppComponentV2: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type', 'props'],
      properties: {
        id: { type: 'string', minLength: 1 },
        type: { enum: ['container', 'text', 'button', 'table', 'chart', 'form', 'input'] },
        props: { type: 'object', additionalProperties: true },
        style: { type: 'object', additionalProperties: true },
        children: { type: 'array', items: { type: 'string', minLength: 1 } },
        bindings: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['prop', 'from'],
            properties: {
              prop: { type: 'string', minLength: 1 },
              from: { type: 'string', minLength: 1 },
              transform: { type: 'string' }
            }
          }
        },
        meta: { type: 'object', additionalProperties: true }
      }
    },
    AppDataV2: {
      type: 'object',
      additionalProperties: false,
      required: ['entities', 'queries', 'states'],
      properties: {
        entities: { type: 'array', items: { $ref: '#/$defs/AppEntityV2' } },
        queries: { type: 'array', items: { $ref: '#/$defs/AppQueryV2' } },
        states: { type: 'array', items: { $ref: '#/$defs/AppStateV2' } }
      }
    },
    AppEntityV2: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'shape'],
      properties: {
        id: { type: 'string', minLength: 1 },
        shape: { type: 'object', additionalProperties: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } }
      }
    },
    AppQueryV2: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'source'],
      properties: {
        id: { type: 'string', minLength: 1 },
        source: { enum: ['rest', 'graphql', 'local'] },
        endpoint: { type: 'string' },
        method: { enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
        dependsOn: { type: 'array', items: { type: 'string' } }
      }
    },
    AppStateV2: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type', 'initial'],
      properties: {
        id: { type: 'string', minLength: 1 },
        type: { enum: ['string', 'number', 'boolean', 'array', 'object'] },
        initial: true
      }
    },
    AppActionV2: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'trigger', 'effects'],
      properties: {
        id: { type: 'string', minLength: 1 },
        trigger: {
          type: 'object',
          additionalProperties: false,
          required: ['type'],
          properties: {
            type: { enum: ['click', 'submit', 'load', 'change'] },
            componentId: { type: 'string' }
          }
        },
        conditions: { type: 'array', items: { type: 'string' } },
        effects: {
          type: 'array',
          items: { $ref: '#/$defs/AppActionEffectV2' }
        }
      }
    },
    AppActionEffectV2: {
      oneOf: [
        {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'target', 'value'],
          properties: {
            type: { const: 'set_state' },
            target: { type: 'string', minLength: 1 },
            value: true
          }
        },
        {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'queryId'],
          properties: {
            type: { const: 'run_query' },
            queryId: { type: 'string', minLength: 1 }
          }
        },
        {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'to'],
          properties: {
            type: { const: 'navigate' },
            to: { type: 'string', minLength: 1 }
          }
        },
        {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'event'],
          properties: {
            type: { const: 'emit' },
            event: { type: 'string', minLength: 1 },
            payload: { type: 'object', additionalProperties: true }
          }
        }
      ]
    },
    AppDesignV2: {
      type: 'object',
      additionalProperties: false,
      required: ['theme', 'tokens', 'breakpoints'],
      properties: {
        theme: { enum: ['light', 'dark', 'system'] },
        tokens: {
          type: 'object',
          additionalProperties: { anyOf: [{ type: 'string' }, { type: 'number' }] }
        },
        breakpoints: {
          type: 'object',
          additionalProperties: { type: 'number' }
        }
      }
    },
    AppConstraintV2: {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'rule', 'level'],
      properties: {
        kind: { enum: ['naming', 'a11y', 'performance', 'security', 'custom'] },
        rule: { type: 'string', minLength: 1 },
        level: { enum: ['warn', 'error'] },
        message: { type: 'string' }
      }
    }
  }
} as const;

const appActionEffectV2Schema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('set_state'),
    target: z.string().min(1),
    value: z.unknown()
  }),
  z.object({
    type: z.literal('run_query'),
    queryId: z.string().min(1)
  }),
  z.object({
    type: z.literal('navigate'),
    to: z.string().min(1)
  }),
  z.object({
    type: z.literal('emit'),
    event: z.string().min(1),
    payload: z.record(z.string(), z.unknown()).optional()
  })
]);

export const appSchemaV2Validator = z
  .object({
    routes: z.array(
      z.object({
        id: z.string().min(1),
        path: z.string().min(1),
        name: z.string().min(1),
        view: z.string().min(1),
        guards: z
          .array(
            z.object({
              kind: z.enum(['auth', 'role', 'feature_flag']),
              rule: z.string().min(1)
            })
          )
          .optional(),
        meta: z.record(z.string(), z.unknown()).optional()
      })
    ),
    views: z.array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        layout: z.object({
          type: z.enum(['grid', 'stack', 'free']),
          columns: z.number().optional(),
          gap: z.number().optional()
        }),
        rootComponentIds: z.array(z.string().min(1)),
        paramsSchema: z.record(z.string(), z.string()).optional(),
        meta: z.record(z.string(), z.unknown()).optional()
      })
    ),
    components: z.array(
      z.object({
        id: z.string().min(1),
        type: z.enum(['container', 'text', 'button', 'table', 'chart', 'form', 'input']),
        props: z.record(z.string(), z.unknown()),
        style: z.record(z.string(), z.unknown()).optional(),
        children: z.array(z.string().min(1)).optional(),
        bindings: z
          .array(
            z.object({
              prop: z.string().min(1),
              from: z.string().min(1),
              transform: z.string().optional()
            })
          )
          .optional(),
        meta: z.record(z.string(), z.unknown()).optional()
      })
    ),
    data: z.object({
      entities: z.array(
        z.object({
          id: z.string().min(1),
          shape: z.record(z.string(), z.string()),
          constraints: z.array(z.string()).optional()
        })
      ),
      queries: z.array(
        z.object({
          id: z.string().min(1),
          source: z.enum(['rest', 'graphql', 'local']),
          endpoint: z.string().optional(),
          method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
          dependsOn: z.array(z.string()).optional()
        })
      ),
      states: z.array(
        z.object({
          id: z.string().min(1),
          type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
          initial: z.unknown()
        })
      )
    }),
    actions: z.array(
      z.object({
        id: z.string().min(1),
        trigger: z.object({
          type: z.enum(['click', 'submit', 'load', 'change']),
          componentId: z.string().optional()
        }),
        conditions: z.array(z.string()).optional(),
        effects: z.array(appActionEffectV2Schema)
      })
    ),
    design: z.object({
      theme: z.enum(['light', 'dark', 'system']),
      tokens: z.record(z.string(), z.union([z.string(), z.number()])),
      breakpoints: z.record(z.string(), z.number())
    }),
    constraints: z.array(
      z.object({
        kind: z.enum(['naming', 'a11y', 'performance', 'security', 'custom']),
        rule: z.string().min(1),
        level: z.enum(['warn', 'error']),
        message: z.string().optional()
      })
    )
  })
  .strict();

export interface AppSchemaValidationIssue {
  path: string;
  message: string;
}

export interface AppSchemaValidationError {
  summary: string;
  issues: AppSchemaValidationIssue[];
}

export interface AppSchemaMigrationIssue {
  level: 'info' | 'warn';
  code: string;
  message: string;
  legacyPath?: string;
  targetPath?: string;
}

export interface UISchemaCompatibilityReport {
  sourceVersion: 'UISchema@v1';
  targetVersion: 'AppSchemaV2';
  migratedAt: string;
  summary: {
    sections: number;
    legacyComponents: number;
    migratedComponents: number;
    interactions: number;
    compatibilityScore: number;
  };
  issues: AppSchemaMigrationIssue[];
}

function formatIssuePath(path: Array<string | number>): string {
  if (path.length === 0) {
    return '$';
  }

  return path.reduce((acc, current) => {
    if (typeof current === 'number') {
      return `${acc}[${current}]`;
    }
    return acc === '$' ? `$.${current}` : `${acc}.${current}`;
  }, '$');
}

function normalizeIssueMessage(issue: z.ZodIssue): string {
  if (issue.code === 'invalid_type') {
    return `类型错误：期望 ${issue.expected}，实际 ${issue.received}`;
  }
  if (issue.code === 'invalid_enum_value') {
    return `枚举值非法：可选值为 ${issue.options.join(', ')}`;
  }
  if (issue.code === 'unrecognized_keys') {
    return `存在未定义字段：${issue.keys.join(', ')}`;
  }
  return issue.message;
}

export function validateAppSchemaV2(
  input: unknown
): { success: true; data: AppSchemaV2 } | { success: false; error: AppSchemaValidationError } {
  const parsed = appSchemaV2Validator.safeParse(input);
  if (parsed.success) {
    return { success: true, data: parsed.data as AppSchemaV2 };
  }

  const issues = parsed.error.issues.map((issue) => ({
    path: formatIssuePath(issue.path),
    message: normalizeIssueMessage(issue)
  }));

  return {
    success: false,
    error: {
      summary: `AppSchemaV2 校验失败，共 ${issues.length} 处错误`,
      issues
    }
  };
}

export function assertValidAppSchemaV2(input: unknown): AppSchemaV2 {
  const result = validateAppSchemaV2(input);
  if (result.success) {
    return result.data;
  }

  const detail = result.error.issues.map((item) => `- ${item.path}: ${item.message}`).join('\n');
  throw new Error(`${result.error.summary}\n${detail}`);
}

const toRoutePath = (pageName: string): string => {
  const normalized = pageName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized ? `/${normalized}` : '/';
};

const toViewTitle = (pageName: string): string =>
  pageName
    .split('_')
    .map((part) => (part ? `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}` : ''))
    .join(' ')
    .trim() || 'Generated View';

const mapComponentType = (type: UIComponent['type']): AppComponentV2['type'] => {
  if (type === 'card') {
    return 'container';
  }
  return type;
};

const estimateCompatibilityScore = (schema: UISchema, migratedComponentCount: number): number => {
  const legacyComponentCount = schema.sections.reduce(
    (sum, section) => sum + section.components.length,
    0
  );
  const missing = Math.max(legacyComponentCount - migratedComponentCount, 0);
  const interactionPenalty = schema.interactions.length > 0 ? 5 : 0;
  const base = 100 - missing * 10 - interactionPenalty;
  return Math.max(0, Math.min(100, base));
};

export function migrateUISchemaToAppSchemaV2(schema: UISchema): {
  appSchema: AppSchemaV2;
  compatibilityReport: UISchemaCompatibilityReport;
} {
  const issues: AppSchemaMigrationIssue[] = [];
  const components: AppComponentV2[] = [];
  const rootComponentIds: string[] = [];

  for (const section of schema.sections) {
    const sectionContainerId = `${section.id}_container`;
    const sectionChildIds: string[] = [];

    for (const component of section.components) {
      sectionChildIds.push(component.id);
      components.push({
        id: component.id,
        type: mapComponentType(component.type),
        props: component.props,
        style: component.style,
        children: component.children.map((child) => child.id),
        meta: {
          legacyType: component.type,
          migratedFrom: 'UISchema.component'
        }
      });

      if (component.type === 'card') {
        issues.push({
          level: 'info',
          code: 'component_type_mapped',
          message: `组件 ${component.id} 从 card 映射为 container`,
          legacyPath: `$.sections[${schema.sections.indexOf(section)}].components[${section.components.indexOf(component)}].type`,
          targetPath: `$.components[${components.length - 1}].type`
        });
      }
    }

    components.push({
      id: sectionContainerId,
      type: 'container',
      props: {
        name: section.name,
        position: section.position
      },
      children: sectionChildIds,
      meta: {
        migratedFrom: 'UISchema.section'
      }
    });
    rootComponentIds.push(sectionContainerId);
  }

  if (schema.interactions.length > 0) {
    issues.push({
      level: 'warn',
      code: 'interaction_degraded',
      message: 'UISchema interactions 无结构化定义，已按 emit 动作保留原始 payload',
      legacyPath: '$.interactions',
      targetPath: '$.actions'
    });
  }

  const appSchema: AppSchemaV2 = {
    routes: [
      {
        id: `route_${schema.page_name || 'main'}`,
        path: toRoutePath(schema.page_name),
        name: schema.page_name || 'main',
        view: `view_${schema.page_name || 'main'}`
      }
    ],
    views: [
      {
        id: `view_${schema.page_name || 'main'}`,
        title: toViewTitle(schema.page_name),
        layout: {
          type: schema.layout.type,
          columns: schema.layout.columns,
          gap: 16
        },
        rootComponentIds
      }
    ],
    components,
    data: {
      entities: [],
      queries: [],
      states: []
    },
    actions: schema.interactions.map((interaction, index) => ({
      id: `act_legacy_${index + 1}`,
      trigger: {
        type: 'click'
      },
      effects: [
        {
          type: 'emit',
          event: 'legacy.interaction',
          payload: { raw: interaction }
        }
      ]
    })),
    design: {
      theme: 'light',
      tokens: {
        spacingUnit: 4,
        radiusMd: 8
      },
      breakpoints: {
        sm: 640,
        md: 768,
        lg: 1024
      }
    },
    constraints: [
      {
        kind: 'naming',
        rule: 'component_id_should_be_stable',
        level: 'warn',
        message: 'legacy schema migrated; 建议后续按业务语义重命名组件 id'
      }
    ]
  };

  const compatibilityReport: UISchemaCompatibilityReport = {
    sourceVersion: 'UISchema@v1',
    targetVersion: 'AppSchemaV2',
    migratedAt: new Date().toISOString(),
    summary: {
      sections: schema.sections.length,
      legacyComponents: schema.sections.reduce(
        (sum, section) => sum + section.components.length,
        0
      ),
      migratedComponents: components.length,
      interactions: schema.interactions.length,
      compatibilityScore: estimateCompatibilityScore(schema, components.length)
    },
    issues
  };

  return {
    appSchema,
    compatibilityReport
  };
}
