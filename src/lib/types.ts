export interface ProspectData {
  recordId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  age: number | null;
  occupation: string | null;
  maritalStatus: string | null;
  netWorth: number | null;
  investableAssets: number | null;
  retirementAge: number | null;
  riskTolerance: "Conservative" | "Moderate" | "Aggressive" | null;
  notes: string | null;
}

export interface AdvisorData {
  firstName: string;
  lastName: string;
  title: string;
  role: string;
  email: string;
  phone: string;
  bio: string;
  linkedInUrl?: string;
  photoUrl?: string;
  accolades: string[];
  teamMembers?: string[];
  yearsExperience: number;
}

export interface SmartGoal {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
}

export interface SelectedGoal {
  id: string;
  label: string;
  smart: SmartGoal;
}

export type ModuleId =
  | "TAX"
  | "ESTATE"
  | "BUSINESS"
  | "LIFE"
  | "INVESTMENT"
  | "PHILANTHROPY"
  | "PRIVATE_EQUITY"
  | "STOCK_PLAN"
  | "RETIREMENT_DRAWDOWN"
  | "MONTE_CARLO"
  | "INSURANCE"
  | "SOCIAL_SECURITY"
  | "DEBT_MANAGEMENT";

export interface MonteCarloConfig {
  initialPortfolioValue: number;
  annualContribution: number;
  timeHorizonYears: number;
  targetEndValue: number;
  annualWithdrawal: number;
  withdrawalStartYear: number;
  inflationRate: number;
  stockAllocation: number;
  bondAllocation: number;
  alternativeAllocation: number;
  numSimulations: number;
  confidenceLevel: number;
}

export interface RetirementDrawdownConfig {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  initialPortfolioValue: number;
  annualRetirementExpenses: number;
  inflationRate: number;
  expectedReturnPreRetirement: number;
  expectedReturnDuringRetirement: number;
  socialSecurityMonthly: number;
  socialSecurityStartAge: number;
  pensionMonthly: number;
  pensionStartAge: number;
  otherIncomeMonthly: number;
  otherIncomeEndAge: number;
  healthcareCostMonthly: number;
  medicareStartAge: number;
  medicareMonthly: number;
  legacyGoal: number;
  withdrawalStrategy: "fixed" | "percentage" | "guardrails";
  safeWithdrawalRate: number;
}

/** The full config object encoded in the URL and passed to the viewer */
export interface DeckConfig {
  prospect: ProspectData;
  advisor: AdvisorData | null;
  title: string;
  selectedModules: ModuleId[];
  selectedGoals: SelectedGoal[];
  monteCarloConfig?: MonteCarloConfig;
  retirementDrawdownConfig?: RetirementDrawdownConfig;
}
