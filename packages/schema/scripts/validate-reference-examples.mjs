import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const referenceDir = resolve(import.meta.dirname, '../../../fixtures/schema-references');

const componentTypes = new Set(['container', 'text', 'button', 'table', 'chart', 'form', 'input']);
const triggerTypes = new Set(['click', 'submit', 'load', 'change']);
const stateTypes = new Set(['string', 'number', 'boolean', 'array', 'object']);
const querySources = new Set(['rest', 'graphql', 'local']);
const methods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const themes = new Set(['light', 'dark', 'system']);
const constraintKinds = new Set(['naming', 'a11y', 'performance', 'security', 'custom']);
const constraintLevels = new Set(['warn', 'error']);

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

function validateSchema(input) {
  const issues = [];
  const push = (path, message) => issues.push(`${path}: ${message}`);

  if (!isObject(input)) {
    push('$', '必须是对象');
    return issues;
  }

  for (const key of ['routes', 'views', 'components', 'data', 'actions', 'design', 'constraints']) {
    if (!(key in input)) push('$', `缺少必填字段 ${key}`);
  }

  if (!Array.isArray(input.routes)) push('$.routes', '必须是数组');
  else
    input.routes.forEach((route, i) => {
      if (!isObject(route)) return push(`$.routes[${i}]`, '必须是对象');
      ['id', 'path', 'name', 'view'].forEach(
        (k) => !isNonEmptyString(route[k]) && push(`$.routes[${i}].${k}`, '必须是非空字符串')
      );
    });

  if (!Array.isArray(input.views)) push('$.views', '必须是数组');
  else
    input.views.forEach((view, i) => {
      if (!isObject(view)) return push(`$.views[${i}]`, '必须是对象');
      if (!isNonEmptyString(view.id)) push(`$.views[${i}].id`, '必须是非空字符串');
      if (!isNonEmptyString(view.title)) push(`$.views[${i}].title`, '必须是非空字符串');
      if (!isObject(view.layout) || !['grid', 'stack', 'free'].includes(view.layout.type))
        push(`$.views[${i}].layout.type`, '必须是 grid|stack|free');
      if (!Array.isArray(view.rootComponentIds))
        push(`$.views[${i}].rootComponentIds`, '必须是数组');
    });

  if (!Array.isArray(input.components)) push('$.components', '必须是数组');
  else
    input.components.forEach((component, i) => {
      if (!isObject(component)) return push(`$.components[${i}]`, '必须是对象');
      if (!isNonEmptyString(component.id)) push(`$.components[${i}].id`, '必须是非空字符串');
      if (!componentTypes.has(component.type)) push(`$.components[${i}].type`, '组件类型非法');
      if (!isObject(component.props)) push(`$.components[${i}].props`, '必须是对象');
    });

  if (!isObject(input.data)) push('$.data', '必须是对象');
  else {
    if (!Array.isArray(input.data.entities)) push('$.data.entities', '必须是数组');
    if (!Array.isArray(input.data.queries)) push('$.data.queries', '必须是数组');
    if (!Array.isArray(input.data.states)) push('$.data.states', '必须是数组');

    if (Array.isArray(input.data.queries))
      input.data.queries.forEach((q, i) => {
        if (!isObject(q)) return push(`$.data.queries[${i}]`, '必须是对象');
        if (!isNonEmptyString(q.id)) push(`$.data.queries[${i}].id`, '必须是非空字符串');
        if (!querySources.has(q.source)) push(`$.data.queries[${i}].source`, 'source 非法');
        if (q.method !== undefined && !methods.has(q.method))
          push(`$.data.queries[${i}].method`, 'method 非法');
      });

    if (Array.isArray(input.data.states))
      input.data.states.forEach((s, i) => {
        if (!isObject(s)) return push(`$.data.states[${i}]`, '必须是对象');
        if (!isNonEmptyString(s.id)) push(`$.data.states[${i}].id`, '必须是非空字符串');
        if (!stateTypes.has(s.type)) push(`$.data.states[${i}].type`, 'state type 非法');
        if (!Object.hasOwn(s, 'initial')) push(`$.data.states[${i}].initial`, '必须存在');
      });
  }

  if (!Array.isArray(input.actions)) push('$.actions', '必须是数组');
  else
    input.actions.forEach((action, i) => {
      if (!isObject(action)) return push(`$.actions[${i}]`, '必须是对象');
      if (!isNonEmptyString(action.id)) push(`$.actions[${i}].id`, '必须是非空字符串');
      if (!isObject(action.trigger) || !triggerTypes.has(action.trigger.type))
        push(`$.actions[${i}].trigger.type`, 'trigger type 非法');
      if (!Array.isArray(action.effects) || action.effects.length === 0)
        push(`$.actions[${i}].effects`, '必须是非空数组');
    });

  if (!isObject(input.design)) push('$.design', '必须是对象');
  else {
    if (!themes.has(input.design.theme)) push('$.design.theme', 'theme 非法');
    if (!isObject(input.design.tokens)) push('$.design.tokens', '必须是对象');
    if (!isObject(input.design.breakpoints)) push('$.design.breakpoints', '必须是对象');
  }

  if (!Array.isArray(input.constraints)) push('$.constraints', '必须是数组');
  else
    input.constraints.forEach((constraint, i) => {
      if (!isObject(constraint)) return push(`$.constraints[${i}]`, '必须是对象');
      if (!constraintKinds.has(constraint.kind)) push(`$.constraints[${i}].kind`, 'kind 非法');
      if (!isNonEmptyString(constraint.rule)) push(`$.constraints[${i}].rule`, '必须是非空字符串');
      if (!constraintLevels.has(constraint.level)) push(`$.constraints[${i}].level`, 'level 非法');
    });

  return issues;
}

const files = (await readdir(referenceDir)).filter((file) => file.endsWith('.json')).sort();
if (files.length !== 10) {
  throw new Error(`期望 10 个示例，实际 ${files.length} 个`);
}

const failures = [];
for (const file of files) {
  const raw = await readFile(resolve(referenceDir, file), 'utf8');
  const data = JSON.parse(raw);
  const issues = validateSchema(data);
  if (issues.length > 0) failures.push({ file, issues });
  else console.log(`✅ ${file}`);
}

if (failures.length > 0) {
  const msg = failures
    .map((f) => `${f.file}\n${f.issues.map((i) => `  - ${i}`).join('\n')}`)
    .join('\n\n');
  throw new Error(`校验失败:\n${msg}`);
}

console.log(`\n全部通过：${files.length}/${files.length}`);
