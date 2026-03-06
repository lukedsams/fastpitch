import type { MonteCarloConfig } from "./types";
import { formatCurrency } from "./utils";

export { formatCurrency };

const BENCHMARK_DATA = {
  SP500:       { name: "S&P 500",            annualReturn: 0.1020, volatility: 0.155, color: "#22c55e" },
  BOND:        { name: "US Aggregate Bond",  annualReturn: 0.042,  volatility: 0.035, color: "#3b82f6" },
  RUSSELL5000: { name: "Russell 5000",       annualReturn: 0.098,  volatility: 0.165, color: "#a855f7" },
} as const;

export { BENCHMARK_DATA };

export interface SimulationResult {
  year: number;
  portfolioValues: number[];
  percentiles: { p10: number; p25: number; p50: number; p75: number; p90: number };
  mean: number;
}

export interface MonteCarloResults {
  simulationPaths: number[][];
  yearlyResults: SimulationResult[];
  probabilityOfSuccess: number;
  finalValuePercentiles: { p10: number; p25: number; p50: number; p75: number; p90: number };
  finalValueMean: number;
  benchmarkProjections: { sp500: number[]; bond: number[]; russell5000: number[] };
  config: MonteCarloConfig;
}

function boxMullerTransform(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function calculatePortfolioParameters(config: MonteCarloConfig): { expectedReturn: number; volatility: number } {
  const sw = config.stockAllocation / 100;
  const bw = config.bondAllocation / 100;
  const aw = config.alternativeAllocation / 100;

  const sr = BENCHMARK_DATA.SP500.annualReturn;
  const sv = BENCHMARK_DATA.SP500.volatility;
  const br = BENCHMARK_DATA.BOND.annualReturn;
  const bv = BENCHMARK_DATA.BOND.volatility;
  const ar = (BENCHMARK_DATA.SP500.annualReturn + BENCHMARK_DATA.RUSSELL5000.annualReturn) / 2;
  const av = (BENCHMARK_DATA.SP500.volatility + BENCHMARK_DATA.RUSSELL5000.volatility) / 2;

  const expectedReturn = sw * sr + bw * br + aw * ar;
  const correlation = 0.3;
  const crossTerms =
    2 * sw * bw * sv * bv * correlation +
    2 * sw * aw * sv * av * 0.7 +
    2 * bw * aw * bv * av * 0.2;
  const volatility = Math.sqrt(
    Math.pow(sw * sv, 2) + Math.pow(bw * bv, 2) + Math.pow(aw * av, 2) + crossTerms
  );

  return { expectedReturn, volatility };
}

function simulatePath(config: MonteCarloConfig, expectedReturn: number, volatility: number): number[] {
  const path: number[] = [config.initialPortfolioValue];
  let current = config.initialPortfolioValue;
  for (let year = 1; year <= config.timeHorizonYears; year++) {
    const randomReturn = expectedReturn + volatility * boxMullerTransform();
    current *= 1 + randomReturn;
    if (year < config.withdrawalStartYear) {
      current += config.annualContribution * Math.pow(1 + config.inflationRate / 100, year);
    } else {
      current -= config.annualWithdrawal * Math.pow(1 + config.inflationRate / 100, year);
    }
    current = Math.max(0, current);
    path.push(current);
  }
  return path;
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function projectBenchmark(config: MonteCarloConfig, annualReturn: number): number[] {
  const path: number[] = [config.initialPortfolioValue];
  let v = config.initialPortfolioValue;
  for (let y = 1; y <= config.timeHorizonYears; y++) {
    v *= 1 + annualReturn;
    if (y < config.withdrawalStartYear) {
      v += config.annualContribution;
    } else {
      v -= config.annualWithdrawal;
    }
    v = Math.max(0, v);
    path.push(v);
  }
  return path;
}

export function runMonteCarloSimulation(config: MonteCarloConfig): MonteCarloResults {
  const { expectedReturn, volatility } = calculatePortfolioParameters(config);
  const paths: number[][] = [];
  for (let i = 0; i < config.numSimulations; i++) {
    paths.push(simulatePath(config, expectedReturn, volatility));
  }

  const yearlyResults: SimulationResult[] = [];
  for (let year = 0; year <= config.timeHorizonYears; year++) {
    const vals = paths.map((p) => p[year]).sort((a, b) => a - b);
    yearlyResults.push({
      year,
      portfolioValues: vals,
      percentiles: {
        p10: percentile(vals, 10),
        p25: percentile(vals, 25),
        p50: percentile(vals, 50),
        p75: percentile(vals, 75),
        p90: percentile(vals, 90),
      },
      mean: vals.reduce((a, b) => a + b, 0) / vals.length,
    });
  }

  const finalVals = paths.map((p) => p[config.timeHorizonYears]).sort((a, b) => a - b);
  const successCount = finalVals.filter((v) => v >= config.targetEndValue).length;

  return {
    simulationPaths: paths,
    yearlyResults,
    probabilityOfSuccess: (successCount / config.numSimulations) * 100,
    finalValuePercentiles: {
      p10: percentile(finalVals, 10),
      p25: percentile(finalVals, 25),
      p50: percentile(finalVals, 50),
      p75: percentile(finalVals, 75),
      p90: percentile(finalVals, 90),
    },
    finalValueMean: finalVals.reduce((a, b) => a + b, 0) / finalVals.length,
    benchmarkProjections: {
      sp500:       projectBenchmark(config, BENCHMARK_DATA.SP500.annualReturn),
      bond:        projectBenchmark(config, BENCHMARK_DATA.BOND.annualReturn),
      russell5000: projectBenchmark(config, BENCHMARK_DATA.RUSSELL5000.annualReturn),
    },
    config,
  };
}
