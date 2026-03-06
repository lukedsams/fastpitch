import { motion } from "framer-motion";
import {
  AlertCircle, CheckCircle2, PieChart, DollarSign,
  Calendar, ShieldCheck, Zap, Wallet, Building2, Briefcase,
} from "lucide-react";
import { runRetirementDrawdownAnalysis, formatCurrency } from "../lib/retirement-drawdown";
import type { RetirementDrawdownConfig } from "../lib/types";

interface Props {
  config: RetirementDrawdownConfig;
  clientName: string;
}

export function RetirementDrawdownSlide({ config, clientName }: Props) {
  const results        = runRetirementDrawdownAnalysis(config);
  const { yearlyData, sustainabilityScore, yearsPortfolioLasts, portfolioDepletionAge, totalLifetimeIncome } = results;
  const isSustainable  = sustainabilityScore >= 100;
  const avgAnnualIncome = yearlyData.length > 0
    ? yearlyData.reduce((a, p) => a + p.totalIncome, 0) / yearlyData.length
    : 0;
  const peakPortfolio   = Math.max(...yearlyData.map((p) => p.portfolioValueStart), 1);
  const incomeBreakdown = results.incomeBreakdownAtRetirement;
  const totalIncomeAtRetirement = Object.values(incomeBreakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="h-full flex flex-col px-16 py-12 bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="mb-8 border-l-4 border-amber-500 pl-8 flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-serif font-bold text-white">Retirement Income Strategy</h2>
          <p className="text-lg text-slate-400 mt-2">Sustainable withdrawal analysis for {clientName}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl border flex flex-col items-center min-w-[140px] ${isSustainable ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"}`}>
          <span className="text-xs uppercase tracking-widest text-slate-400 mb-1">Sustainability</span>
          <span className={`text-3xl font-bold ${isSustainable ? "text-emerald-400" : "text-amber-400"}`}>
            {Math.round(sustainabilityScore)}%
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-10">
        {/* Left: Metrics */}
        <div className="col-span-4 space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <PieChart className="h-4 w-4 text-blue-400" /> Income Breakdown at Retirement
            </h3>
            <div className="space-y-3">
              {[
                { label: "Portfolio", value: incomeBreakdown.portfolioWithdrawals, color: "bg-blue-500",   icon: Wallet },
                { label: "Social Security", value: incomeBreakdown.socialSecurity,  color: "bg-amber-500", icon: Building2 },
                { label: "Pension",         value: incomeBreakdown.pension,          color: "bg-emerald-500", icon: Briefcase },
                { label: "Other Income",    value: incomeBreakdown.otherIncome,      color: "bg-purple-500",  icon: DollarSign },
              ].filter((i) => i.value > 0).map((item, i) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5"><item.icon className="w-3 h-3" />{item.label}</span>
                    <span className="text-white font-medium">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / totalIncomeAtRetirement) * 100}%` }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className={`h-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" /> Strategy Detail
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Withdrawal</p>
                <p className="text-sm font-semibold text-white capitalize">{config.withdrawalStrategy}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Avg. Annual Income</p>
                <p className="text-sm font-bold text-amber-400">{formatCurrency(avgAnnualIncome)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <Calendar className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-white">Planning Horizon</p>
                <p className="text-[10px] text-slate-400">Age {config.retirementAge} → {config.lifeExpectancy}</p>
              </div>
            </div>
            {isSustainable ? (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-emerald-400/90 leading-tight">Portfolio sustains through full life expectancy.</p>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-400/90 leading-tight">Potential shortfall near age {portfolioDepletionAge}.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Bar chart visualization */}
        <div className="col-span-8 flex flex-col">
          <div className="flex-1 relative bg-white/5 border border-white/10 rounded-2xl p-6 mb-4 overflow-hidden">
            <div className="absolute top-4 right-6 flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs text-slate-400">Portfolio Value</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-slate-400">Annual Income</span>
              </div>
            </div>

            <div className="h-full w-full flex items-end gap-px pt-10">
              {yearlyData
                .filter((_, i) => i % (yearlyData.length > 40 ? 2 : 1) === 0)
                .map((p, i) => {
                  const heightPct   = (p.portfolioValueEnd / peakPortfolio) * 100;
                  const incomePct   = (p.totalIncome / (avgAnnualIncome * 2)) * 100;
                  return (
                    <div key={p.age} className="flex-1 flex flex-col justify-end items-center relative h-full">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.min(heightPct, 100)}%` }}
                        transition={{ delay: i * 0.015, duration: 0.6 }}
                        className={`w-full rounded-t-sm ${p.portfolioValueEnd <= 0 ? "bg-red-500/40" : "bg-amber-500/40 hover:bg-amber-500/60"} transition-colors`}
                      />
                      <motion.div
                        initial={{ bottom: "0%" }}
                        animate={{ bottom: `${Math.min(incomePct, 100)}%` }}
                        className="absolute w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.7)] z-10"
                      />
                      {p.age % 5 === 0 && (
                        <span className="absolute -bottom-5 text-[9px] text-slate-500 whitespace-nowrap">
                          {p.age}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Expected Return</p>
              <p className="text-lg font-bold text-white">
                {config.expectedReturnDuringRetirement}%{" "}
                <span className="text-xs font-normal text-slate-400">in retirement</span>
              </p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Inflation</p>
              <p className="text-lg font-bold text-white">{config.inflationRate}%</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Legacy Goal</p>
              <p className="text-lg font-bold text-white">{formatCurrency(config.legacyGoal)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
