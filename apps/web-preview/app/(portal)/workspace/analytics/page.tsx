import { RenderSchema } from '@/components/render-schema';
import schema from '@/lib/structure.json';
import type { UISchema } from '@/lib/types';

export default function AnalyticsPage() {
  return <RenderSchema schema={schema as UISchema} />;
}
