import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

// Follow the SDK's actual dependency path, including nested installs and overrides.
const sdkRequire = createRequire(import.meta.resolve('@elgato/streamdeck'));
const utilsRequire = createRequire(sdkRequire.resolve('@elgato/utils'));
const { Option, OptionGroup, option, optionGroup } = utilsRequire('@elgato/utils');
const { JsonRpcRequest, JsonRpcResponse } = utilsRequire('@elgato/utils/rpc');
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

test('bounded Zod arrays skip element validators only when oversized', () => {
  let visits = 0;
  const element = z.custom(value => { visits++; return typeof value === 'string'; });
  const schema = z.array(element).check(z.maxLength(2));
  for (const values of [[1, 2, 3], ['one', 'two', 'three']]) {
    const result = schema.safeParse(values);
    assert.equal(result.success, false);
    assert.equal(visits, 0);
    assert.deepEqual(result.error.issues.map(issue => issue.code), ['too_big']);
  }
  assert.deepEqual(schema.parse(['one', 'two']), ['one', 'two']);
  assert.equal(visits, 2);
  visits = 0;
  assert.equal(schema.safeParse(['one', 2]).success, false);
  assert.equal(visits, 2);
});

test('Elgato JSON-RPC schemas retain request and strict response validation', () => {
  for (const params of [{ enabled: true }, ['track', 1], undefined]) {
    const request = { jsonrpc: '2.0', method: 'settings', params, id: 'request-1' };
    assert.deepEqual(JsonRpcRequest.parse(request), request);
  }
  assert.equal(JsonRpcRequest.safeParse({ jsonrpc: '2.0', method: 1 }).success, false);
  assert.equal(JsonRpcRequest.safeParse({ jsonrpc: '2.0', method: 'settings', params: null }).success, false);
  const success = { jsonrpc: '2.0', result: { enabled: true }, id: 'request-1' };
  const failure = { jsonrpc: '2.0', error: { code: -32602, message: 'Invalid params' }, id: 'request-1' };
  assert.deepEqual(JsonRpcResponse.parse(success), success);
  assert.deepEqual(JsonRpcResponse.parse(failure), failure);
  assert.equal(JsonRpcResponse.safeParse({ ...success, error: failure.error }).success, false);
  assert.equal(JsonRpcResponse.safeParse({ ...failure, error: { code: 'invalid', message: 'Invalid params' } }).success, false);
});
