export type CurvePoint = {
  date: string;
  investor: number | null;
  market: number | null;
};

export type Holding = {
  ticker: string | null;
  name: string;
  weight: number | null;
  valueUsd: number | null;
};

export type CalculatorHolding = {
  ticker: string;
  name: string;
  weight: number | null;
  price: number;
  priceDate: string;
  estimatedPrice: boolean;
};

export type PositionChange = {
  ticker: string;
  name: string;
  action: '신규' | '전량매도' | '확대' | '축소' | '유지';
  currentWeight: number | null;
  previousWeight: number | null;
  weightChange: number | null;
  sharesChange: number | null;
  inference: string;
};

export type Investor = {
  id: string;
  manager: string;
  representative: string;
  style: string;
  styleLabel: string;
  illustration: string | null;
  illustrationSubject: string | null;
  characteristics: string;
  thesis: string;
  principles: string[];
  watch: string;
  analysis: { title: string; body: string }[];
  metrics: {
    start: string | null;
    end: string | null;
    years: number | null;
    cagr: number | null;
    totalReturn: number | null;
    volatility: number | null;
    sharpe: number | null;
    maxDrawdown: number | null;
    marketCagr: number | null;
    marketTotalReturn: number | null;
    turnover: number | null;
    mappingCoverage: number | null;
    confidence: string | null;
  };
  curve: CurvePoint[];
  portfolioDate: string | null;
  previousPortfolioDate: string | null;
  portfolio: Holding[];
  positionCount: number;
  calculator: CalculatorHolding[];
  changes: PositionChange[];
};

export type ConsensusHolding = {
  ticker: string;
  weight: number;
  price: number;
  priceDate: string;
  managerCount: number;
  supporters: string[];
  coreWeight: number;
  satelliteWeight: number;
};

export type SiteData = {
  generatedAt: string;
  investorCount: number;
  investors: Investor[];
  styles: Array<{
    id: string;
    label: string;
    image: string;
    thesis: string;
    principles: string[];
    watch: string;
  }>;
  regime: {
    id: string;
    label: string;
    equityExposure: number;
    priceDate: string;
    reportDate: string;
    signalAt: string;
    rationale: string;
    rules: Array<{ label: string; exposure: number; description: string }>;
  };
  consensus: ConsensusHolding[];
  strategyCurves: Array<Record<string, string | number | null>>;
  strategyMetrics: Array<Record<string, string | number | null>>;
  paperSummary: Record<string, string | number | boolean>;
  methodology: {
    delay: string;
    cost: string;
    benchmark: string;
    limitations: string;
  };
};
