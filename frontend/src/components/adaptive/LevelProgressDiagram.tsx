// LevelProgressDiagram – SVG bar chart comparing previous vs current quiz attempt
import React, { useMemo } from "react";
import type { QuizResult } from "./types";

interface Props {
  quizHistory: QuizResult[];
  lastQuizResult: QuizResult | null;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const toPercent = (score: number, total: number) =>
  clamp((score / Math.max(total, 1)) * 100, 0, 100);
const bandFromPercent = (p: number): QuizResult["band"] => {
  if (p >= 80) return "A";
  if (p >= 65) return "B";
  if (p >= 50) return "C";
  return "D";
};

export const LevelProgressDiagram: React.FC<Props> = ({ quizHistory, lastQuizResult }) => {
  const model = useMemo(() => {
    if (!lastQuizResult) return null;

    const subject = lastQuizResult.subjectId;
    const prev =
      [...quizHistory].filter((q) => q.subjectId === subject).slice(-2)[0] ?? null;

    const currPct = toPercent(lastQuizResult.score, lastQuizResult.total);
    const prevPct = prev ? toPercent(prev.score, prev.total) : null;
    const currBand = bandFromPercent(currPct);
    const prevBand = prevPct === null ? null : bandFromPercent(prevPct);
    const delta = prevPct === null ? null : currPct - prevPct;

    return { subject, currPct, prevPct, currBand, prevBand, delta };
  }, [quizHistory, lastQuizResult]);

  if (!model) {
    return (
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Progress Snapshot</h3>
        <p className="mt-1 text-sm text-slate-600">
          Complete a quiz to see your progress diagram here.
        </p>
      </div>
    );
  }

  const W = 600;
  const H = 200;
  const leftPad = 50;
  const rightPad = 30;
  const topPad = 40;
  const bottomPad = 44;
  const chartW = W - leftPad - rightPad;
  const chartH = H - topPad - bottomPad;
  const barW = 100;
  const gap = 100;
  const xPrev = leftPad + 60;
  const xCurr = xPrev + barW + gap;
  const yBase = topPad + chartH;
  const prevH = model.prevPct === null ? 0 : (model.prevPct / 100) * chartH;
  const currH = (model.currPct / 100) * chartH;
  const yPrev = yBase - prevH;
  const yCurr = yBase - currH;
  const showPrev = model.prevPct !== null;

  const headline =
    model.delta === null
      ? `Current Level: ${model.currBand}`
      : model.delta > 0
      ? `Level Up! ${model.prevBand} → ${model.currBand}`
      : model.delta < 0
      ? `Dropped: ${model.prevBand} → ${model.currBand}`
      : `No Change: ${model.prevBand}`;

  return (
    <div className="rounded-2xl border bg-white/80 p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Progress Snapshot</h3>
        <p className="text-sm text-slate-600 mt-1">{model.subject} — {headline}</p>
        {model.delta !== null && (
          <p className="text-xs text-slate-500 mt-0.5">
            Δ {model.delta > 0 ? "+" : ""}{model.delta.toFixed(1)}% (
            {model.prevBand} → {model.currBand})
          </p>
        )}
      </div>

      <div className="mt-4 rounded-xl border bg-white overflow-x-auto">
        <svg width={W} height={H} role="img" aria-label="Progress level diagram">
          {/* Y axis grid lines */}
          {[0, 25, 50, 75, 100].map((t) => {
            const y = topPad + (1 - t / 100) * chartH;
            return (
              <g key={t}>
                <line x1={leftPad} y1={y} x2={leftPad + chartW} y2={y} stroke="#f1f5f9" />
                <text x={leftPad - 8} y={y + 4} fontSize="10" textAnchor="end" fill="#94a3b8">
                  {t}
                </text>
              </g>
            );
          })}

          {/* X baseline */}
          <line x1={leftPad} y1={yBase} x2={leftPad + chartW} y2={yBase} stroke="#e2e8f0" />

          {/* Previous bar */}
          {showPrev ? (
            <g>
              <rect x={xPrev} y={yPrev} width={barW} height={prevH} rx={8} fill="#94a3b8" />
              <text x={xPrev + barW / 2} y={yBase + 20} textAnchor="middle" fontSize="11" fill="#64748b">
                Prev ({model.prevBand})
              </text>
              <text x={xPrev + barW / 2} y={yPrev - 6} textAnchor="middle" fontSize="11" fill="#64748b">
                {model.prevPct?.toFixed(1)}%
              </text>
            </g>
          ) : (
            <g>
              <rect x={xPrev} y={yBase - 4} width={barW} height={4} rx={4} fill="#e2e8f0" />
              <text x={xPrev + barW / 2} y={yBase + 20} textAnchor="middle" fontSize="11" fill="#94a3b8">
                Prev (N/A)
              </text>
            </g>
          )}

          {/* Current bar */}
          <g>
            <rect x={xCurr} y={yCurr} width={barW} height={currH} rx={8} fill="#6366f1" />
            <text x={xCurr + barW / 2} y={yBase + 20} textAnchor="middle" fontSize="11" fill="#64748b">
              Current ({model.currBand})
            </text>
            <text x={xCurr + barW / 2} y={yCurr - 6} textAnchor="middle" fontSize="11" fill="#6366f1">
              {model.currPct.toFixed(1)}%
            </text>
          </g>

          {/* Trend arrow */}
          {showPrev && (
            <g>
              <line
                x1={xPrev + barW + 12}
                y1={yPrev}
                x2={xCurr - 12}
                y2={yCurr}
                stroke={model.delta! >= 0 ? "#10b981" : "#f43f5e"}
                strokeWidth={2.5}
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default LevelProgressDiagram;
