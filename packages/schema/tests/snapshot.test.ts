import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import {
  migrateUISchemaToAppSchemaV2,
  normalizeAndValidateUISchemaVersion,
  validateAppSchemaV2
} from '../src/index';

const snapshotDir = resolve(import.meta.dirname, '__snapshots__');

async function assertSnapshot(name: string, value: unknown): Promise<void> {
  const snapshotPath = resolve(snapshotDir, `${name}.json`);
  const expected = JSON.parse(await readFile(snapshotPath, 'utf8')) as unknown;
  assert.deepEqual(value, expected);
}

test('schema validator snapshot: 关键字段通过', async () => {
  const validSchema = {
    routes: [
      {
        id: 'route_dashboard',
        path: '/dashboard',
        name: 'dashboard',
        view: 'view_dashboard',
        guards: [{ kind: 'auth', rule: 'must_login' }]
      }
    ],
    views: [
      {
        id: 'view_dashboard',
        title: 'Dashboard',
        layout: { type: 'grid', columns: 24, gap: 16 },
        rootComponentIds: ['cmp_root']
      }
    ],
    components: [
      {
        id: 'cmp_root',
        type: 'container',
        props: { direction: 'vertical' },
        children: ['cmp_text'],
        bindings: [{ prop: 'title', from: 'data.states.pageTitle' }]
      },
      {
        id: 'cmp_text',
        type: 'text',
        props: { content: 'Hello' }
      }
    ],
    data: {
      entities: [{ id: 'user', shape: { id: 'string', name: 'string' } }],
      queries: [{ id: 'q_users', source: 'rest', endpoint: '/api/users', method: 'GET' }],
      states: [{ id: 'pageTitle', type: 'string', initial: 'Dashboard' }]
    },
    actions: [
      {
        id: 'act_load_users',
        trigger: { type: 'load' },
        effects: [{ type: 'run_query', queryId: 'q_users' }]
      }
    ],
    design: {
      theme: 'light',
      tokens: { spacingUnit: 4, radiusMd: 8 },
      breakpoints: { sm: 640, md: 768, lg: 1024 }
    },
    constraints: [{ kind: 'a11y', rule: 'interactive_requires_label', level: 'error' }]
  };

  await assertSnapshot('validator-success-critical-fields', validateAppSchemaV2(validSchema));
});

test('schema validator snapshot: 异常路径', async () => {
  const invalidSchema = {
    routes: [{ id: '', path: '/dashboard', name: 'dashboard', view: 'view_dashboard' }],
    views: [
      {
        id: 'view_dashboard',
        title: 'Dashboard',
        layout: { type: 'grid' },
        rootComponentIds: ['cmp_root']
      }
    ],
    components: [{ id: 'cmp_root', type: 'text', props: {}, extra: true }],
    data: {
      entities: [],
      queries: [{ id: 'q_users', source: 'rest' }],
      states: [{ id: 'count', type: 'number', initial: 0 }]
    },
    actions: [
      {
        id: 'act_submit',
        trigger: { type: 'click' },
        effects: [{ type: 'navigate', to: '' }]
      }
    ],
    design: {
      theme: 'light',
      tokens: { spacingUnit: 4 },
      breakpoints: { sm: 640 }
    },
    constraints: [{ kind: 'naming', rule: '', level: 'warn' }],
    unknownField: true
  };

  await assertSnapshot('validator-error-paths', validateAppSchemaV2(invalidSchema));
});

test('migration snapshot: 关键字段映射与兼容性报告', async () => {
  const legacySchema = {
    schemaVersion: 1,
    page_name: 'sales_dashboard',
    layout: { type: 'grid', columns: 24 },
    sections: [
      {
        id: 'sec_summary',
        name: 'Summary',
        position: 'top',
        components: [
          {
            id: 'cmp_card_1',
            type: 'card',
            props: { title: 'Revenue' },
            style: { padding: 12 },
            children: []
          }
        ]
      }
    ],
    interactions: [{ from: 'cmp_card_1', action: 'open_detail' }]
  };

  const normalized = normalizeAndValidateUISchemaVersion(legacySchema);
  const migrated = migrateUISchemaToAppSchemaV2(normalized.schema);

  await assertSnapshot('migration-success-critical-fields', {
    normalized,
    migrated: {
      ...migrated,
      compatibilityReport: {
        ...migrated.compatibilityReport,
        migratedAt: '<redacted-iso-timestamp>'
      }
    }
  });
});

test('migration snapshot: schemaVersion 异常路径', async () => {
  const errors: string[] = [];
  for (const input of [{ schemaVersion: 0 }, { schemaVersion: 999 }, { schemaVersion: 1.5 }]) {
    try {
      normalizeAndValidateUISchemaVersion(input);
    } catch (error) {
      errors.push((error as Error).message);
    }
  }

  await assertSnapshot('migration-error-paths', { errors });
});
