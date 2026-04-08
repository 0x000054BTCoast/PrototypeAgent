export type Position = 'top' | 'left' | 'center' | 'right' | 'bottom';

export interface UIComponent {
  id: string;
  type:
    | 'chart'
    | 'table'
    | 'button'
    | 'card'
    | 'badge'
    | 'alert'
    | 'input'
    | 'textarea'
    | 'select'
    | 'tabs'
    | 'text';
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
  layout: {
    type: 'grid';
    columns: 24;
  };
  sections: UISection[];
  interactions: Array<Record<string, unknown>>;
}
