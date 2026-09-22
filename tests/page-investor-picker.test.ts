import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('성과 분석·예산 배분·포지션 변화에 화면 내 투자자 검색·정렬 도구가 있다', () => {
  for (const name of ['performance-dashboard', 'allocator-client', 'changes-explorer']) {
    const source = readFileSync(new URL(`../components/${name}.tsx`, import.meta.url), 'utf8');
    assert.match(source, /InvestorPicker/, `${name}에 투자자 검색·정렬 도구가 없습니다.`);
  }
});
