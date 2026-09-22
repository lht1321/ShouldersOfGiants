export function parseBudgetInput(raw: string): number | null {
  const normalized = raw.trim().replaceAll(',', '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const budget = Number(normalized);
  return Number.isFinite(budget) && budget >= 100 && budget <= 100_000_000 ? budget : null;
}
