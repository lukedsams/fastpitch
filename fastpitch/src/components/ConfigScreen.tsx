import { useState, useMemo } from "react";
import type {
  ProspectData,
  DeckConfig,
  ModuleId,
  MonteCarloConfig,
  RetirementDrawdownConfig,
} from "../lib/types";
import { ADVISOR_PROFILE } from "../lib/advisorProfile";

// ─── Module Catalog ────────────────────────────────────────────────────────────

interface ModuleMeta {
  id: ModuleId;
  label: string;
  description: string;
  icon: string;
  category: "core" | "planning" | "advanced";
}

const ALL_MODULES: ModuleMeta[] = [
  { id: "INVESTMENT",           label: "Investment Strategy",     icon: "📈", description: "Portfolio allocation, performance, and manager selection",         category: "core" },
  { id: "MONTE_CARLO",          label: "Monte Carlo Simulation",  icon: "🎲", description: "Probability-based projection of portfolio outcomes over time",      category: "core" },
  { id: "RETIREMENT_DRAWDOWN",  label: "Retirement Income Plan",  icon: "🏖️", description: "Sustainable withdrawal strategies and income sequencing",           category: "core" },
  { id: "TAX",                  label: "Tax Planning",            icon: "🧾", description: "Tax-loss harvesting, Roth conversions, and bracket management",     category: "planning" },
  { id: "ESTATE",               label: "Estate Planning",         icon: "🏛️", description: "Wealth transfer strategies, trusts, and beneficiary optimization",  category: "planning" },
  { id: "SOCIAL_SECURITY",      label: "Social Security",         icon: "🔐", description: "Optimal claiming strategy and spousal coordination",                category: "planning" },
  { id: "INSURANCE",            label: "Insurance Review",        icon: "🛡️", description: "Life, disability, and long-term care coverage analysis",            category: "planning" },
  { id: "BUSINESS",             label: "Business Succession",     icon: "🏢", description: "Exit planning, valuation, and ownership transition strategies",     category: "advanced" },
  { id: "PHILANTHROPY",         label: "Charitable Giving",       icon: "🤝", description: "DAFs, charitable trusts, and impact-driven giving strategies",      category: "advanced" },
  { id: "PRIVATE_EQUITY",       label: "Private Equity",          icon: "🔒", description: "Alternative investment exposure, co-investments, and liquidity",    category: "advanced" },
  { id: "STOCK_PLAN",           label: "Stock Option Planning",   icon: "💎", description: "RSU vesting, ISO/NSO exercise strategies, and concentration risk", category: "advanced" },
  { id: "LIFE",                 label: "Life Insurance",          icon: "💙", description: "Coverage gap analysis and permanent life strategies",               category: "planning" },
  { id: "DEBT_MANAGEMENT",      label: "Debt Management",         icon: "⚖️", description: "Mortgage, HELOC, and debt payoff optimization",                    category: "advanced" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function fmtYears(n: number): string {
  return `${n} yrs`;
}

function buildDefaultMonteCarloConfig(p: ProspectData, retirementAge: number): MonteCarloConfig {
  const currentAge   = p.age ?? 55;
  const assets       = p.investableAssets ?? 1_000_000;
  const risk         = p.riskTolerance ?? "Moderate";
  const yearsToRetire = Math.max(retirementAge - currentAge, 1);

  const stockAlloc = risk === "Aggressive" ? 80 : risk === "Moderate" ? 65 : 45;
  const bondAlloc  = risk === "Aggressive" ? 15 : risk === "Moderate" ? 30 : 50;
  const altAlloc   = 100 - stockAlloc - bondAlloc;

  return {
    initialPortfolioValue: assets,
    annualContribution:    Math.round(assets * 0.02),
    timeHorizonYears:      yearsToRetire + 25,
    targetEndValue:        assets,
    annualWithdrawal:      Math.round(assets * 0.04),
    withdrawalStartYear:   yearsToRetire,
    inflationRate:         0.025,
    stockAllocation:       stockAlloc,
    bondAllocation:        bondAlloc,
    alternativeAllocation: altAlloc,
    numSimulations:        1000,
    confidenceLevel:       0.90,
  };
}

function buildDefaultRetirementConfig(p: ProspectData, retirementAge: number): RetirementDrawdownConfig {
  const currentAge  = p.age ?? 55;
  const assets      = p.investableAssets ?? 1_000_000;
  const risk        = p.riskTolerance ?? "Moderate";
  const returnPre   = risk === "Aggressive" ? 0.08 : risk === "Moderate" ? 0.07 : 0.055;
  const returnPost  = returnPre - 0.01;

  return {
    currentAge,
    retirementAge,
    lifeExpectancy:                  90,
    initialPortfolioValue:           assets,
    annualRetirementExpenses:        Math.round(assets * 0.04),
    inflationRate:                   0.025,
    expectedReturnPreRetirement:     returnPre,
    expectedReturnDuringRetirement:  returnPost,
    socialSecurityMonthly:           2_500,
    socialSecurityStartAge:          67,
    pensionMonthly:                  0,
    pensionStartAge:                 65,
    otherIncomeMonthly:              0,
    otherIncomeEndAge:               75,
    healthcareCostMonthly:           800,
    medicareStartAge:                65,
    medicareMonthly:                 500,
    legacyGoal:                      assets * 0.5,
    withdrawalStrategy:              "guardrails",
    safeWithdrawalRate:              0.04,
  };
}

// ─── Slider Component ──────────────────────────────────────────────────────────

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: (n: number) => string;
  onChange: (n: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "13px", color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
        <span style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
          {display(value)}
        </span>
      </div>
      <div style={{ position: "relative" }}>
        <div style={{
          height: "4px",
          background: "#1e293b",
          borderRadius: "2px",
          overflow: "visible",
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "4px",
            width: `${pct}%`,
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            borderRadius: "2px",
            transition: "width 0.1s",
          }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute",
            top: "-8px",
            left: 0,
            width: "100%",
            height: "20px",
            opacity: 0,
            cursor: "pointer",
          }}
        />
      </div>
    </div>
  );
}

// ─── Main ConfigScreen ─────────────────────────────────────────────────────────

interface Props {
  prospect: ProspectData;
  onGenerate: (config: DeckConfig) => void;
}

export function ConfigScreen({ prospect, onGenerate }: Props) {
  const defaultRetirementAge = prospect.retirementAge ?? 65;
  const defaultAssets        = prospect.investableAssets ?? 1_000_000;
  const defaultAge           = prospect.age ?? 55;

  const [selectedModules, setSelectedModules] = useState<Set<ModuleId>>(new Set());
  const [activePanel, setActivePanel]         = useState<ModuleId | null>(null);

  // Shared financial variables
  const [investableAssets, setInvestableAssets] = useState(defaultAssets);
  const [currentAge,       setCurrentAge]        = useState(defaultAge);
  const [retirementAge,    setRetirementAge]      = useState(defaultRetirementAge);
  const [riskTolerance,    setRiskTolerance]      = useState<"Conservative"|"Moderate"|"Aggressive">(
    prospect.riskTolerance ?? "Moderate"
  );

  // Monte Carlo overrides
  const [annualContrib,    setAnnualContrib]    = useState(Math.round(defaultAssets * 0.02));
  const [timeHorizon,      setTimeHorizon]      = useState(Math.max(defaultRetirementAge - defaultAge, 1) + 25);

  // Retirement Drawdown overrides
  const [annualExpenses,   setAnnualExpenses]   = useState(Math.round(defaultAssets * 0.04));
  const [ssMonthly,        setSsMonthly]        = useState(2500);
  const [lifeExpectancy,   setLifeExpectancy]   = useState(90);
  const [legacyGoal,       setLegacyGoal]       = useState(Math.round(defaultAssets * 0.5));

  const toggleModule = (id: ModuleId) => {
    const next = new Set(selectedModules);
    if (next.has(id)) {
      next.delete(id);
      if (activePanel === id) setActivePanel(null);
    } else {
      next.add(id);
      setActivePanel(id);
    }
    setSelectedModules(next);
  };

  const canGenerate = selectedModules.size > 0;

  const handleGenerate = () => {
    const mcConfig = buildDefaultMonteCarloConfig(
      { ...prospect, investableAssets, age: currentAge, riskTolerance },
      retirementAge
    );
    mcConfig.annualContribution = annualContrib;
    mcConfig.timeHorizonYears   = timeHorizon;

    const rdConfig = buildDefaultRetirementConfig(
      { ...prospect, investableAssets, age: currentAge, riskTolerance },
      retirementAge
    );
    rdConfig.annualRetirementExpenses = annualExpenses;
    rdConfig.socialSecurityMonthly    = ssMonthly;
    rdConfig.lifeExpectancy           = lifeExpectancy;
    rdConfig.legacyGoal               = legacyGoal;

    const config: DeckConfig = {
      prospect: { ...prospect, investableAssets, age: currentAge, retirementAge, riskTolerance },
      advisor:  ADVISOR_PROFILE,
      title:    `${prospect.firstName} ${prospect.lastName} — Financial Plan`,
      selectedModules: Array.from(selectedModules),
      selectedGoals:   [],
      monteCarloConfig:         mcConfig,
      retirementDrawdownConfig: rdConfig,
    };

    onGenerate(config);
  };

  const categories = [
    { id: "core",     label: "Core Analysis" },
    { id: "planning", label: "Planning Areas" },
    { id: "advanced", label: "Advanced Topics" },
  ] as const;

  const modulesByCategory = useMemo(() => {
    const result: Record<string, ModuleMeta[]> = {};
    for (const cat of categories) {
      result[cat.id] = ALL_MODULES.filter((m) => m.category === cat.id);
    }
    return result;
  }, []);

  const showVariablePanel = activePanel && selectedModules.has(activePanel);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#040812",
      color: "#e2e8f0",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,900;1,400&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

        .module-card {
          cursor: pointer;
          border: 1px solid #1e293b;
          border-radius: 10px;
          padding: 14px;
          transition: all 0.18s ease;
          background: #080f1f;
        }
        .module-card:hover {
          border-color: #6366f1;
          background: #0d1530;
        }
        .module-card.selected {
          border-color: #6366f1;
          background: linear-gradient(135deg, #0d1530, #12143a);
          box-shadow: 0 0 0 1px #6366f1, inset 0 0 20px rgba(99,102,241,0.05);
        }
        .module-card.active {
          border-color: #8b5cf6;
          background: linear-gradient(135deg, #100f30, #160e38);
          box-shadow: 0 0 0 1px #8b5cf6, 0 4px 20px rgba(139,92,246,0.15);
        }

        .risk-btn {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #1e293b;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
          background: #080f1f;
          color: #64748b;
        }
        .risk-btn.selected {
          border-color: #6366f1;
          background: rgba(99,102,241,0.15);
          color: #a5b4fc;
        }

        .generate-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 36px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .generate-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(99,102,241,0.4);
        }
        .generate-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
          background: #334155;
        }

        .var-section {
          border-radius: 12px;
          padding: 20px;
          background: #0a1020;
          border: 1px solid #1e293b;
          margin-bottom: 16px;
        }
        .var-section-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #6366f1;
          text-transform: uppercase;
          margin-bottom: 18px;
          font-family: 'DM Mono', monospace;
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: "20px 32px",
        borderBottom: "1px solid #111827",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(4,8,18,0.95)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "26px" }}>⚡</span>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", color: "#e2e8f0" }}>
              FastPitch
            </div>
            <div style={{ fontSize: "12px", color: "#475569", marginTop: "1px" }}>
              Configure presentation for {prospect.fullName}
            </div>
          </div>
        </div>

        {/* Prospect pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "#0d1628",
          border: "1px solid #1e293b",
          borderRadius: "10px",
          padding: "10px 16px",
        }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: 700,
            flexShrink: 0,
          }}>
            {prospect.firstName[0]}{prospect.lastName[0]}
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0" }}>{prospect.fullName}</div>
            <div style={{ fontSize: "12px", color: "#475569" }}>
              {[prospect.age ? `Age ${prospect.age}` : null, prospect.company].filter(Boolean).join(" · ")}
            </div>
          </div>
          {prospect.investableAssets && (
            <div style={{
              marginLeft: "8px",
              paddingLeft: "12px",
              borderLeft: "1px solid #1e293b",
              textAlign: "right",
            }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#a5b4fc", fontFamily: "'DM Mono', monospace" }}>
                {fmt(prospect.investableAssets)}
              </div>
              <div style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.05em" }}>INVESTABLE</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* ── Left: Module Selector ──────────────────────────────────────── */}
        <div style={{
          width: "420px",
          flexShrink: 0,
          padding: "24px",
          overflowY: "auto",
          borderRight: "1px solid #0f172a",
        }}>
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", color: "#475569", marginBottom: "6px" }}>
              {selectedModules.size === 0
                ? "Select the modules to include in this presentation"
                : `${selectedModules.size} module${selectedModules.size !== 1 ? "s" : ""} selected — click a module to adjust its variables`}
            </div>
          </div>

          {categories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: "24px" }}>
              <div style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "#334155",
                textTransform: "uppercase",
                fontFamily: "'DM Mono', monospace",
                marginBottom: "10px",
                paddingBottom: "8px",
                borderBottom: "1px solid #0f172a",
              }}>
                {cat.label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {modulesByCategory[cat.id].map((mod) => {
                  const isSelected = selectedModules.has(mod.id);
                  const isActive   = activePanel === mod.id && isSelected;
                  return (
                    <div
                      key={mod.id}
                      className={`module-card ${isSelected ? "selected" : ""} ${isActive ? "active" : ""}`}
                      onClick={() => toggleModule(mod.id)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "20px", lineHeight: 1 }}>{mod.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: isSelected ? "#e2e8f0" : "#94a3b8" }}>
                            {mod.label}
                          </div>
                          <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px", lineHeight: 1.4 }}>
                            {mod.description}
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: isActive ? "#8b5cf6" : "#6366f1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            flexShrink: 0,
                          }}>✓</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Right: Variables Panel ─────────────────────────────────────── */}
        <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>

          {/* Always visible: Core financial variables */}
          <div className="var-section">
            <div className="var-section-title">📊 Client Profile</div>

            <Slider label="Investable Assets"
              value={investableAssets} min={100_000} max={50_000_000} step={50_000}
              display={fmt} onChange={setInvestableAssets} />

            <Slider label="Current Age"
              value={currentAge} min={25} max={80} step={1}
              display={(n) => `${n} years old`} onChange={setCurrentAge} />

            <Slider label="Target Retirement Age"
              value={retirementAge} min={45} max={80} step={1}
              display={(n) => `Age ${n}`} onChange={setRetirementAge} />

            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "10px", fontFamily: "'DM Sans', sans-serif" }}>
                Risk Tolerance
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {(["Conservative", "Moderate", "Aggressive"] as const).map((r) => (
                  <button
                    key={r}
                    className={`risk-btn ${riskTolerance === r ? "selected" : ""}`}
                    onClick={() => setRiskTolerance(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Monte Carlo Variables */}
          {selectedModules.has("MONTE_CARLO") && (
            <div className="var-section"
              style={{ borderColor: activePanel === "MONTE_CARLO" ? "#6366f1" : undefined }}>
              <div className="var-section-title">🎲 Monte Carlo Parameters</div>
              <Slider label="Annual Contribution"
                value={annualContrib} min={0} max={500_000} step={5_000}
                display={fmt} onChange={setAnnualContrib} />
              <Slider label="Simulation Horizon"
                value={timeHorizon} min={10} max={50} step={1}
                display={fmtYears} onChange={setTimeHorizon} />
            </div>
          )}

          {/* Retirement Drawdown Variables */}
          {selectedModules.has("RETIREMENT_DRAWDOWN") && (
            <div className="var-section"
              style={{ borderColor: activePanel === "RETIREMENT_DRAWDOWN" ? "#6366f1" : undefined }}>
              <div className="var-section-title">🏖️ Retirement Income Parameters</div>
              <Slider label="Annual Retirement Expenses"
                value={annualExpenses} min={30_000} max={1_000_000} step={5_000}
                display={fmt} onChange={setAnnualExpenses} />
              <Slider label="Social Security (Monthly)"
                value={ssMonthly} min={0} max={6_000} step={100}
                display={(n) => `${fmt(n)}/mo`} onChange={setSsMonthly} />
              <Slider label="Life Expectancy"
                value={lifeExpectancy} min={75} max={100} step={1}
                display={(n) => `Age ${n}`} onChange={setLifeExpectancy} />
              <Slider label="Legacy Goal"
                value={legacyGoal} min={0} max={investableAssets * 2} step={50_000}
                display={fmt} onChange={setLegacyGoal} />
            </div>
          )}

          {/* Empty state */}
          {selectedModules.size === 0 && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "300px",
              color: "#1e293b",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.4 }}>←</div>
              <div style={{ fontSize: "16px", color: "#334155" }}>Select modules to configure variables</div>
              <div style={{ fontSize: "13px", color: "#1e293b", marginTop: "8px" }}>
                Each module unlocks additional controls
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer / Generate Button ──────────────────────────────────────── */}
      <div style={{
        padding: "20px 32px",
        borderTop: "1px solid #0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(4,8,18,0.97)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ fontSize: "13px", color: "#334155" }}>
          {canGenerate
            ? `Ready to generate a ${selectedModules.size}-module presentation for ${prospect.firstName}`
            : "Select at least one module to generate a presentation"}
        </div>
        <button
          className="generate-btn"
          disabled={!canGenerate}
          onClick={handleGenerate}
        >
          <span style={{ fontSize: "18px" }}>⚡</span>
          Generate Deck
        </button>
      </div>
    </div>
  );
}
