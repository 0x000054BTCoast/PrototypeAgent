import { RenderSchema } from "@/components/render-schema";
import schema from "@/lib/structure.json";
import type { UISchema } from "@/lib/types";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-semibold capitalize">analytics workspace</h1>
        <RenderSchema schema={schema as UISchema} />
      </div>
    </main>
  );
}
