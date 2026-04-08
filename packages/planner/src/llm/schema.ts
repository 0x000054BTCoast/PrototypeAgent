import { z } from 'zod';
import type { UISchema } from '../../../schema/src/index.js';

const componentSchema: z.ZodType<UISchema['sections'][number]['components'][number]> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.enum(['chart', 'table', 'button', 'card', 'text']),
    props: z.record(z.unknown()),
    style: z.record(z.unknown()),
    children: z.array(componentSchema)
  })
);

const sectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  position: z.enum(['top', 'left', 'center', 'right', 'bottom']),
  components: z.array(componentSchema)
});

export const llmStructuredPlanSchema = z.object({
  schemaVersion: z.literal(2),
  page_name: z.string().min(1),
  intent: z.enum(['dashboard', 'crm', 'landing', 'admin']).optional(),
  template: z.enum(['dashboard', 'crm', 'landing', 'admin']).optional(),
  layout: z.object({
    type: z.literal('grid'),
    columns: z.literal(24)
  }),
  sections: z.array(sectionSchema),
  interactions: z.array(z.record(z.unknown()))
});

export type LLMStructuredPlan = z.infer<typeof llmStructuredPlanSchema>;

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface PlanValidationResult {
  success: boolean;
  issues: ValidationIssue[];
}

const formatPath = (path: Array<string | number>): string => {
  if (path.length === 0) {
    return '$';
  }

  return String(
    path.reduce((acc, node) => {
      if (typeof node === 'number') {
        return `${acc}[${node}]`;
      }
      return `${acc}.${node}`;
    }, '$')
  );
};

export const cleanJsonPayload = (payload: string): string => {
  const trimmed = payload.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
};

export const parseRawStructuredPlan = (payload: string): unknown => {
  return JSON.parse(cleanJsonPayload(payload));
};

export const validateStructuredPlan = (value: unknown): PlanValidationResult => {
  const parsed = llmStructuredPlanSchema.safeParse(value);
  if (parsed.success) {
    return { success: true, issues: [] };
  }

  return {
    success: false,
    issues: parsed.error.issues.map((issue) => ({
      path: formatPath(issue.path),
      message: issue.message
    }))
  };
};

export const toUISchemaFromStructuredPlan = (value: unknown): UISchema => {
  return llmStructuredPlanSchema.parse(value) as UISchema;
};
