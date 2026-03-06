import type { RetirementDrawdownConfig } from "./types";
import { formatCurrency } from "./utils";

export { formatCurrency };

export interface YearlyDrawdownData {
  age: number;
  year: number;
  portfolioValueStart: number;
  portfolioValueEnd: number;
  portfolioWithdrawal: number;
  socialSecurityIncome: number;
  pensionIncome: number;
  otherIncome: number;
  totalIncome: number;
  expenses: number;
  healthcareCosts: number;
  totalExpenses: number;
  netCashflow: number;
  isRetired: boolean;
  cumulativeWithdrawals: number;
}

export interface IncomeSourceBreakdown {
  portfolioWithdrawals: number;
  socialSecurity: number;
  pension: number;
  otherIncome: number;
}

export interface RetirementDrawdownResults {
  yearlyData: YearlyDrawdownData[];
  portfolioDepletionAge: number | null;
  totalLifetimeIncome: number;
  totalLifetimeExpenses: number;
  estimatedLegacy: number;
  sustainabilityScore: number;
  incomeBreakdownAtRetirement: IncomeSourceBreakdown;
  averageAnnualWithdrawalRate: number;
  inflationAdjustedExpensesAtEnd: number;
  yearsPortfolioLasts: number;
  config: RetirementDrawdownConfig;
}

export function runRetirementDrawdownAnalysis(config: RetirementDrawdownConfig): RetirementDrawdownResults {
  const yearlyData: YearlyDrawdownData[] = [];
  let portfolioValue = config.initialPortfolioValue;
  let cumulativeWithdrawals = 0;
  let totalLifetimeIncome = 0;
  let totalLifetimeExpenses = 0;
  let portfolioDepletionAge: number | null = null;
  let incomeBreakdownAtRetirement: IncomeSourceBreakdown | null = null;

  for (let age = config.currentAge; age <= config.lifeExpectancy; age++) {
    const year = age - config.currentAge;
    const isRetired = age >= config.retirementAge;
    const portfolioValueStart = portfolioValue;
    const inflMult = Math.pow(1 + config.inflationRate / 100, year);

    // Income sources
    const socialSec = age >= config.socialSecurityStartAge ? config.socialSecurityMonthly * 12 : 0;
    const pension    = age >= config.pensionStartAge        ? config.pensionMonthly * 12        : 0;
    const other      = age < config.otherIncomeEndAge       ? config.otherIncomeMonthly * 12    : 0;

    // Healthcare
    const healthcareAnnual = age < config.medicareStartAge
      ? config.healthcareCostMonthly * 12
      : config.medicareMonthly * 12;

    const baseExpenses  = isRetired ? config.annualRetirementExpenses * inflMult : 0;
    const totalExpenses = baseExpenses + healthcareAnnual;
    const fixedIncome   = socialSec + pension + other;

    // Portfolio activity
    let portfolioWithdrawal = 0;
    let portfolioContribution = 0;

    if (isRetired) {
      const gap = Math.max(0, totalExpenses - fixedIncome);
      if (config.withdrawalStrategy === "percentage") {
        portfolioWithdrawal = portfolioValue * (config.safeWithdrawalRate / 100);
      } else {
        portfolioWithdrawal = gap;
      }
      portfolioWithdrawal = Math.min(portfolioWithdrawal, portfolioValue);
    } else {
      portfolioContribution = config.annualRetirementExpenses * 0.1;
    }

    const returnRate = isRetired
      ? config.expectedReturnDuringRetirement / 100
      : config.expectedReturnPreRetirement / 100;

    portfolioValue = (portfolioValue - portfolioWithdrawal + portfolioContribution) * (1 + returnRate);
    portfolioValue = Math.max(0, portfolioValue);

    if (portfolioValue === 0 && portfolioDepletionAge === null && isRetired) {
      portfolioDepletionAge = age;
    }

    const totalIncome   = fixedIncome + portfolioWithdrawal;
    const netCashflow   = totalIncome - totalExpenses;
    cumulativeWithdrawals += portfolioWithdrawal;
    totalLifetimeIncome   += totalIncome;
    totalLifetimeExpenses += totalExpenses;

    if (age === config.retirementAge && incomeBreakdownAtRetirement === null) {
      incomeBreakdownAtRetirement = {
        portfolioWithdrawals: portfolioWithdrawal,
        socialSecurity: socialSec,
        pension,
        otherIncome: other,
      };
    }

    yearlyData.push({
      age,
      year,
      portfolioValueStart,
      portfolioValueEnd: portfolioValue,
      portfolioWithdrawal,
      socialSecurityIncome: socialSec,
      pensionIncome: pension,
      otherIncome: other,
      totalIncome,
      expenses: baseExpenses,
      healthcareCosts: healthcareAnnual,
      totalExpenses,
      netCashflow,
      isRetired,
      cumulativeWithdrawals,
    });
  }

  const retirementYears = yearlyData.filter((d) => d.isRetired);
  const totalWithdrawals = retirementYears.reduce((s, d) => s + d.portfolioWithdrawal, 0);
  const avgPortfolio     = retirementYears.reduce((s, d) => s + d.portfolioValueStart, 0) / Math.max(1, retirementYears.length);
  const avgWithdrawalRate = avgPortfolio > 0 ? (totalWithdrawals / retirementYears.length / avgPortfolio) * 100 : 0;
  const estimatedLegacy  = yearlyData[yearlyData.length - 1]?.portfolioValueEnd ?? 0;
  const lastExpenses     = yearlyData[yearlyData.length - 1]?.totalExpenses ?? 0;

  const yearsPortfolioLasts = portfolioDepletionAge
    ? portfolioDepletionAge - config.retirementAge
    : config.lifeExpectancy - config.retirementAge;

  const sustainabilityScore = portfolioDepletionAge === null
    ? Math.min(100, 100 + (estimatedLegacy / config.initialPortfolioValue) * 20)
    : Math.max(0, (yearsPortfolioLasts / (config.lifeExpectancy - config.retirementAge)) * 100);

  return {
    yearlyData,
    portfolioDepletionAge,
    totalLifetimeIncome,
    totalLifetimeExpenses,
    estimatedLegacy,
    sustainabilityScore,
    incomeBreakdownAtRetirement: incomeBreakdownAtRetirement ?? {
      portfolioWithdrawals: 0,
      socialSecurity: 0,
      pension: 0,
      otherIncome: 0,
    },
    averageAnnualWithdrawalRate: avgWithdrawalRate,
    inflationAdjustedExpensesAtEnd: lastExpenses,
    yearsPortfolioLasts,
    config,
  };
}
