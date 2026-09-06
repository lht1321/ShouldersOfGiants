export type AllocationInput = {
  ticker: string;
  name: string;
  weight: number;
  price: number;
  managerCount?: number;
  estimatedPrice?: boolean;
};

export type AllocationRow = AllocationInput & {
  targetWeight: number;
  shares: number;
  targetDollars: number;
  estimatedValue: number;
  actualWeight: number;
};

export function buildAllocation(budget: number, positions: AllocationInput[], exposure: number) {
  const safeBudget = Number.isFinite(budget) ? Math.max(0, budget) : 0;
  const safeExposure = Number.isFinite(exposure) ? Math.min(1, Math.max(0, exposure)) : 0;
  const clean = positions.filter((item) => item.weight > 0 && item.price > 0);
  const weightTotal = clean.reduce((sum, item) => sum + item.weight, 0);
  const investableBudget = safeBudget * safeExposure;

  if (!weightTotal || !investableBudget) {
    return { rows: [] as AllocationRow[], invested: 0, cash: safeBudget, investableBudget };
  }

  const rows: AllocationRow[] = clean.map((item) => {
    const targetWeight = item.weight / weightTotal;
    const targetDollars = investableBudget * targetWeight;
    const shares = Math.floor(targetDollars / item.price);
    return { ...item, targetWeight, targetDollars, shares, estimatedValue: shares * item.price, actualWeight: 0 };
  });

  let invested = rows.reduce((sum, item) => sum + item.estimatedValue, 0);
  let availableToInvest = Math.max(0, investableBudget - invested);
  let guard = 0;
  while (guard < 5000) {
    const candidate = rows
      .filter((item) => item.price <= availableToInvest && item.targetDollars > item.estimatedValue)
      .sort((left, right) => (right.targetDollars - right.estimatedValue) - (left.targetDollars - left.estimatedValue))[0];
    if (!candidate) break;
    candidate.shares += 1;
    candidate.estimatedValue += candidate.price;
    invested += candidate.price;
    availableToInvest -= candidate.price;
    guard += 1;
  }

  rows.forEach((item) => {
    item.actualWeight = safeBudget > 0 ? item.estimatedValue / safeBudget : 0;
  });

  return {
    rows: rows.filter((item) => item.shares > 0),
    invested,
    cash: Math.max(0, safeBudget - invested),
    investableBudget,
  };
}
