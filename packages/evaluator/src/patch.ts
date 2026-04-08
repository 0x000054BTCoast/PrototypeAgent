import fs from 'node:fs';
import path from 'node:path';
import { applyPatchInstruction } from './patch-engine.js';
import { UISchema } from '@prd2prototype/schema';

const args = process.argv.slice(2);
const priorityArg = args.find((arg) => arg.startsWith('--priority='));
const instruction = args
  .filter((arg) => !arg.startsWith('--priority='))
  .join(' ')
  .trim();
if (!instruction) throw new Error('Patch instruction required.');

const priorities = priorityArg
  ?.replace('--priority=', '')
  .split(',')
  .reduce<Record<string, number>>((result, pair) => {
    const [key, rawValue] = pair.split(':');
    const value = Number(rawValue);
    if (key && Number.isFinite(value)) {
      result[key.trim()] = value;
    }
    return result;
  }, {});

const repoRoot = process.env.INIT_CWD ?? process.cwd();
const schemaPath = path.resolve(repoRoot, 'output/structure.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')) as UISchema;
const updated = applyPatchInstruction(schema, instruction, {
  priorities
});
fs.writeFileSync(schemaPath, `${JSON.stringify(updated, null, 2)}\n`);
