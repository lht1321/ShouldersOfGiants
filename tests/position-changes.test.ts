import assert from 'node:assert/strict';
import test from 'node:test';

import { filterPositionChanges, summarizePositionChanges } from '../lib/position-changes.ts';
import type { PositionChange } from '../lib/types.ts';

const changes: PositionChange[] = [
  { ticker: 'AAPL', name: 'Apple', action: '확대', currentWeight: 0.2, previousWeight: 0.1, weightChange: 0.1, sharesChange: 0.2, inference: '' },
  { ticker: 'KO', name: 'Coca Cola', action: '축소', currentWeight: 0.05, previousWeight: 0.08, weightChange: -0.03, sharesChange: -0.1, inference: '' },
  { ticker: 'NEW', name: 'New Co', action: '신규', currentWeight: 0.02, previousWeight: 0, weightChange: 0.02, sharesChange: null, inference: '' },
];

test('액션과 검색어를 함께 적용해 포지션 변화를 필터링한다', () => {
  assert.deepEqual(filterPositionChanges(changes, '축소', 'coca').map((change) => change.ticker), ['KO']);
});

test('변경 요약과 가장 큰 비중 변화를 계산한다', () => {
  const summary = summarizePositionChanges(changes);

  assert.equal(summary.counts['신규'], 1);
  assert.equal(summary.counts['확대'], 1);
  assert.equal(summary.counts['축소'], 1);
  assert.equal(summary.largestIncrease?.ticker, 'AAPL');
  assert.equal(summary.largestDecrease?.ticker, 'KO');
});
