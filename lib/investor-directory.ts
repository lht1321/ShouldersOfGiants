export type InvestorDirectoryEntry = {
  id: string;
  representative: string;
  manager: string;
  cagr: number | null;
  marketCagr: number | null;
  sharpe: number | null;
  maxDrawdown: number | null;
};

export const investorSortLabels = {
  name: '이름순',
  cagr: '연복리 수익률 높은순',
  excess: '시장 초과수익 높은순',
  sharpe: '샤프지수 높은순',
  drawdown: '최대 낙폭 낮은순',
} as const;

export type InvestorSort = keyof typeof investorSortLabels;

function compareDescending(left: number | null, right: number | null) {
  if (left == null) return right == null ? 0 : 1;
  if (right == null) return -1;
  return right - left;
}

export function findInvestors(investors: InvestorDirectoryEntry[], query: string, sort: InvestorSort) {
  const needle = query.trim().toLocaleLowerCase();
  return investors.filter((item) => `${item.representative} ${item.manager}`.toLocaleLowerCase().includes(needle)).sort((left, right) => {
    if (sort === 'name') return left.representative.localeCompare(right.representative);
    const metric = (item: InvestorDirectoryEntry) => {
      if (sort === 'excess') return item.cagr == null || item.marketCagr == null ? null : item.cagr - item.marketCagr;
      if (sort === 'drawdown') return item.maxDrawdown;
      return item[sort];
    };
    return compareDescending(metric(left), metric(right)) || left.representative.localeCompare(right.representative);
  });
}
