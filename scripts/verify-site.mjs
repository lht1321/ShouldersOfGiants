import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const data = JSON.parse(readFileSync(join(root, 'lib', 'site-data.json'), 'utf8'));
const failures = [];

const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(data.investorCount === data.investors.length, '투자자 집계와 실제 데이터 수가 일치해야 합니다.');
check(data.investors.length >= 60, '충분한 수의 가치·매크로 투자자 프로필이 필요합니다.');
check(data.styles.length >= 8, '투자 스타일 분류가 누락되었습니다.');
check(data.consensus.length > 0, '레짐 컨센서스 포트폴리오가 비어 있습니다.');
check(data.regime?.label && data.regime?.equityExposure > 0, '현재 레짐 정보가 유효해야 합니다.');

for (const investor of data.investors) {
  check(investor.id && investor.manager && investor.representative, `투자자 식별 정보 누락: ${investor.id || 'unknown'}`);
  check(investor.analysis.length >= 3, `상세 스타일 분석 누락: ${investor.id}`);
  check(investor.illustration.endsWith('-pen.jpg'), `D형 펜 일러스트가 연결되지 않음: ${investor.id}`);
  check(existsSync(join(root, 'public', investor.illustration.replace(/^\//, ''))), `일러스트 파일 누락: ${investor.illustration}`);
}

check(data.investors.some((investor) => investor.curve.length > 0), '시장 비교 수익률 곡선이 필요합니다.');
check(data.investors.some((investor) => investor.portfolio.length > 0), '포트폴리오 분포 데이터가 필요합니다.');
check(data.investors.some((investor) => investor.calculator.length > 0), '예산별 매수 수량 데이터가 필요합니다.');
check(data.investors.some((investor) => investor.changes.length > 0), '직전 분기 포지션 변화 데이터가 필요합니다.');

const archiveSource = readFileSync(join(root, 'components', 'investor-archive.tsx'), 'utf8');
for (const phrase of ['이름 또는 운용사 검색', '연복리 수익률 높은순', '시장 초과수익 높은순', '샤프지수 높은순']) {
  check(archiveSource.includes(phrase), `투자자 검색·정렬 옵션 누락: ${phrase}`);
}

const paletteFiles = [
  join(root, 'app', 'globals.css'),
  join(root, 'components', 'performance-dashboard.tsx'),
];

for (const file of paletteFiles) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi)) {
    const raw = match[1].length === 3 ? match[1].split('').map((part) => part.repeat(2)).join('') : match[1];
    const [red, green, blue] = [raw.slice(0, 2), raw.slice(2, 4), raw.slice(4, 6)].map((part) => Number.parseInt(part, 16));
    check(red === green && green === blue, `무채색 팔레트 위반 ${match[0]}: ${file}`);
  }
  for (const match of source.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi)) {
    const [, red, green, blue] = match.map(Number);
    check(red === green && green === blue, `무채색 RGB 팔레트 위반 ${match[0]}: ${file}`);
  }
}

if (failures.length) {
  throw new Error(`사이트 검증 실패 (${failures.length})\n- ${failures.join('\n- ')}`);
}

console.log(`사이트 검증 통과: 투자자 ${data.investors.length}명, 스타일 ${data.styles.length}개, D형 일러스트 연결 및 핵심 기능 데이터 확인`);
