import assert from 'node:assert/strict';
import test from 'node:test';

import { parseBudgetInput } from '../lib/budget-input.ts';

test('직접 입력한 달러 금액과 쉼표 표기를 계산 가능한 예산으로 바꾼다', () => {
  assert.equal(parseBudgetInput('12,345.67'), 12345.67);
  assert.equal(parseBudgetInput('500'), 500);
});

test('빈 값, 음수, 범위를 벗어난 예산을 거부한다', () => {
  for (const value of ['', 'abc', '99', '-500', '100000001']) {
    assert.equal(parseBudgetInput(value), null);
  }
});
