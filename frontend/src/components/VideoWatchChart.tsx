import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Video, Loader2, Clock, Play } from "lucide-react";
import { fetchVideoActivityLogs } from "../api";

interface Props {
  studentId: string;
  courseId?: string;
}

interface DailyWatchTime {
  date: string;
  watchMins: number;
}

interface DailyPlays {
  date: string;
  plays: number;
}

function toDateKey(iso: string) {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

function formatDateLabel(key: string) {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatDuration(secs: number) {
  if (secs < 60) return `${secs}s`;
  const m = Math.round(secs / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function WatchTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <Clock className="w-3 h-3 text-sky-500" />
        <span className="text-gray-500">Watch time:</span>
        <span className="font-medium text-gray-800">{payload[0].value} min</span>
      </div>
    </div>
  );
}

function PlaysTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <Play className="w-3 h-3 text-indigo-500" />
        <span className="text-gray-500">Video plays:</span>
        <span className="font-medium text-gray-800">{payload[0].value}</span>
      </div>
    </div>
  );
}

export default function VideoWatchChart({ studentId, courseId }: Props) {
  const [watchData, setWatchData] = useState<DailyWatchTime[]>([]);
  const [playsData, setPlaysData] = useState<DailyPlays[]>([]);
  const [totalWatchSecs, setTotalWatchSecs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchVideoActivityLogs(studentId, courseId)
      .then((logs) => {
        if (cancelled) return;

        // Aggregate watch time per day from pause/complete events (have real duration)
        const watchMap: Record<string, number> = {};
        const playsMap: Record<string, number> = {};
        let totalSecs = 0;

        for (const log of logs) {
          const key = toDateKey(log.timestamp);
          if (log.event_type === "video_pause" || log.event_type === "video_complete") {
            const secs = log.duration ?? 0;
            watchMap[key] = (watchMap[key] ?? 0) + secs;
            totalSecs += secs;
          } else if (log.event_type === "video_play") {
            playsMap[key] = (playsMap[key] ?? 0) + 1;
          }
        }

        const sortedWatchKeys = Object.keys(watchMap).sort();
        const sortedPlaysKeys = Object.keys(playsMap).sort();

        setWatchData(
          sortedWatchKeys
            .filter((k) => watchMap[k] > 0)
            .map((k) => ({
              date: formatDateLabel(k),
              watchMins: Math.max(1, Math.round(watchMap[k] / 60)),
            }))
        );
        setPlaysData(
          sortedPlaysKeys.map((k) => ({
            date: formatDateLabel(k),
            plays: playsMap[k],
          }))
        );
        setTotalWatchSecs(totalSecs);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err?.response?.data?.detail ?? "Failed to load video activity data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [studentId, courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading video activity…
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

  if (watchData.length === 0 && playsData.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        <Video className="w-5 h-5 mx-auto mb-2 opacity-40" />
        No video activity recorded yet. Watch a video to see data here.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Watch Time ── */}
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <Clock className="w-3.5 h-3.5 text-sky-500" />
          <span className="font-semibold text-gray-600">Watch Time</span>
          {totalWatchSecs > 0 && (
            <>
              <span className="mx-1 text-gray-300">·</span>
              <span className="font-semibold text-gray-700">{formatDuration(totalWatchSecs)}</span>
              <span className="text-gray-400">total · {watchData.length} day(s)</span>
            </>
          )}
        </div>
        {watchData.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-400">
            No watch time recorded yet.
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={watchData} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1"
                  label={{ value: "min", angle: -90, position: "insideLeft", offset: 14, style: { fontSize: 10, fill: "#94a3b8" } }} />
                <RechartsTooltip content={<WatchTooltip />} />
                <Bar dataKey="watchMins" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Watch time (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Video Plays ── */}
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <Play className="w-3.5 h-3.5 text-indigo-500" />
          <span className="font-semibold text-gray-600">Video Plays</span>
          {playsData.length > 0 && (
            <>
              <span className="mx-1 text-gray-300">·</span>
              <span className="font-semibold text-gray-700">
                {playsData.reduce((s, d) => s + d.plays, 0)} sessions
              </span>
              <span className="text-gray-400">across {playsData.length} day(s)</span>
            </>
          )}
        </div>
        {playsData.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-400">
            No video play events recorded yet.
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={playsData} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" allowDecimals={false}
                  label={{ value: "plays", angle: -90, position: "insideLeft", offset: 18, style: { fontSize: 10, fill: "#94a3b8" } }} />
                <RechartsTooltip content={<PlaysTooltip />} />
                <Bar dataKey="plays" fill="#6366f1" radius={[4, 4, 0, 0]} name="Video plays" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
