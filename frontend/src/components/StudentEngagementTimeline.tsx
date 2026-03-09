import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Activity, Calendar, TrendingUp, Loader2, Clock } from "lucide-react";
import { fetchActivityTimeline, type TimelineDataPoint } from "../api";

// ── Types ────────────────────────────────────────────────────────────────

interface Props {
  studentId: string;
  courseId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

// ── Custom tooltip ───────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const dataPoint = payload[0].payload as TimelineDataPoint;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{formatDate(label)}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-indigo-600" />
          <span className="text-gray-500">Events:</span>
          <span className="font-medium text-gray-800">{dataPoint.events}</span>
        </div>
        {dataPoint.total_duration > 0 && (
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-blue-600" />
            <span className="text-gray-500">Duration:</span>
            <span className="font-medium text-gray-800">{formatDuration(dataPoint.total_duration)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────

type ChartMode = "area" | "bar";

export default function StudentEngagementTimeline({ 
  studentId, 
  courseId,
  startDate,
  endDate 
}: Props) {
  const [data, setData] = useState<TimelineDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ChartMode>("area");

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchActivityTimeline(studentId, courseId, startDate, endDate)
      .then((timelineData) => {
        if (!cancelled) setData(timelineData);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.detail ?? "Failed to load activity timeline");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [studentId, courseId, startDate, endDate]);

  // Summary stats
  const totalEvents = data.reduce((sum, d) => sum + d.events, 0);
  const totalDuration = data.reduce((sum, d) => sum + d.total_duration, 0);
  const daysActive = data.length;
  const peakDay = data.reduce<TimelineDataPoint | null>(
    (best, d) => (!best || d.events > best.events ? d : best),
    null,
  );

  // ── Empty / loading states ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading activity timeline…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        <Activity className="w-5 h-5 mx-auto mb-2 opacity-50" />
        No activity timeline data found for this student.
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header row: stats + chart mode toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-medium text-gray-700">{daysActive}</span> days active
          </span>
          <span className="inline-flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" />
            <span className="font-medium text-gray-700">{totalEvents}</span> total events
          </span>

          {peakDay && (
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Peak: <span className="font-medium text-gray-700">{peakDay.events}</span> on{" "}
              {formatDate(peakDay.date)}
            </span>
          )}
        </div>

        <div className="inline-flex rounded-md border border-gray-200 text-xs font-medium overflow-hidden">
          <button
            onClick={() => setMode("area")}
            className={`px-3 py-1.5 transition-colors ${
              mode === "area"
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setMode("bar")}
            className={`px-3 py-1.5 transition-colors border-l border-gray-200 ${
              mode === "bar"
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Bar
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {mode === "area" ? (
            <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="grad-events" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11 }}
                stroke="#cbd5e1"
              />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area 
                type="monotone" 
                dataKey="events" 
                stroke="#6366f1" 
                strokeWidth={2}
                fill="url(#grad-events)" 
                name="Events"
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11 }}
                stroke="#cbd5e1"
              />
              <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar 
                dataKey="events" 
                fill="#6366f1" 
                radius={[4, 4, 0, 0]}
                name="Events" 
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
