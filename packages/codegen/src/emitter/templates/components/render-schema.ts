import type { ComponentTemplate } from './component-contract.js';

export const emitRenderSchemaComponent = (componentTemplates: ComponentTemplate[]): string => {
  const imports = componentTemplates
    .map((component) => `import { ${component.importName} } from "${component.importPath}";`)
    .join('\n');

  const renderBranches = componentTemplates.map((component) => component.render).join('\n');

  return `"use client";

${imports}
import type { UISchema, UIComponent } from "@/lib/types";

const renderComponent = (component: UIComponent) => {
${renderBranches}
  return <p className="text-sm text-slate-600 dark:text-slate-300">{String(component.props.content ?? component.id)}</p>;
};

export function RenderSchema({ schema }: { schema: UISchema }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {schema.sections.map((section) => (
        <section key={section.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-12">
          <h2 className="mb-4 text-lg font-semibold capitalize">{section.name.replaceAll("_", " ")}</h2>
          <div className="space-y-4">
            {section.components.map((component) => (
              <div key={component.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40">
                {renderComponent(component)}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
`;
};
