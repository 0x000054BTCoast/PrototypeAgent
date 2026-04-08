import type { UISchema } from '@prd2prototype/schema';
import type { EngineeringTemplate } from '../../../template-strategy';

const TEMPLATE_MAIN_CLASS: Record<EngineeringTemplate, string> = {
  dashboard:
    'min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:px-8 lg:px-12',
  crm: 'min-h-screen bg-emerald-50 px-4 py-6 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100 md:px-8 lg:px-12',
  landing:
    'min-h-screen bg-indigo-50 px-4 py-6 text-indigo-950 dark:bg-indigo-950 dark:text-indigo-100 md:px-8 lg:px-12',
  admin:
    'min-h-screen bg-amber-50 px-4 py-6 text-amber-950 dark:bg-amber-950 dark:text-amber-100 md:px-8 lg:px-12'
};

export const emitPageRoute = (
  schema: UISchema,
  template: EngineeringTemplate
): string => `import { RenderSchema } from "@/components/render-schema";
import schema from "@/lib/structure.json";
import type { UISchema } from "@/lib/types";

export default function Page() {
  return (
    <main className="${TEMPLATE_MAIN_CLASS[template]}">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-semibold capitalize">${schema.page_name.replace(/_/g, ' ')}</h1>
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs uppercase tracking-wide shadow-sm dark:bg-slate-900/70">
            template: ${template}
          </span>
        </div>
        <RenderSchema schema={schema as UISchema} />
      </div>
    </main>
  );
}
`;
