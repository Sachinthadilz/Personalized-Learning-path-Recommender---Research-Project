import React, { useMemo } from "react";
import type { QuizResult } from "../../types.ts";

type Props = {
  quizHistory: QuizResult[];       // ✅ previous attempts list
  lastQuizResult: QuizResult | null;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const toPercent = (score: number, total: number) =>
  clamp((score / Math.max(total, 1)) * 100, 0, 100);

const bandFromPercent = (p: number): "A" | "B" | "C" | "D" => {
  if (p >= 80) return "A";
  if (p >= 65) return "B";
  if (p >= 50) return "C";
  return "D";
};

export const LevelProgressDiagram: React.FC<Props> = ({
  quizHistory,
  lastQuizResult,
}) => {
  const model = useMemo(() => {
    if (!lastQuizResult) return null;

    const subject = lastQuizResult.subjectId;

    // ✅ find previous attempt for SAME subject (excluding current)
    const prev = [...quizHistory]
      .filter((q) => q.subjectId === subject)
      .slice(-2)[0] ?? null; // last previous (if exists)

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
        <h3 className="text-lg font-semibold text-slate-900">
          Progress Snapshot
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Quiz එකක් කරාම මෙතන progress diagram එක auto generate වේ.
        </p>
      </div>
    );
  }

  const W = 980;
  const H = 220;

  const leftPad = 80;
  const rightPad = 40;
  const bottomPad = 44;
  const topPad = 26;

  const chartW = W - leftPad - rightPad;
  const chartH = H - topPad - bottomPad;

  const barW = 160;
  const gap = 160;

  const xPrev = leftPad + 120;
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

  const deltaText =
    model.delta === null
      ? "No previous attempt for this subject"
      : `Δ ${model.delta > 0 ? "+" : ""}${model.delta.toFixed(1)}% (${model.prevBand} → ${model.currBand})`;

  return (
    <div className="rounded-2xl border bg-white/80 p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-slate-900">
          Progress Snapshot
        </h3>
        <p className="text-sm text-slate-600">
          Quiz attempts history එකෙන් automatically generate වේ (Previous vs Current).
        </p>
      </div>

      <div className="mt-4 rounded-xl border bg-white overflow-x-auto">
        <svg width={W} height={H} role="img" aria-label="Progress level diagram">
          <text x={20} y={20} fontSize="14" className="fill-slate-800">
            {model.subject} — {headline}
          </text>
          <text x={20} y={40} fontSize="12" className="fill-slate-600">
            {deltaText}
          </text>

          <line
            x1={leftPad}
            y1={yBase}
            x2={leftPad + chartW}
            y2={yBase}
            stroke="#e2e8f0"
          />

          {[0, 25, 50, 75, 100].map((t) => {
            const y = topPad + (1 - t / 100) * chartH;
            return (
              <g key={t}>
                <line
                  x1={leftPad}
                  y1={y}
                  x2={leftPad + chartW}
                  y2={y}
                  stroke="#f1f5f9"
                />
                <text
                  x={leftPad - 10}
                  y={y + 4}
                  fontSize="10"
                  textAnchor="end"
                  className="fill-slate-500"
                >
                  {t}
                </text>
              </g>
            );
          })}

          {/* Previous */}
          {showPrev ? (
            <g>
              <rect x={xPrev} y={yPrev} width={barW} height={prevH} rx={10} fill="#94a3b8" />
              <text x={xPrev + barW / 2} y={yBase + 22} textAnchor="middle" fontSize="12" className="fill-slate-700">
                Previous ({model.prevBand})
              </text>
              <text x={xPrev + barW / 2} y={yPrev - 8} textAnchor="middle" fontSize="12" className="fill-slate-700">
                {model.prevPct?.toFixed(1)}%
              </text>
            </g>
          ) : (
            <g>
              <rect x={xPrev} y={yBase - 6} width={barW} height={6} rx={6} fill="#e2e8f0" />
              <text x={xPrev + barW / 2} y={yBase + 22} textAnchor="middle" fontSize="12" className="fill-slate-500">
                Previous (N/A)
              </text>
            </g>
          )}

          {/* Current */}
          <g>
            <rect x={xCurr} y={yCurr} width={barW} height={currH} rx={10} fill="#0ea5e9" />
            <text x={xCurr + barW / 2} y={yBase + 22} textAnchor="middle" fontSize="12" className="fill-slate-700">
              Current ({model.currBand})
            </text>
            <text x={xCurr + barW / 2} y={yCurr - 8} textAnchor="middle" fontSize="12" className="fill-slate-700">
              {model.currPct.toFixed(1)}%
            </text>
          </g>

          {/* Arrow */}
          {showPrev && (
            <g>
              <line
                x1={xPrev + barW + 20}
                y1={yPrev}
                x2={xCurr - 20}
                y2={yCurr}
                stroke="#ef4444"
                strokeWidth={3}
              />
              <polygon
                points={`${xCurr - 20},${yCurr} ${xCurr - 34},${yCurr - 8} ${xCurr - 34},${yCurr + 8}`}
                fill="#ef4444"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default LevelProgressDiagram;
