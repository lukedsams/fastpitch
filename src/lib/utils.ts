import type { ProspectData, MonteCarloConfig, RetirementDrawdownConfig } from "./types";

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getDefaultMonteCarloConfig(prospect: ProspectData): MonteCarloConfig {
  const investableAssets = prospect.investableAssets ?? 1_000_000;
  const retirementAge = prospect.retirementAge ?? 65;
  const currentAge = prospect.age ?? 45;
  const yearsToRetirement = Math.max(retirementAge - currentAge, 5);

  const riskMap: Record<string, { stocks: number; bonds: number; alts: number }> = {
    Conservative: { stocks: 40, bonds: 50, alts: 10 },
    Moderate:     { stocks: 60, bonds: 30, alts: 10 },
    Aggressive:   { stocks: 80, bonds: 10, alts: 10 },
  };
  const alloc = riskMap[prospect.riskTolerance ?? "Moderate"] ?? riskMap.Moderate;

  return {
    initialPortfolioValue: investableAssets,
    annualContribution:    Math.round(investableAssets * 0.05),
    timeHorizonYears:      yearsToRetirement + 25,
    targetEndValue:        investableAssets * 2,
    annualWithdrawal:      Math.round(investableAssets * 0.04),
    withdrawalStartYear:   yearsToRetirement,
    inflationRate:         3,
    stockAllocation:       alloc.stocks,
    bondAllocation:        alloc.bonds,
    alternativeAllocation: alloc.alts,
    numSimulations:        1000,
    confidenceLevel:       90,
  };
}

export function getDefaultRetirementDrawdownConfig(prospect: ProspectData): RetirementDrawdownConfig {
  const currentAge    = prospect.age ?? 50;
  const retirementAge = prospect.retirementAge ?? 65;
  const investable    = prospect.investableAssets ?? 1_000_000;

  return {
    currentAge,
    retirementAge,
    lifeExpectancy:                    90,
    initialPortfolioValue:             investable,
    annualRetirementExpenses:          Math.round(investable * 0.04),
    inflationRate:                     3,
    expectedReturnPreRetirement:       7,
    expectedReturnDuringRetirement:    5,
    socialSecurityMonthly:             2_500,
    socialSecurityStartAge:            67,
    pensionMonthly:                    0,
    pensionStartAge:                   65,
    otherIncomeMonthly:                0,
    otherIncomeEndAge:                 75,
    healthcareCostMonthly:             1_500,
    medicareStartAge:                  65,
    medicareMonthly:                   500,
    legacyGoal:                        Math.round(investable * 0.5),
    withdrawalStrategy:                "percentage",
    safeWithdrawalRate:                4,
  };
}
