import type { PositionChange } from './types.ts';

export type PositionChangeFilter = PositionChange['action'] | 'all';

export function filterPositionChanges(changes: PositionChange[], action: PositionChangeFilter, query: string) {
  const needle = query.trim().toLowerCase();
  return changes.filter((change) => {
    const matchesAction = action === 'all' || change.action === action;
    const matchesQuery = !needle || `${change.ticker} ${change.name}`.toLowerCase().includes(needle);
    return matchesAction && matchesQuery;
  });
}

export function summarizePositionChanges(changes: PositionChange[]) {
  const counts = Object.fromEntries(
    ['신규', '확대', '축소', '전량매도', '유지'].map((action) => [
      action,
      changes.filter((change) => change.action === action).length,
    ]),
  ) as Record<PositionChange['action'], number>;

  const ranked = [...changes].sort((left, right) => (right.weightChange ?? 0) - (left.weightChange ?? 0));
  return {
    counts,
    largestIncrease: ranked.find((change) => (change.weightChange ?? 0) > 0) ?? null,
    largestDecrease: [...ranked].reverse().find((change) => (change.weightChange ?? 0) < 0) ?? null,
  };
}
