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
