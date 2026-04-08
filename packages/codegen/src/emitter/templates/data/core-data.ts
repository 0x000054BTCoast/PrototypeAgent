export const typesTemplate = `export type Position = "top" | "left" | "center" | "right" | "bottom";

export interface UIComponent {
  id: string;
  type: "chart" | "table" | "button" | "card" | "text";
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
  intent?: "dashboard" | "crm" | "landing" | "admin";
  template?: "dashboard" | "crm" | "landing" | "admin";
  layout: {
    type: "grid";
    columns: 24;
  };
  sections: UISection[];
  interactions: Array<Record<string, unknown>>;
}
`;

export const mockDataTemplate = `export const mockRows = [
  { metric: "Monthly Active Users", value: "42,130", trend: "+8.2%" },
  { metric: "Conversion Rate", value: "4.7%", trend: "+0.4%" },
  { metric: "Churn", value: "2.1%", trend: "-0.3%" }
];
`;
