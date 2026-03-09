import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import {
  predictLearnerProfile,
  type LearnerProfileInput,
  type LearnerProfileResult,
} from "../api";
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  BarChart3,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  User,
  Activity,
  GraduationCap,
  Sparkles,
  Info,
} from "lucide-react";
import StudentEngagementTimeline from "./StudentEngagementTimeline";

// â”€â”€â”€ Option lists â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const GENDER_OPTIONS = ["M", "F"];
const REGION_OPTIONS = [
  "East Anglian Region",
  "East Midlands Region",
  "Ireland",
  "London Region",
  "North Region",
  "North Western Region",
  "Scotland",
  "South East Region",
  "South Region",
  "South West Region",
  "Wales",
  "West Midlands Region",
  "Yorkshire Region",
];
const EDUCATION_OPTIONS = [
  "A Level or Equivalent",
  "HE Qualification",
  "Lower Than A Level",
  "No Formal quals",
  "Post Graduate Qualification",
];
const IMD_BAND_OPTIONS = [
  "0-10%",
  "10-20",
  "20-30%",
  "30-40%",
  "40-50%",
  "50-60%",
  "60-70%",
  "70-80%",
  "80-90%",
  "90-100%",
];
const AGE_BAND_OPTIONS = ["0-35", "35-55", "55<="];
const DISABILITY_OPTIONS = ["N", "Y"];
const MODULE_OPTIONS = ["AAA", "BBB", "CCC", "DDD", "EEE", "FFF", "GGG"];
const PRESENTATION_OPTIONS = ["2013B", "2013J", "2014B", "2014J"];

// â”€â”€â”€ Example student from OULAD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const EXAMPLE_STUDENT: LearnerProfileInput = {
  gender: "F",
  region: "South East Region",
  highest_education: "A Level or Equivalent",
  imd_band: "50-60%",
  age_band: "35-55",
  disability: "N",
  code_module: "DDD",
  code_presentation: "2013J",
  total_clicks: 2340,
  days_active: 62,
  max_daily_clicks: 210,
  mean_daily_clicks: 37.7,
  early_clicks: 580,
  mean_score: 74.2,
  num_assessments: 6,
  first_reg_before_start: 45,
  ever_unregistered: 0,
  num_of_prev_attempts: 1,
  studied_credits: 120,
};

const DEFAULT_INPUT: LearnerProfileInput = {
  gender: "M",
  region: "London Region",
  highest_education: "HE Qualification",
  imd_band: "90-100%",
  age_band: "0-35",
  disability: "N",
  code_module: "BBB",
  code_presentation: "2014J",
  total_clicks: 1200,
  days_active: 45,
  max_daily_clicks: 150,
  mean_daily_clicks: 26.7,
  early_clicks: 320,
  mean_score: 68.5,
  num_assessments: 5,
  first_reg_before_start: 30,
  ever_unregistered: 0,
  num_of_prev_attempts: 0,
  studied_credits: 60,
};

// â”€â”€â”€ Tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="text-gray-400 hover:text-indigo-500 transition-colors"
        aria-label="help"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {visible && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}

// â”€â”€â”€ Collapsible section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Section({
  title,
  icon,
  badge,
  accentColor,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: ReactElement;
  badge: string;
  accentColor: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentColor}`}>
            {icon}
          </div>
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
          <span className="text-xs text-gray-400 font-medium">{badge}</span>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && <div className="px-5 py-5 bg-white">{children}</div>}
    </div>
  );
}

// â”€â”€â”€ Confidence bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-10 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

// â”€â”€â”€ Outcome styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const OUTCOME_STYLES: Record<
  string,
  { border: string; bg: string; text: string; icon: ReactElement }
> = {
  Distinction: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  },
  Pass: {
    border: "border-blue-200",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
  },
  Fail: {
    border: "border-rose-200",
    bg: "bg-rose-50",
    text: "text-rose-700",
    icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
  },
  Withdrawn: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  },
};

const ALERT_LEVEL_STYLES: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-rose-100 text-rose-700",
};

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function LearnerStatusTab() {
  const [input, setInput] = useState<LearnerProfileInput>({ ...DEFAULT_INPUT });
  const [result, setResult] = useState<LearnerProfileResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");

  // Auto-calculate mean_daily_clicks whenever total_clicks or days_active changes
  useEffect(() => {
    setInput((prev) => ({
      ...prev,
      mean_daily_clicks:
        prev.days_active > 0
          ? Math.round((prev.total_clicks / prev.days_active) * 10) / 10
          : 0,
    }));
  }, [input.total_clicks, input.days_active]);

  const setStr = (field: keyof LearnerProfileInput, value: string) =>
    setInput((prev) => ({ ...prev, [field]: value }));

  const setNum = (field: keyof LearnerProfileInput, value: string) =>
    setInput((prev) => ({ ...prev, [field]: value === "" ? 0 : Number(value) }));

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await predictLearnerProfile(input);
      setResult(data);
      // Scroll results into view
      setTimeout(() => {
        document.getElementById("ls-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Prediction failed. Please check the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExample = () => {
    setInput({ ...EXAMPLE_STUDENT });
    setResult(null);
    setError(null);
  };

  const handleReset = () => {
    setInput({ ...DEFAULT_INPUT });
    setResult(null);
    setError(null);
  };

  // â”€â”€â”€ Field components (defined inside to close over setStr/setNum/input) â”€â”€â”€

  const SelectField = ({
    label,
    field,
    options,
    tooltip,
  }: {
    label: string;
    field: keyof LearnerProfileInput;
    options: string[];
    tooltip?: string;
  }) => (
    <div>
      <label className="flex items-center text-xs font-medium text-gray-600 mb-1">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <select
        value={input[field] as string}
        onChange={(e) => setStr(field, e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );

  const NumberField = ({
    label,
    field,
    step = 1,
    min,
    max,
    tooltip,
    readOnly,
  }: {
    label: string;
    field: keyof LearnerProfileInput;
    step?: number;
    min?: number;
    max?: number;
    tooltip?: string;
    readOnly?: boolean;
  }) => (
    <div>
      <label className="flex items-center text-xs font-medium text-gray-600 mb-1">
        {label}
        {readOnly && (
          <span className="ml-2 text-xs text-indigo-500 font-semibold">(auto)</span>
        )}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        readOnly={readOnly}
        value={input[field] as number}
        onChange={readOnly ? undefined : (e) => setNum(field, e.target.value)}
        className={`w-full px-3 py-2 text-sm border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
          readOnly
            ? "bg-indigo-50 border-indigo-200 text-indigo-700 cursor-default"
            : "bg-white border-gray-200"
        }`}
      />
    </div>
  );

  // â”€â”€â”€ Derived outcome styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const outcomeStyle =
    result && OUTCOME_STYLES[result.predicted_outcome]
      ? OUTCOME_STYLES[result.predicted_outcome]
      : {
          border: "border-gray-200",
          bg: "bg-gray-50",
          text: "text-gray-700",
          icon: <BarChart3 className="w-5 h-5 text-gray-400" />,
        };

  const isAtRisk = result?.risk_prediction === "At-Risk";
  const alertLevelClass =
    result?.learning_path_recommendation?.alert_level
      ? ALERT_LEVEL_STYLES[result.learning_path_recommendation.alert_level] ??
        "bg-gray-100 text-gray-700"
      : "bg-gray-100 text-gray-700";

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="space-y-5">
      {/* â”€â”€ Page header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Brain className="w-6 h-6 text-indigo-600" />
              Learner Status Analyser
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Fill in the three sections below and click{" "}
              <span className="font-semibold text-indigo-600">Analyse Learner</span> to
              run the OULAD ML pipeline and predict the student's profile, outcome, and
              risk level.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLoadExample}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Load Example Student
          </button>
        </div>
      </div>

      {/* â”€â”€ Error banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

            {/* -- Student ID (for activity timeline) -- */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Student ID</label>
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value.trim())}
          placeholder="e.g. student_001"
          className="flex-1 max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <span className="text-xs text-gray-400">Used to load the engagement timeline below</span>
      </div>
{/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SECTION 1 â€” Student Background  (8 categorical)
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Section
        title="Student Background"
        icon={<User className="w-4 h-4 text-indigo-600" />}
        badge="8 fields"
        accentColor="bg-indigo-50"
        defaultOpen
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SelectField
            label="Gender"
            field="gender"
            options={GENDER_OPTIONS}
            tooltip="Student's gender as recorded in the Open University system."
          />
          <SelectField
            label="Age Band"
            field="age_band"
            options={AGE_BAND_OPTIONS}
            tooltip="Student's age group at the time of module registration."
          />
          <SelectField
            label="Disability"
            field="disability"
            options={DISABILITY_OPTIONS}
            tooltip="Whether the student has declared a disability (Y = Yes, N = No)."
          />
          <SelectField
            label="IMD Band"
            field="imd_band"
            options={IMD_BAND_OPTIONS}
            tooltip="Index of Multiple Deprivation band for the student's home area. 0â€“10% = most deprived, 90â€“100% = least deprived."
          />
          <SelectField
            label="Highest Education"
            field="highest_education"
            options={EDUCATION_OPTIONS}
            tooltip="The highest level of education the student had before enrolling in the module."
          />
          <SelectField
            label="Region"
            field="region"
            options={REGION_OPTIONS}
            tooltip="The UK region where the student lives."
          />
          <SelectField
            label="Module Code"
            field="code_module"
            options={MODULE_OPTIONS}
            tooltip="The anonymised Open University module code the student is studying."
          />
          <SelectField
            label="Presentation"
            field="code_presentation"
            options={PRESENTATION_OPTIONS}
            tooltip="The academic presentation (semester). B = February start, J = October start."
          />
        </div>
      </Section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SECTION 2 â€” Engagement Behaviour  (7 numeric)
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Section
        title="Engagement Behaviour"
        icon={<Activity className="w-4 h-4 text-emerald-600" />}
        badge="7 fields Â· mean daily clicks auto-calculated"
        accentColor="bg-emerald-50"
        defaultOpen
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumberField
            label="Total VLE Clicks"
            field="total_clicks"
            min={0}
            tooltip="Total number of times the student clicked anything on the Virtual Learning Environment across the full module."
          />
          <NumberField
            label="Days Active"
            field="days_active"
            min={0}
            tooltip="Number of distinct calendar days the student logged at least one VLE interaction."
          />
          <NumberField
            label="Max Daily Clicks"
            field="max_daily_clicks"
            min={0}
            tooltip="The highest single-day click count recorded for this student â€” a measure of peak engagement intensity."
          />
          <NumberField
            label="Mean Daily Clicks"
            field="mean_daily_clicks"
            step={0.1}
            min={0}
            readOnly
            tooltip="Automatically calculated as Total VLE Clicks Ã· Days Active. Represents average engagement per active day."
          />
          <NumberField
            label="Early Clicks (wk 1â€“2)"
            field="early_clicks"
            min={0}
            tooltip="Number of VLE clicks recorded during the first two weeks of the module. A strong early-engagement predictor."
          />
          <NumberField
            label="Assessments Submitted"
            field="num_assessments"
            min={0}
            tooltip="Total number of assessment tasks (TMAs, CMAs) the student has submitted."
          />
          <NumberField
            label="Days Before Module Start"
            field="first_reg_before_start"
            tooltip="How many days before the module start date the student registered. Negative values mean they registered after the module began."
          />
        </div>
      </Section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SECTION 3 â€” Academic Performance  (4 numeric)
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Section
        title="Academic Performance"
        icon={<GraduationCap className="w-4 h-4 text-purple-600" />}
        badge="4 fields"
        accentColor="bg-purple-50"
        defaultOpen
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumberField
            label="Mean Assessment Score"
            field="mean_score"
            step={0.1}
            min={0}
            max={100}
            tooltip="The student's average score across all submitted assessments, on a 0â€“100 scale."
          />
          <NumberField
            label="Ever Unregistered"
            field="ever_unregistered"
            min={0}
            max={1}
            tooltip="Binary flag: 1 if the student un-registered from the module at any point (even if they re-registered), 0 otherwise."
          />
          <NumberField
            label="Previous Attempts"
            field="num_of_prev_attempts"
            min={0}
            tooltip="How many times the student has previously attempted this same module before the current registration."
          />
          <NumberField
            label="Studied Credits"
            field="studied_credits"
            min={0}
            tooltip="Total number of OU credits the student is registered for across all concurrent modules this presentation."
          />
        </div>
      </Section>

      {/* â”€â”€ Action buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold shadow-sm"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analysingâ€¦
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Analyse Learner
            </>
          )}
        </button>
        <button
          onClick={handleLoadExample}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          <Sparkles className="w-4 h-4" />
          Load Example Student
        </button>
        <button
          onClick={handleReset}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          Reset
        </button>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          RESULTS
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {result && (
        <div id="ls-results" className="space-y-4 pt-1">
          <h3 className="text-base font-semibold text-gray-700">
            Prediction Results
          </h3>

          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Learner Profile */}
            <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Learner Profile
                </span>
              </div>
              <p className="text-base font-bold text-gray-900 mb-2">
                {result.learner_profile}
              </p>
              <div className="text-xs text-gray-400 mb-1">Confidence</div>
              <ConfidenceBar value={result.profile_confidence} color="bg-indigo-500" />
            </div>

            {/* Predicted Outcome */}
            <div className={`bg-white rounded-xl border shadow-sm p-5 ${outcomeStyle.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${outcomeStyle.bg}`}>
                  {outcomeStyle.icon}
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Predicted Outcome
                </span>
              </div>
              <p className={`text-base font-bold mb-2 ${outcomeStyle.text}`}>
                {result.predicted_outcome}
              </p>
              <div className="text-xs text-gray-400 mb-1">Confidence</div>
              <ConfidenceBar
                value={result.outcome_confidence}
                color={
                  result.predicted_outcome === "Distinction" ||
                  result.predicted_outcome === "Pass"
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }
              />
            </div>

            {/* Early Warning */}
            <div
              className={`bg-white rounded-xl border shadow-sm p-5 ${
                isAtRisk ? "border-rose-200" : "border-emerald-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isAtRisk ? "bg-rose-50" : "bg-emerald-50"
                  }`}
                >
                  {isAtRisk ? (
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Early Warning
                </span>
              </div>
              <p
                className={`text-base font-bold mb-2 ${
                  isAtRisk ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                {result.risk_prediction}
              </p>
              <div className="text-xs text-gray-400 mb-1">Risk Score</div>
              <ConfidenceBar
                value={result.risk_score}
                color={isAtRisk ? "bg-rose-500" : "bg-emerald-500"}
              />
            </div>

            {/* Intervention */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Intervention
                </span>
              </div>
              {result.learning_path_recommendation.alert_level && (
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${alertLevelClass}`}
                >
                  {result.learning_path_recommendation.alert_level} Alert
                </span>
              )}
              <p className="text-sm font-semibold text-gray-800 mt-1">
                {result.learning_path_recommendation.intervention ?? "â€”"}
              </p>
            </div>
          </div>

          {/* Learning Track panel */}
          {result.learning_path_recommendation &&
            Object.keys(result.learning_path_recommendation).length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-base font-semibold text-gray-800">
                      Recommended Learning Track
                    </h4>
                    <p className="text-sm text-indigo-600 font-medium mt-0.5">
                      {result.learning_path_recommendation.learning_path}
                    </p>
                  </div>
                  {result.learning_path_recommendation.profile && (
                    <span className="flex-shrink-0 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                      {result.learning_path_recommendation.profile}
                    </span>
                  )}
                </div>
                {result.learning_path_recommendation.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {result.learning_path_recommendation.description}
                  </p>
                )}
                {result.learning_path_recommendation.actions &&
                  result.learning_path_recommendation.actions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Recommended Actions
                      </p>
                      <ul className="space-y-2">
                        {result.learning_path_recommendation.actions.map(
                          (action: string, idx: number) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-gray-700"
                            >
                              <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                              {action}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}
        </div>
      )}

      {/* ── Engagement Timeline ─────────────────────────────────────── */}
      {studentId && (
        <Section
          title="Engagement Timeline"
          icon={<Activity className="w-4 h-4 text-sky-600" />}
          badge="activity log"
          accentColor="bg-sky-50"
          defaultOpen
        >
          <StudentEngagementTimeline studentId={studentId} />
        </Section>
      )}
    </div>
  );
}
