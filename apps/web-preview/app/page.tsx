import { RenderSchema } from '@/components/render-schema';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import schema from '@/lib/structure.json';
import type { UISchema } from '@/lib/types';

export default function Page() {
  return (
    <main className="min-h-screen bg-bg px-md py-lg text-text md:px-xl lg:px-2xl">
      <div className="mx-auto max-w-7xl">
        <div className="mb-lg flex items-center justify-between gap-md">
          <h1 className="text-title font-semibold capitalize">analytics workspace</h1>
          <ThemeToggle />
        </div>
        <RenderSchema schema={schema as UISchema} />
      </div>
    </main>
  );
}
