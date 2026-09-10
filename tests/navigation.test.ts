import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const headerSource = readFileSync(new URL('../components/site-header.tsx', import.meta.url), 'utf8');

test('상단 메뉴는 배포 환경에서 전체 페이지 이동을 사용한다', () => {
  assert.match(headerSource, /data-native-navigation/);
  assert.match(headerSource, /window\.location\.assign/);
  assert.match(headerSource, /prefetch=\{false\}/);
});

test('예산 배분과 포지션 변화 경로가 상단 메뉴에 포함된다', () => {
  assert.match(headerSource, /href: '\/allocator'/);
  assert.match(headerSource, /href: '\/changes'/);
});
