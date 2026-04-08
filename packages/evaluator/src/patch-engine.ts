import { UISchema, UIComponent } from "@prd2prototype/schema";

const toSnakeCase = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export const applyPatchInstruction = (schema: UISchema, instruction: string): UISchema => {
  const next = JSON.parse(JSON.stringify(schema)) as UISchema;
  const normalized = instruction.toLowerCase();

  if (normalized.includes("columns") || normalized.includes("layout")) {
    const columnsMatch = normalized.match(/(\d{1,2})\s*columns?/);
    if (columnsMatch) {
      next.layout.columns = 24;
      next.interactions.push({ type: "layout_change", detail: `requested_columns_${columnsMatch[1]}_normalized_to_24` });
    }
  }

  if (normalized.includes("add section")) {
    const nameMatch = instruction.match(/add section\s+([a-z0-9 _-]+)/i);
    const nameRaw = nameMatch?.[1]?.trim() ?? `section_${next.sections.length + 1}`;
    next.sections.push({
      id: `section_${next.sections.length + 1}`,
      name: toSnakeCase(nameRaw),
      position: "center",
      components: []
    });
  }

  if (normalized.includes("add") && normalized.includes("button")) {
    const section = next.sections[0];
    const button: UIComponent = {
      id: `component_${section.components.length + 1}`,
      type: "button",
      props: { label: "New Action" },
      style: {},
      children: []
    };
    section.components.push(button);
  }

  if (normalized.includes("remove") && normalized.includes("component")) {
    const target = normalized.match(/component[_\s-]?(\d+)/)?.[1];
    if (target) {
      for (const section of next.sections) {
        const before = section.components.length;
        section.components = section.components.filter((component) => component.id !== `component_${target}`);
        if (section.components.length !== before) break;
      }
    }
  }

  if (normalized.includes("style") || normalized.includes("color")) {
    const colorMatch = instruction.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
    if (colorMatch && next.sections[0]?.components[0]) {
      next.sections[0].components[0].style = {
        ...next.sections[0].components[0].style,
        color: colorMatch[0]
      };
    }
  }

  if (normalized.includes("interaction")) {
    next.interactions.push({ type: "interaction_update", detail: instruction });
  }

  return next;
};
