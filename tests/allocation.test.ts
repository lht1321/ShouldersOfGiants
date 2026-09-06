import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAllocation } from '../lib/allocation.ts';

const positions = [
  { ticker: 'AAA', name: 'Alpha', weight: 0.6, price: 120 },
  { ticker: 'BBB', name: 'Beta', weight: 0.4, price: 80 },
];

test('레짐 노출 비중을 넘지 않는 정수 주식 주문안을 만든다', () => {
  const result = buildAllocation(9_999, positions, 0.7);

  assert.ok(result.invested <= 9_999 * 0.7);
  assert.equal(result.cash, 9_999 - result.invested);
  assert.ok(result.rows.every((row) => Number.isInteger(row.shares) && row.shares > 0));
  assert.ok(result.rows.every((row) => row.estimatedValue === row.shares * row.price));
});

test('매수할 수 없는 예산은 빈 주문안과 전액 현금을 반환한다', () => {
  const result = buildAllocation(50, positions, 1);

  assert.deepEqual(result.rows, []);
  assert.equal(result.invested, 0);
  assert.equal(result.cash, 50);
});

test('유효하지 않은 포지션은 계산에서 제외한다', () => {
  const result = buildAllocation(1_000, [
    ...positions,
    { ticker: 'ZERO', name: 'Invalid', weight: 0, price: 10 },
    { ticker: 'NOPRICE', name: 'Invalid', weight: 0.2, price: 0 },
  ], 1);

  assert.deepEqual(result.rows.map((row) => row.ticker).sort(), ['AAA', 'BBB']);
});
