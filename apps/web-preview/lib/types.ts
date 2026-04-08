export type Position = 'top' | 'left' | 'center' | 'right' | 'bottom';

export interface UIComponent {
  id: string;
  type:
    | 'chart'
    | 'table'
    | 'button'
    | 'card'
    | 'text'
    | 'badge'
    | 'alert'
    | 'input'
    | 'textarea'
    | 'select'
    | 'tabs';
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
  schemaVersion: number;
  page_name: string;
  intent?: 'dashboard' | 'crm' | 'landing' | 'admin';
  template?: 'dashboard' | 'crm' | 'landing' | 'admin';
  layout: {
    type: 'grid';
    columns: 24;
  };
  sections: UISection[];
  interactions: Array<Record<string, unknown>>;
}
