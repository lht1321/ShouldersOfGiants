import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const data = JSON.parse(readFileSync(join(root, 'lib', 'site-data.json'), 'utf8'));
const failures = [];

const portraitOwners = new Map([
  ['/portraits/traditional-value-pen.jpg', 'Warren Buffett'],
  ['/portraits/activist-pen.jpg', 'Bill Ackman'],
  ['/portraits/value-macro-hybrid-pen.jpg', 'Michael Burry'],
  ['/portraits/quality-compounder-pen.jpg', 'Terry Smith'],
  ['/portraits/deep-distressed-pen.jpg', 'Howard Marks'],
  ['/portraits/fundamental-growth-pen.jpg', 'Chase Coleman'],
  ['/portraits/global-macro-pen.jpg', 'Stanley Druckenmiller'],
  ['/portraits/event-driven-macro-pen.jpg', 'Paul Singer'],
]);

const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(data.investorCount === data.investors.length, '투자자 집계와 실제 데이터 수가 일치해야 합니다.');
check(data.investors.length >= 60, '충분한 수의 가치·매크로 투자자 프로필이 필요합니다.');
check(data.styles.length >= 8, '투자 스타일 분류가 누락되었습니다.');
check(data.consensus.length > 0, '최신 컨센서스 포트폴리오가 비어 있습니다.');
check(data.regime?.label && data.regime?.equityExposure > 0, '현재 레짐 정보가 유효해야 합니다.');

for (const investor of data.investors) {
  check(investor.id && investor.manager && investor.representative, `투자자 식별 정보 누락: ${investor.id || 'unknown'}`);
  check(investor.analysis.length >= 3, `상세 투자 스타일 분석 누락: ${investor.id}`);

  if (investor.illustration) {
    check(investor.illustration.endsWith('-pen.jpg'), `D형 펜 일러스트가 아님: ${investor.id}`);
    const portraitSubject = portraitOwners.get(investor.illustration);
    check(portraitSubject === investor.illustrationSubject, `초상 인물 정보가 일치하지 않음: ${investor.id}`);
    check(Boolean(portraitSubject && investor.representative.includes(portraitSubject)), `다른 인물의 초상이 연결됨: ${investor.id} → ${investor.illustration}`);
    check(existsSync(join(root, 'public', investor.illustration.replace(/^\//, ''))), `일러스트 파일 누락: ${investor.illustration}`);
  }
}

const illustratedInvestors = data.investors.filter((investor) => investor.illustration);
check(illustratedInvestors.length === portraitOwners.size, `검증된 인물 초상은 ${portraitOwners.size}개여야 합니다.`);
check(new Set(illustratedInvestors.map((investor) => investor.illustration)).size === illustratedInvestors.length, '한 초상을 여러 투자자에게 재사용할 수 없습니다.');

check(data.investors.some((investor) => investor.curve.length > 0), '시장 비교 수익률 곡선이 필요합니다.');
check(data.investors.some((investor) => investor.portfolio.length > 0), '포트폴리오 분포 데이터가 필요합니다.');
check(data.investors.some((investor) => investor.calculator.length > 0), '예산별 매수 수량 데이터가 필요합니다.');
check(data.investors.some((investor) => investor.changes.length > 0), '직전 분기 포지션 변경 데이터가 필요합니다.');

const archiveSource = readFileSync(join(root, 'components', 'investor-archive.tsx'), 'utf8');
for (const phrase of ['이름 또는 운용사 검색', '연복리 수익률 높은순', '시장 초과수익 높은순', '샤프지수 높은순']) {
  check(archiveSource.includes(phrase), `투자자 검색·정렬 옵션 누락: ${phrase}`);
}

const globalStyles = readFileSync(join(root, 'app', 'globals.css'), 'utf8');
for (const token of ['--accent-blue:', '--accent-blue-soft:', '--positive:', '--negative:', '--warning-soft:']) {
  check(globalStyles.includes(token), `절제된 색상 토큰 누락: ${token}`);
}
const dashboardSource = readFileSync(join(root, 'components', 'performance-dashboard.tsx'), 'utf8');
check(dashboardSource.includes("investor: { label: '13F 복제', color: '#24527a' }"), '수익률 차트에서 투자자와 시장이 색으로 구분되어야 합니다.');
check(dashboardSource.includes("'#2f6f62'"), '포트폴리오 차트에 절제된 보조색이 필요합니다.');

const allocatorSource = readFileSync(join(root, 'components', 'allocator-client.tsx'), 'utf8');
for (const phrase of ['budget-presets', 'allocation-chart', 'buildAllocation']) {
  check(allocatorSource.includes(phrase), `예산 배분 도구 기능 누락: ${phrase}`);
}

const changesSource = readFileSync(join(root, 'components', 'changes-explorer.tsx'), 'utf8');
for (const phrase of ['change-filter', 'change-search', 'change-impact-chart']) {
  check(changesSource.includes(phrase), `포지션 변화 도구 기능 누락: ${phrase}`);
}

const detailSource = readFileSync(join(root, 'app', 'investors', '[id]', 'page.tsx'), 'utf8');
check(detailSource.includes('InvestorDetailCharts'), '투자자 상세 페이지에 수익률·포트폴리오 차트가 필요합니다.');

const headerSource = readFileSync(join(root, 'components', 'site-header.tsx'), 'utf8');
check(headerSource.includes('data-native-navigation'), '배포 환경에서 안정적인 전체 페이지 메뉴 이동이 필요합니다.');
check(headerSource.includes('window.location.assign'), '상단 메뉴 클릭은 전체 페이지 이동으로 처리되어야 합니다.');
check(headerSource.includes('prefetch={false}'), '상단 메뉴의 RSC 사전 요청을 비활성화해야 합니다.');

if (failures.length) {
  throw new Error(`사이트 검증 실패 (${failures.length})\n- ${failures.join('\n- ')}`);
}

console.log(`사이트 검증 통과: 투자자 ${data.investors.length}명, 스타일 ${data.styles.length}개, 검증된 초상 ${illustratedInvestors.length}개 및 핵심 기능 데이터 확인`);
