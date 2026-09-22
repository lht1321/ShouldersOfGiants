import assert from 'node:assert/strict';
import test from 'node:test';

import { findInvestors } from '../lib/investor-directory.ts';

const investors = [
  { id: 'a', representative: 'Alpha', manager: 'First Capital', cagr: 0.12, marketCagr: 0.08, sharpe: 0.9, maxDrawdown: -0.3 },
  { id: 'b', representative: 'Beta', manager: 'Second Capital', cagr: 0.2, marketCagr: 0.16, sharpe: 1.1, maxDrawdown: -0.15 },
  { id: 'c', representative: 'Gamma', manager: 'Alpha Partners', cagr: null, marketCagr: null, sharpe: null, maxDrawdown: null },
];

test('투자자와 운용사 이름을 대소문자 구분 없이 검색한다', () => {
  assert.deepEqual(findInvestors(investors, 'ALPHA', 'name').map((item) => item.id), ['a', 'c']);
});

test('수익률 정렬 시 자료가 없는 투자자는 마지막에 둔다', () => {
  assert.deepEqual(findInvestors(investors, '', 'cagr').map((item) => item.id), ['b', 'a', 'c']);
});

test('최대 낙폭은 덜 깊은 순서로 정렬한다', () => {
  assert.deepEqual(findInvestors(investors, '', 'drawdown').map((item) => item.id), ['b', 'a', 'c']);
});
