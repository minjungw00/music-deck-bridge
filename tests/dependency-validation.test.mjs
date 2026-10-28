import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { Option, OptionGroup, option, optionGroup } from '@elgato/utils';

// Exercise the Zod instance resolved by utils, including any scoped override.
const utilsRequire = createRequire(import.meta.resolve('@elgato/utils'));
const { z } = utilsRequire('zod/v4-mini');

test('Elgato option schemas accept nested options and reject malformed values', () => {
  const item = option({ label: 'Track', value: 'current-track' });
  const group = optionGroup({ label: 'Display', options: [
    item, optionGroup({ label: 'Details', options: [option({ label: 'Artist', value: true })] }),
  ] });
  assert.deepEqual(Option.parse(item), item);
  assert.deepEqual(OptionGroup.parse(group), group);
  assert.equal(OptionGroup.safeParse({ ...group, options: [{ ...item, value: {} }] }).success, false);
});

test('oversized bounded Zod arrays reject before validating their elements', () => {
  const schema = z.array(z.string()).check(z.maxLength(2));
  const result = schema.safeParse([1, 2, 3]);
  assert.equal(result.success, false);
  // GHSA-mrhx-c7xc-m3w5: the size bound must stop per-element issue accumulation.
  assert.deepEqual(result.error.issues.map(issue => issue.code), ['too_big']);
  assert.deepEqual(schema.parse(['one', 'two']), ['one', 'two']);
});
