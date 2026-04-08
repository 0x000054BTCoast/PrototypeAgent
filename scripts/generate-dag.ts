import fs from 'node:fs';
import path from 'node:path';

interface AppSchemaV2 {
  routes: Array<{ id: string; path: string; name: string; view: string }>;
  views: Array<{ id: string; title: string; rootComponentIds: string[] }>;
  components: Array<{ id: string; type: string; children?: string[] }>;
  actions: Array<{ id: string; trigger: { type: string } }>;
  design: { tokens: Record<string, string | number> };
}

const repoRoot = process.cwd();
const inputPath = path.resolve(repoRoot, process.argv[2] ?? 'output/app-schema-v2.json');
const outputPath = path.resolve(repoRoot, process.argv[3] ?? 'output/task-dag.md');

const schema = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as AppSchemaV2;

const componentById = new Map(schema.components.map((component) => [component.id, component]));

const walkComponentTypes = (rootIds: string[]): Set<string> => {
  const types = new Set<string>();
  const queue = [...rootIds];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const componentId = queue.shift();
    if (!componentId || visited.has(componentId)) continue;
    visited.add(componentId);

    const component = componentById.get(componentId);
    if (!component) continue;

    types.add(component.type);
    (component.children ?? []).forEach((childId) => queue.push(childId));
  }

  return types;
};

const sanitizeNodeId = (value: string): string => value.replace(/[^a-zA-Z0-9_]/g, '_');
const quoteLabel = (value: string): string => value.replaceAll('"', '\\"');

const tokens = Object.keys(schema.design?.tokens ?? {});
const primitiveTypes = [...new Set(schema.components.map((component) => component.type))];

const routeNodes = schema.routes.map((route) => ({
  id: route.id,
  label: `${route.name} (${route.path})`,
  view: route.view
}));

const features = routeNodes.map((routeNode) => {
  const view = schema.views.find((item) => item.id === routeNode.view);
  const usedTypes = walkComponentTypes(view?.rootComponentIds ?? []);
  const featureId = `feature_${routeNode.id}`;
  const triggerKinds = schema.actions.map((action) => action.trigger.type);

  return {
    id: featureId,
    label: `${routeNode.label} feature`,
    routeId: routeNode.id,
    primitiveTypes: [...usedTypes],
    testId: `test_${routeNode.id}`,
    testLabel: `e2e_${routeNode.id} (${triggerKinds.length} triggers)`
  };
});

const lines: string[] = [];
lines.push('# Schema Task DAG');
lines.push('');
lines.push(`- Source: \`${path.relative(repoRoot, inputPath)}\``);
lines.push(`- Generated: ${new Date().toISOString()}`);
lines.push('');
lines.push('```mermaid');
lines.push('flowchart LR');
lines.push(
  '  stage_tokens([tokens]) --> stage_primitives([primitives]) --> stage_routes([routes]) --> stage_features([features]) --> stage_tests([tests])'
);

for (const token of tokens) {
  lines.push(`  token_${sanitizeNodeId(token)}["token: ${quoteLabel(token)}"]`);
  lines.push(`  stage_tokens --> token_${sanitizeNodeId(token)}`);
}

for (const primitive of primitiveTypes) {
  lines.push(`  primitive_${sanitizeNodeId(primitive)}["primitive: ${quoteLabel(primitive)}"]`);
  lines.push(`  stage_primitives --> primitive_${sanitizeNodeId(primitive)}`);
  for (const token of tokens) {
    lines.push(`  token_${sanitizeNodeId(token)} --> primitive_${sanitizeNodeId(primitive)}`);
  }
}

for (const routeNode of routeNodes) {
  lines.push(`  route_${sanitizeNodeId(routeNode.id)}["route: ${quoteLabel(routeNode.label)}"]`);
  lines.push(`  stage_routes --> route_${sanitizeNodeId(routeNode.id)}`);
}

for (const feature of features) {
  lines.push(`  ${sanitizeNodeId(feature.id)}["feature: ${quoteLabel(feature.label)}"]`);
  lines.push(`  stage_features --> ${sanitizeNodeId(feature.id)}`);
  lines.push(`  route_${sanitizeNodeId(feature.routeId)} --> ${sanitizeNodeId(feature.id)}`);

  for (const primitive of feature.primitiveTypes) {
    lines.push(`  primitive_${sanitizeNodeId(primitive)} --> ${sanitizeNodeId(feature.id)}`);
  }

  lines.push(`  ${sanitizeNodeId(feature.testId)}["test: ${quoteLabel(feature.testLabel)}"]`);
  lines.push(`  stage_tests --> ${sanitizeNodeId(feature.testId)}`);
  lines.push(`  ${sanitizeNodeId(feature.id)} --> ${sanitizeNodeId(feature.testId)}`);
}

lines.push('```');
lines.push('');
lines.push('## Summary');
lines.push('');
lines.push(`- tokens: ${tokens.length}`);
lines.push(`- primitives: ${primitiveTypes.length}`);
lines.push(`- routes: ${routeNodes.length}`);
lines.push(`- features: ${features.length}`);
lines.push(`- tests: ${features.length}`);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
console.log(`DAG generated: ${path.relative(repoRoot, outputPath)}`);
