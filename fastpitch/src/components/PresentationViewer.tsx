import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, X, TrendingUp, Target, CheckCircle2,
  Award, Users, Building2, MapPin, Linkedin, DollarSign, Activity,
} from "lucide-react";
import type {
  DeckConfig, AdvisorData, ProspectData, SelectedGoal,
  MonteCarloConfig, RetirementDrawdownConfig,
} from "../lib/types";
import { runMonteCarloSimulation, formatCurrency, BENCHMARK_DATA, type MonteCarloResults } from "../lib/monte-carlo";
import { getDefaultMonteCarloConfig, getDefaultRetirementDrawdownConfig } from "../lib/utils";
import { RetirementDrawdownSlide } from "./RetirementDrawdownSlide";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODULE_LABELS: Record<string, string> = {
  TAX: "Tax Strategy", ESTATE: "Estate Planning", BUSINESS: "Business Owner Solutions",
  LIFE: "Life Transitions", INVESTMENT: "Investment Philosophy", PHILANTHROPY: "Philanthropic Giving",
  PRIVATE_EQUITY: "Private Equity", STOCK_PLAN: "Employee Stock Plans",
  RETIREMENT_DRAWDOWN: "Retirement Drawdown", MONTE_CARLO: "Monte Carlo Analysis",
  INSURANCE: "Risk Management", SOCIAL_SECURITY: "Social Security", DEBT_MANAGEMENT: "Debt Optimization",
};

const GOAL_TO_MODULES: Record<string, string[]> = {
  NEW_HOME: ["TAX", "DEBT_MANAGEMENT", "INVESTMENT"],
  EMERGENCY_FUND: ["INVESTMENT", "INSURANCE"],
  RETIREMENT_DATE: ["RETIREMENT_DRAWDOWN", "MONTE_CARLO", "SOCIAL_SECURITY", "INVESTMENT"],
  TAX_DEFERRED: ["TAX", "RETIREMENT_DRAWDOWN"],
  MONTHLY_BUDGET: ["DEBT_MANAGEMENT", "INVESTMENT"],
  EDUCATION_FUND: ["TAX", "INVESTMENT", "ESTATE"],
  MAJOR_PURCHASE: ["DEBT_MANAGEMENT", "INVESTMENT"],
  TRAVEL: ["RETIREMENT_DRAWDOWN", "INVESTMENT"],
  HEALTHCARE: ["INSURANCE", "RETIREMENT_DRAWDOWN", "SOCIAL_SECURITY"],
  DEBT_FREE: ["DEBT_MANAGEMENT", "TAX"],
};

const PERIGON_AWARDS = [
  { name: "USA Today Best Financial Advisory Firm", year: "2025" },
  { name: "Forbes Best-In-State Advisors", year: "2024", regions: "CA, FL, NY" },
  { name: "CEO of the Year – WealthManagement.com", year: "2024" },
  { name: "Newsweek Top Financial Firms", year: "2025" },
  { name: "Forbes Top RIA", year: "2025" },
  { name: "Barron's Top 100 RIA Firms", year: "2025" },
];

// ─── Individual Slides ────────────────────────────────────────────────────────

const TitleSlide = ({ prospect, title }: { prospect: ProspectData; title: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl">
      <div className="w-24 h-1 bg-indigo-500 mx-auto mb-10" />
      <h2 className="text-2xl font-light text-indigo-400 tracking-[0.2em] uppercase mb-6">Wealth Strategy Review</h2>
      <h1 className="text-6xl font-serif font-bold text-white mb-8 leading-tight">{title}</h1>
      <p className="text-2xl text-slate-400">Prepared for <span className="text-white font-serif italic">{prospect.fullName}</span></p>
      {prospect.company && <p className="text-lg text-slate-500 mt-2">{prospect.company}</p>}
    </motion.div>
  </div>
);

const SocialProofSlide = () => (
  <div className="h-full flex flex-col px-16 py-12 bg-slate-900">
    <div className="mb-8 border-l-4 border-indigo-500 pl-8">
      <h2 className="text-4xl font-serif font-bold text-white">Why Partner With Us</h2>
      <p className="text-lg text-slate-400 mt-2">National firm scale. Personalized service and partnership.</p>
    </div>
    <div className="grid grid-cols-5 gap-6 mb-10">
      {[
        { icon: DollarSign, value: "$10.2B", label: "Total AUM", color: "text-indigo-400" },
        { icon: Users,       value: "81",     label: "Financial Advisors", color: "text-violet-400" },
        { icon: Building2,   value: "163",    label: "Team Members", color: "text-violet-400" },
        { icon: MapPin,      value: "19",     label: "Offices Nationwide", color: "text-violet-400" },
        { icon: Award,       value: "35",     label: "CFPs & CFAs", color: "text-violet-400" },
      ].map(({ icon: Icon, value, label, color }, i) => (
        <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
          className={`${i === 0 ? "bg-indigo-500/20 border-indigo-500/30" : "bg-white/5 border-white/10"} border rounded-xl p-6 text-center`}>
          <Icon className={`h-8 w-8 ${color} mx-auto mb-3`} />
          <p className="text-4xl font-bold text-white">{value}</p>
          <p className="text-sm text-slate-400 mt-1">{label}</p>
        </motion.div>
      ))}
    </div>
    <div>
      <p className="text-sm uppercase tracking-widest text-slate-500 mb-4">Industry Recognition</p>
      <div className="grid grid-cols-3 gap-4">
        {PERIGON_AWARDS.map((award, i) => (
          <motion.div key={award.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.08 }}
            className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-lg p-4">
            <Award className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">{award.name}</p>
              <p className="text-xs text-slate-500">{award.year}{award.regions ? ` · ${award.regions}` : ""}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

const AdvisorSlide = ({ advisor }: { advisor: AdvisorData }) => (
  <div className="h-full flex px-16 py-12 bg-slate-900">
    <div className="flex-1 flex flex-col">
      <div className="mb-6 border-l-4 border-indigo-500 pl-8">
        <h2 className="text-4xl font-serif font-bold text-white">Your Wealth Advisor</h2>
        <p className="text-lg text-slate-400 mt-2">Your dedicated partner for this journey.</p>
      </div>
      <div className="flex-1 flex gap-12">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="w-64 shrink-0">
          {advisor.photoUrl ? (
            <div className="w-56 h-56 rounded-2xl overflow-hidden border-4 border-indigo-500/30 mb-6">
              <img src={advisor.photoUrl} alt={`${advisor.firstName} ${advisor.lastName}`} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-56 h-56 rounded-2xl border-4 border-indigo-500/30 mb-6 bg-indigo-500/10 flex items-center justify-center">
              <Users className="h-20 w-20 text-indigo-500/40" />
            </div>
          )}
          <h3 className="text-2xl font-serif font-bold text-white">{advisor.firstName} {advisor.lastName}</h3>
          {advisor.title && <p className="text-indigo-400 font-medium">{advisor.title}</p>}
          <p className="text-slate-400">{advisor.role}</p>
          <div className="mt-4 space-y-1">
            {advisor.email && <p className="text-sm text-slate-300">{advisor.email}</p>}
            {advisor.phone && <p className="text-sm text-slate-300">{advisor.phone}</p>}
          </div>
          {advisor.linkedInUrl && (
            <a href={advisor.linkedInUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#0077B5]/20 border border-[#0077B5]/50 rounded-lg text-[#0077B5] hover:bg-[#0077B5]/30 transition-colors">
              <Linkedin className="h-4 w-4" /><span className="text-sm">Connect on LinkedIn</span>
            </a>
          )}
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex-1 space-y-6">
          {advisor.bio && (
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">About</p>
              <p className="text-slate-300 leading-relaxed">{advisor.bio}</p>
            </div>
          )}
          {advisor.yearsExperience > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <span className="text-2xl font-bold text-indigo-400">{advisor.yearsExperience}+</span>
              <span className="text-sm text-slate-300">Years of Experience</span>
            </div>
          )}
          {advisor.accolades?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Recognition</p>
              <div className="flex flex-wrap gap-2">
                {advisor.accolades.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-sm text-amber-400">
                    <Award className="h-3 w-3" />{a}
                  </span>
                ))}
              </div>
            </div>
          )}
          {advisor.teamMembers && advisor.teamMembers.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Supporting Team</p>
              <div className="space-y-2">
                {advisor.teamMembers.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-400" />
                    <span className="text-slate-300 text-sm">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  </div>
);

const GoalsSlide = ({ goals, clientFirstName }: { goals: SelectedGoal[]; clientFirstName: string }) => (
  <div className="h-full flex flex-col px-16 py-12 bg-slate-900">
    <div className="mb-8 border-l-4 border-violet-400 pl-8">
      <h2 className="text-4xl font-serif font-bold text-white">Your Financial Vision</h2>
      <p className="text-lg text-slate-400 mt-2">What matters most to {clientFirstName}</p>
    </div>
    <div className="grid grid-cols-2 gap-6 flex-1">
      {goals.slice(0, 4).map((goal, i) => (
        <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">{goal.label}</h3>
          </div>
          {goal.smart.specific && <p className="text-slate-300 text-sm mb-2">"{goal.smart.specific}"</p>}
          {goal.smart.measurable && <p className="text-slate-400 text-xs mb-1"><span className="text-violet-400">Target: </span>{goal.smart.measurable}</p>}
          {goal.smart.timeBound && <p className="text-xs text-violet-400 mt-2">By {goal.smart.timeBound}</p>}
        </motion.div>
      ))}
    </div>
  </div>
);

const LikelihoodSlide = ({
  currentPct, projectedPct, modules, clientFirstName,
}: { currentPct: number; projectedPct: number; modules: string[]; clientFirstName: string }) => (
  <div className="h-full flex flex-col px-16 py-12 bg-slate-900">
    <div className="mb-8 border-l-4 border-indigo-500 pl-8">
      <h2 className="text-4xl font-serif font-bold text-white">Probability of Success</h2>
      <p className="text-lg text-slate-400 mt-2">How our partnership improves {clientFirstName}'s outcomes</p>
    </div>
    <div className="flex-1 grid grid-cols-2 gap-12 items-center">
      <div className="space-y-8">
        {[
          { label: "Current Trajectory", pct: currentPct, color: "#f97316", delay: 0 },
          { label: "With Strategic Planning", pct: projectedPct, color: "#22c55e", delay: 0.3 },
        ].map(({ label, pct, color, delay }) => (
          <motion.div key={label} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }} className="text-center">
            <p className="text-sm uppercase tracking-widest text-slate-400 mb-2">{label}</p>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-40 h-40 -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/10" />
                <motion.circle cx="80" cy="80" r="70" stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"
                  initial={{ strokeDasharray: "0 440" }} animate={{ strokeDasharray: `${pct * 4.4} 440` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: delay + 0.2 }} />
              </svg>
              <span className="absolute text-4xl font-bold" style={{ color }}>{pct}%</span>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-400" /> Key Focus Areas
        </h3>
        <div className="space-y-4">
          {modules.slice(0, 5).map((m, i) => (
            <motion.div key={m} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.1 }}
              className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0" />
              <span className="text-slate-300">{MODULE_LABELS[m] ?? m}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SectionSlide = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-10 bg-slate-900 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-violet-400 to-indigo-500" />
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="relative z-10 p-12 border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl max-w-3xl w-full">
      <h1 className="text-5xl font-serif font-bold text-white mb-6">{title}</h1>
      <p className="text-xl text-indigo-400/90">{subtitle}</p>
    </motion.div>
  </div>
);

const ChartSlide = ({
  title, subtitle, chartType, data, clientData, bullets,
}: {
  title: string; subtitle: string;
  chartType: "bar" | "donut" | "line";
  data: { label: string; value: number; color: string }[];
  clientData: { label: string; value: string }[];
  bullets: string[];
}) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const total    = data.reduce((a, d) => a + d.value, 0) || 1;

  return (
    <div className="h-full flex flex-col px-16 py-12 bg-slate-900">
      <div className="mb-6 border-l-4 border-indigo-500 pl-8">
        <h2 className="text-3xl font-serif font-bold text-white">{title}</h2>
        <p className="text-lg text-slate-400 mt-1">{subtitle}</p>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-10">
        {/* Chart area */}
        <div className="flex flex-col justify-center">
          {chartType === "bar" && (
            <div className="space-y-4">
              {data.map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <span className="text-sm font-medium text-white">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="h-8 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }}
                      initial={{ width: 0 }} animate={{ width: `${(item.value / maxValue) * 100}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.1 }} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {chartType === "donut" && (
            <div className="flex items-center justify-center">
              <div className="relative w-52 h-52">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" className="text-white/10" />
                  {data.map((item, i) => {
                    const pct    = (item.value / total) * 100;
                    const offset = data.slice(0, i).reduce((a, d) => a + (d.value / total) * 251.2, 0);
                    return (
                      <motion.circle key={item.label} cx="50" cy="50" r="40" fill="none" stroke={item.color}
                        strokeWidth="12" strokeDasharray={`${(pct / 100) * 251.2} 251.2`}
                        strokeDashoffset={-offset} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.2 }} />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{data.length}</p>
                    <p className="text-xs text-slate-400">Segments</p>
                  </div>
                </div>
              </div>
              <div className="ml-8 space-y-2">
                {data.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <span className="text-sm font-semibold text-white ml-auto pl-4">
                      {item.value > 1000 ? formatCurrency(item.value) : `${item.value}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {chartType === "line" && (
            <div className="flex items-end gap-1 h-40">
              {data.map((item, i) => (
                <motion.div key={item.label} className="flex-1 rounded-t-sm"
                  style={{ backgroundColor: item.color }}
                  initial={{ height: 0 }} animate={{ height: `${(item.value / maxValue) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.03 }} title={item.label} />
              ))}
            </div>
          )}
        </div>

        {/* Right: client data + bullets */}
        <div className="flex flex-col">
          {clientData.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">Your Profile</p>
              <div className="grid grid-cols-2 gap-4">
                {clientData.map((item, i) => (
                  <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="text-lg font-semibold text-white">{item.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-3">
            {bullets.map((bullet, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.1 }}
                className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-slate-300">{bullet}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MonteCarloChartSlide = ({ results, clientFirstName }: { results: MonteCarloResults; clientFirstName: string }) => {
  const { yearlyResults, probabilityOfSuccess, finalValuePercentiles, benchmarkProjections, config } = results;

  const W = 700, H = 280, pad = { t: 30, r: 30, b: 40, l: 70 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;

  const maxVal = Math.max(
    ...yearlyResults.map((r) => r.percentiles.p90),
    ...benchmarkProjections.sp500, ...benchmarkProjections.russell5000,
  ) * 1.1;

  const xS = (yr: number) => pad.l + (yr / config.timeHorizonYears) * iW;
  const yS = (v: number)  => pad.t + iH - (v / maxVal) * iH;

  const path = (data: number[]) => data.map((v, i) => `${i === 0 ? "M" : "L"} ${xS(i)} ${yS(v)}`).join(" ");
  const area = (top: number[], bot: number[]) =>
    `${path(top)} ${[...bot].reverse().map((v, i) => `L ${xS(bot.length - 1 - i)} ${yS(v)}`).join(" ")} Z`;

  const p90 = yearlyResults.map((r) => r.percentiles.p90);
  const p75 = yearlyResults.map((r) => r.percentiles.p75);
  const p50 = yearlyResults.map((r) => r.percentiles.p50);
  const p25 = yearlyResults.map((r) => r.percentiles.p25);
  const p10 = yearlyResults.map((r) => r.percentiles.p10);

  const successColor = probabilityOfSuccess >= 90 ? "#22c55e" : probabilityOfSuccess >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div className="h-full flex flex-col px-12 py-10 bg-slate-900">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="border-l-4 border-indigo-500 pl-6">
            <h2 className="text-3xl font-serif font-bold text-white">Monte Carlo Simulation Results</h2>
            <p className="text-slate-400 mt-1">{config.numSimulations.toLocaleString()} simulations over {config.timeHorizonYears} years for {clientFirstName}</p>
          </div>
          <div className="text-center px-6 py-3 rounded-xl border-2" style={{ borderColor: successColor, backgroundColor: `${successColor}15` }}>
            <p className="text-sm text-slate-400">Probability of Success</p>
            <p className="text-4xl font-bold" style={{ color: successColor }}>{probabilityOfSuccess.toFixed(0)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* SVG Chart */}
          <div className="col-span-2 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" /> Portfolio Projection with Confidence Intervals
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500/30 inline-block" /> 10-90th %ile</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500/60 inline-block" /> 25-75th %ile</span>
                <span className="flex items-center gap-1"><span className="w-3 h-1 bg-amber-500 inline-block" /> Median</span>
              </div>
            </div>
            <svg width={W} height={H} className="mx-auto">
              <defs>
                <linearGradient id="cg" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <g key={i}>
                  <line x1={pad.l} y1={pad.t + iH * pct} x2={W - pad.r} y2={pad.t + iH * pct} stroke="#334155" strokeDasharray="4" />
                  <text x={pad.l - 8} y={pad.t + iH * pct + 4} textAnchor="end" fill="#94a3b8" fontSize="10">
                    {formatCurrency(maxVal * (1 - pct))}
                  </text>
                </g>
              ))}
              <path d={area(p90, p10)} fill="url(#cg)" />
              <path d={area(p75, p25)} fill="#f59e0b" fillOpacity="0.25" />
              <path d={path(p50)} stroke="#f59e0b" strokeWidth="2.5" fill="none" />
              <path d={path(benchmarkProjections.sp500)} stroke={BENCHMARK_DATA.SP500.color} strokeWidth="1.5" fill="none" strokeDasharray="6 3" />
              <path d={path(benchmarkProjections.bond)} stroke={BENCHMARK_DATA.BOND.color} strokeWidth="1.5" fill="none" strokeDasharray="6 3" />
              <path d={path(benchmarkProjections.russell5000)} stroke={BENCHMARK_DATA.RUSSELL5000.color} strokeWidth="1.5" fill="none" strokeDasharray="6 3" />
              {config.withdrawalStartYear > 0 && config.withdrawalStartYear <= config.timeHorizonYears && (
                <g>
                  <line x1={xS(config.withdrawalStartYear)} y1={pad.t} x2={xS(config.withdrawalStartYear)} y2={pad.t + iH} stroke="#ef4444" strokeDasharray="4" />
                  <text x={xS(config.withdrawalStartYear)} y={pad.t - 8} textAnchor="middle" fill="#f87171" fontSize="10">Retirement</text>
                </g>
              )}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <text key={i} x={xS(config.timeHorizonYears * pct)} y={H - 8} textAnchor="middle" fill="#94a3b8" fontSize="10">
                  Yr {Math.round(config.timeHorizonYears * pct)}
                </text>
              ))}
            </svg>
          </div>

          {/* Side panels */}
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3">Final Value Scenarios</h3>
              <div className="space-y-2">
                {[
                  { label: "Best Case (90th)", value: finalValuePercentiles.p90, color: "#22c55e" },
                  { label: "Good (75th)",       value: finalValuePercentiles.p75, color: "#84cc16" },
                  { label: "Median (50th)",     value: finalValuePercentiles.p50, color: "#f59e0b" },
                  { label: "Cautious (25th)",   value: finalValuePercentiles.p25, color: "#f97316" },
                  { label: "Stress (10th)",     value: finalValuePercentiles.p10, color: "#ef4444" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">{item.label}</span>
                    <span className="text-sm font-semibold" style={{ color: item.color }}>{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3">Benchmark Comparison</h3>
              {[
                { name: BENCHMARK_DATA.SP500.name,       val: benchmarkProjections.sp500.at(-1)!,       color: BENCHMARK_DATA.SP500.color },
                { name: BENCHMARK_DATA.BOND.name,        val: benchmarkProjections.bond.at(-1)!,        color: BENCHMARK_DATA.BOND.color },
                { name: BENCHMARK_DATA.RUSSELL5000.name, val: benchmarkProjections.russell5000.at(-1)!, color: BENCHMARK_DATA.RUSSELL5000.color },
              ].map((b) => (
                <div key={b.name} className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="text-xs text-slate-400">{b.name}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: b.color }}>{formatCurrency(b.val)}</span>
                </div>
              ))}
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3">Parameters</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ["Initial", formatCurrency(config.initialPortfolioValue)],
                  ["Annual Add", formatCurrency(config.annualContribution)],
                  ["Withdrawal", `${formatCurrency(config.annualWithdrawal)}/yr`],
                  ["Allocation", `${config.stockAllocation}/${config.bondAllocation}/${config.alternativeAllocation}%`],
                ].map(([k, v]) => (
                  <><span key={k} className="text-slate-500">{k}</span><span className="text-white text-right">{v}</span></>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const TieBackSlide = ({ goal, relatedModules }: { goal: SelectedGoal; relatedModules: string[] }) => (
  <div className="h-full flex flex-col px-16 py-12 bg-slate-900">
    <div className="mb-8 border-l-4 border-violet-400 pl-8">
      <h2 className="text-4xl font-serif font-bold text-white">Connecting Strategy to Your Goals</h2>
    </div>
    <div className="flex-1 grid grid-cols-2 gap-12 items-center">
      <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
        className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/30 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Target className="h-8 w-8 text-indigo-400" />
          <h3 className="text-2xl font-serif font-bold text-white">{goal.label}</h3>
        </div>
        {goal.smart.specific  && <p className="text-lg text-slate-200 mb-4">"{goal.smart.specific}"</p>}
        {goal.smart.measurable && <p className="text-sm text-slate-400 mb-2"><span className="text-violet-400">Measure: </span>{goal.smart.measurable}</p>}
        {goal.smart.timeBound  && <span className="inline-block bg-violet-500/20 text-violet-400 px-3 py-1 rounded-full text-sm">By {goal.smart.timeBound}</span>}
      </motion.div>
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-widest text-slate-500">How We Help You Get There</p>
        {relatedModules.map((m, i) => (
          <motion.div key={m} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
            className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="font-medium text-white">{MODULE_LABELS[m] ?? m}</p>
              <p className="text-xs text-slate-500">Directly supports this goal</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

const NextStepsSlide = ({ prospect, advisor }: { prospect: ProspectData; advisor: AdvisorData | null }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
      <div className="w-24 h-1 bg-indigo-500 mx-auto mb-10" />
      <h1 className="text-5xl font-serif font-bold text-white mb-6">Let's Begin Your Next Chapter</h1>
      <p className="text-xl text-slate-300 mb-10">
        We work with clients navigating complexity, transition, and legacy.
        If you're looking for a long-term partner who understands how wealth intersects with life,
        we welcome a confidential conversation.
      </p>
      {advisor && (
        <div className="inline-flex items-center gap-4 px-8 py-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl">
          <div className="text-left">
            <p className="font-semibold text-white">{advisor.firstName} {advisor.lastName}{advisor.title ? `, ${advisor.title}` : ""}</p>
            {advisor.phone && <p className="text-indigo-400">{advisor.phone}</p>}
            {advisor.email && <p className="text-sm text-slate-400">{advisor.email}</p>}
          </div>
        </div>
      )}
    </motion.div>
  </div>
);

// ─── Chart data generators (per module) ──────────────────────────────────────

function getModuleChartData(moduleId: string, prospect: ProspectData) {
  const nw = prospect.netWorth || 1_000_000;
  const inv = prospect.investableAssets || 500_000;
  const age = prospect.age || 45;
  const retAge = prospect.retirementAge || 65;
  const ytr = Math.max(1, retAge - age);

  switch (moduleId) {
    case "TAX": return {
      chartType: "bar" as const,
      data: [
        { label: "Current Tax Burden",   value: Math.round(nw * 0.28), color: "#f97316" },
        { label: "Optimized Projection", value: Math.round(nw * 0.22), color: "#22c55e" },
        { label: "Potential Savings",    value: Math.round(nw * 0.06), color: "#3b82f6" },
      ],
      clientData: [
        { label: "Net Worth",   value: formatCurrency(nw) },
        { label: "Tax Bracket", value: prospect.riskTolerance === "Aggressive" ? "37%" : "32%" },
      ],
      bullets: [
        "Tax-loss harvesting opportunities identified",
        "Roth conversion analysis for lower lifetime taxes",
        "Charitable giving strategies for deduction optimization",
        "Asset location optimization across accounts",
      ],
    };
    case "ESTATE": return {
      chartType: "donut" as const,
      data: [
        { label: "To Heirs",        value: Math.round(nw * 1.2 * 0.65), color: "#3b82f6" },
        { label: "To Charity",      value: Math.round(nw * 1.2 * 0.15), color: "#22c55e" },
        { label: "Estate Taxes",    value: Math.round(nw * 1.2 * 0.12), color: "#f97316" },
        { label: "Fees & Expenses", value: Math.round(nw * 1.2 * 0.08), color: "#6b7280" },
      ],
      clientData: [
        { label: "Projected Estate", value: formatCurrency(nw * 1.2) },
        { label: "Marital Status",   value: prospect.maritalStatus ?? "Single" },
      ],
      bullets: [
        "Trust structure review and optimization",
        "Beneficiary designation audit",
        "Gifting strategies to reduce estate size",
        "Estate tax mitigation planning",
      ],
    };
    case "INVESTMENT": return {
      chartType: "donut" as const,
      data: [
        { label: "Equities",       value: prospect.riskTolerance === "Aggressive" ? 70 : prospect.riskTolerance === "Moderate" ? 60 : 40, color: "#3b82f6" },
        { label: "Fixed Income",   value: prospect.riskTolerance === "Aggressive" ? 15 : prospect.riskTolerance === "Moderate" ? 25 : 40, color: "#22c55e" },
        { label: "Alternatives",   value: 10, color: "#a855f7" },
        { label: "Cash",           value: 5,  color: "#6b7280" },
      ],
      clientData: [
        { label: "Investable Assets", value: formatCurrency(inv) },
        { label: "Risk Profile",      value: prospect.riskTolerance ?? "Moderate" },
      ],
      bullets: [
        "Evidence-based, factor-driven portfolio construction",
        "Diversification across asset classes and geographies",
        "Dynamic rebalancing discipline",
        "Behavioral coaching to avoid costly mistakes",
      ],
    };
    case "INSURANCE": return {
      chartType: "bar" as const,
      data: [
        { label: "Life Insurance Need", value: Math.round(nw * 0.5), color: "#3b82f6" },
        { label: "Disability Coverage", value: Math.round(nw * 0.15), color: "#22c55e" },
        { label: "LTC Coverage",        value: Math.round(nw * 0.2),  color: "#a855f7" },
      ],
      clientData: [
        { label: "Current Age",    value: `${age}` },
        { label: "Family Status",  value: prospect.maritalStatus ?? "Single" },
      ],
      bullets: [
        "Life insurance needs assessment completed",
        "Disability income protection gap review",
        "Long-term care planning options",
        "Umbrella liability coverage analysis",
      ],
    };
    default: return {
      chartType: "bar" as const,
      data: [
        { label: "Current State", value: 60, color: "#f97316" },
        { label: "Target State",  value: 90, color: "#22c55e" },
      ],
      clientData: [] as { label: string; value: string }[],
      bullets: [
        "Comprehensive analysis of your current situation",
        "Customized recommendations tailored to your goals",
        "Clear implementation roadmap",
        "Ongoing monitoring and adjustments",
      ],
    };
  }
}

// ─── Main Viewer ──────────────────────────────────────────────────────────────

export function PresentationViewer({ config }: { config: DeckConfig }) {
  const { prospect, advisor, selectedModules, selectedGoals, title } = config;
  const [currentSlide, setCurrentSlide] = useState(0);

  // Build slides array
  const slides = (() => {
    const out: { type: string; props: Record<string, unknown> }[] = [];

    const addCurrentLikelihood = () => {
      const base = 55 + (prospect.riskTolerance === "Conservative" ? 5 : prospect.riskTolerance === "Moderate" ? 3 : 0);
      return Math.min(75, Math.round(base + ((prospect.investableAssets ?? 0) / (prospect.netWorth ?? 1)) * 10));
    };
    const projected = Math.min(95, addCurrentLikelihood() + selectedModules.length * 3 + selectedGoals.length * 2 + 8);

    out.push({ type: "TITLE",        props: { prospect, title } });
    out.push({ type: "SOCIAL_PROOF", props: {} });
    if (advisor) out.push({ type: "ADVISOR", props: { advisor } });
    if (selectedGoals.length > 0) {
      out.push({ type: "GOALS",      props: { goals: selectedGoals, clientFirstName: prospect.firstName } });
      out.push({ type: "LIKELIHOOD", props: { currentPct: addCurrentLikelihood(), projectedPct: projected, modules: selectedModules, clientFirstName: prospect.firstName } });
    }

    selectedModules.forEach((moduleId) => {
      const label  = MODULE_LABELS[moduleId] ?? moduleId;
      const relGoals = selectedGoals.filter((g) => GOAL_TO_MODULES[g.id]?.includes(moduleId)).map((g) => g.label).join(", ");
      out.push({ type: "SECTION", props: { title: label, subtitle: relGoals ? `Supporting your goal: ${relGoals}` : `Comprehensive ${label.toLowerCase()} analysis.` } });

      if (moduleId === "MONTE_CARLO") {
        const mcConfig = config.monteCarloConfig ?? getDefaultMonteCarloConfig(prospect);
        const results  = runMonteCarloSimulation(mcConfig);
        out.push({ type: "MONTE_CARLO", props: { results, clientFirstName: prospect.firstName } });
      } else if (moduleId === "RETIREMENT_DRAWDOWN") {
        const ddConfig = config.retirementDrawdownConfig ?? getDefaultRetirementDrawdownConfig(prospect);
        out.push({ type: "RETIREMENT_DRAWDOWN", props: { config: ddConfig, clientName: prospect.fullName } });
      } else {
        const chartData = getModuleChartData(moduleId, prospect);
        out.push({ type: "CHART", props: { title: `${label} Analysis`, subtitle: `Personalized insights for ${prospect.firstName}`, ...chartData } });
      }
    });

    if (selectedGoals.length > 0) {
      const primary  = selectedGoals[0];
      const related  = selectedModules.filter((m) => GOAL_TO_MODULES[primary.id]?.includes(m));
      if (related.length > 0) out.push({ type: "TIEBACK", props: { goal: primary, relatedModules: related } });
    }

    out.push({ type: "NEXT_STEPS", props: { prospect, advisor } });
    return out;
  })();

  const next = useCallback(() => setCurrentSlide((c) => Math.min(c + 1, slides.length - 1)), [slides.length]);
  const prev = useCallback(() => setCurrentSlide((c) => Math.max(c - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const renderSlide = () => {
    const slide = slides[currentSlide];
    if (!slide) return null;
    const p = slide.props as any;
    switch (slide.type) {
      case "TITLE":               return <TitleSlide {...p} />;
      case "SOCIAL_PROOF":        return <SocialProofSlide />;
      case "ADVISOR":             return <AdvisorSlide {...p} />;
      case "GOALS":               return <GoalsSlide {...p} />;
      case "LIKELIHOOD":          return <LikelihoodSlide {...p} />;
      case "SECTION":             return <SectionSlide {...p} />;
      case "CHART":               return <ChartSlide {...p} />;
      case "MONTE_CARLO":         return <MonteCarloChartSlide {...p} />;
      case "RETIREMENT_DRAWDOWN": return <RetirementDrawdownSlide {...p} />;
      case "TIEBACK":             return <TieBackSlide {...p} />;
      case "NEXT_STEPS":          return <NextStepsSlide {...p} />;
      default: return null;
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-900 text-white overflow-hidden relative">
      {/* Controls overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <button onClick={() => window.close()} className="flex items-center gap-2 text-white/50 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
          <X className="h-5 w-5" /> Close
        </button>
        <span className="text-white/30 font-mono text-sm">{currentSlide + 1} / {slides.length}</span>
      </div>

      {/* Slide */}
      <AnimatePresence mode="wait">
        <motion.div key={currentSlide} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.35, ease: "easeInOut" }} className="h-full w-full">
          {renderSlide()}
        </motion.div>
      </AnimatePresence>

      {/* Left arrow */}
      <div className="absolute inset-y-0 left-0 w-20 z-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group" onClick={prev}>
        <div className="p-3 rounded-full bg-white/10 backdrop-blur-md group-hover:bg-white/20">
          <ChevronLeft className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Right arrow */}
      <div className="absolute inset-y-0 right-0 w-20 z-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group" onClick={next}>
        <div className="p-3 rounded-full bg-white/10 backdrop-blur-md group-hover:bg-white/20">
          <ChevronRight className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-300"
        style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }} />
    </div>
  );
}
