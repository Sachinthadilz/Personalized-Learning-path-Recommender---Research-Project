// WeeklySubjectForm – collects actual marks/grades + mentor input
import React, { useState } from "react";
import { PlusCircle, Trash2, BookOpen, Users } from "lucide-react";
import type { SubjectPerformance } from "./types";

interface Props {
  onSubmit: (subjects: SubjectPerformance[]) => void;
  onSkip: () => void;
}

interface SubjectRow {
  name: string;
  marks: string;       // 0–100
  enteredBy: "self" | "mentor" | "team";
  mentorNotes: string;
}

const defaultRow = (): SubjectRow => ({
  name: "",
  marks: "",
  enteredBy: "self",
  mentorNotes: "",
});

/** Derive A-F grade from 0-100 marks */
const gradeFromMarks = (m: number): string => {
  if (m >= 70) return "A";
  if (m >= 60) return "B";
  if (m >= 50) return "C";
  if (m >= 40) return "D";
  if (m >= 30) return "E";
  return "F";
};

/** Derive difficulty 1-5 (higher marks = lower difficulty) */
const difficultyFromMarks = (m: number): number =>
  Math.max(1, Math.min(5, 5 - Math.floor(m / 25)));

/** Derive confidence 1-5 (higher marks = higher confidence) */
const confidenceFromMarks = (m: number): number =>
  Math.max(1, Math.min(5, Math.ceil(m / 25)));

export const WeeklySubjectForm: React.FC<Props> = ({ onSubmit, onSkip }) => {
  const [rows, setRows] = useState<SubjectRow[]>([defaultRow()]);
  const [showMentorNotes, setShowMentorNotes] = useState<Record<number, boolean>>({});

  const updateRow = (idx: number, field: keyof SubjectRow, val: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  };

  const toggleMentorNotes = (idx: number) => {
    setShowMentorNotes((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const addRow = () => setRows((prev) => [...prev, defaultRow()]);

  const removeRow = (idx: number) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = rows.filter((r) => r.name.trim() !== "" && r.marks !== "");
    if (valid.length === 0) return;

    const subjects: SubjectPerformance[] = valid.map((r) => {
      const marks = Number(r.marks);
      const clamped = Math.max(0, Math.min(100, marks));
      return {
        id: r.name.trim().toLowerCase().replace(/\s+/g, "-"),
        name: r.name.trim(),
        marks: clamped,
        grade: gradeFromMarks(clamped),
        difficulty: difficultyFromMarks(clamped),
        confidence: confidenceFromMarks(clamped),
        isWeak: clamped < 50,
      };
    });

    onSubmit(subjects);
  };

  const marksNum = (val: string) => (val === "" ? null : Number(val));
  const isWeakMark = (val: string) => {
    const n = marksNum(val);
    return n !== null && n < 50;
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xl space-y-6"
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-800">Weekly Subject Assessment</h2>
          </div>
          <p className="text-sm text-slate-500">
            Enter each subject with your actual marks (0–100). Subjects scoring below
            <span className="font-semibold text-red-500"> 50%</span> are automatically flagged as weak areas.
            Marks, grades, and difficulty are all derived automatically.
          </p>
        </div>

        {/* Subject rows */}
        <div className="space-y-4">
          {rows.map((row, idx) => {
            const weak = isWeakMark(row.marks);
            const grade = row.marks !== "" ? gradeFromMarks(Number(row.marks)) : "";
            return (
              <div
                key={idx}
                className={`border rounded-2xl p-4 space-y-3 transition-colors ${
                  weak
                    ? "border-red-300 bg-red-50/40"
                    : row.marks !== ""
                    ? "border-emerald-300 bg-emerald-50/30"
                    : "border-slate-200"
                }`}
              >
                {/* Weak / Pass badge */}
                {row.marks !== "" && (
                  <div className="flex justify-end">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        weak
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {weak ? "⚠ Weak Area" : "✓ Strong"}
                    </span>
                  </div>
                )}

                {/* Subject name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Subject Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(idx, "name", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g. Software Engineering, OOP, Databases"
                    required={idx === 0}
                  />
                </div>

                {/* Marks + auto grade */}
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Marks (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={row.marks}
                      onChange={(e) => updateRow(idx, "marks", e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                        weak ? "border-red-400" : "border-slate-300"
                      }`}
                      placeholder="0 – 100"
                      required={idx === 0}
                    />
                  </div>
                  {grade && (
                    <div className="text-center min-w-[56px]">
                      <p className="text-[10px] text-slate-500 font-medium mb-1">Grade</p>
                      <span
                        className={`inline-block text-lg font-black rounded-xl px-3 py-1.5 ${
                          ["A", "B"].includes(grade)
                            ? "bg-emerald-100 text-emerald-700"
                            : grade === "C"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {grade}
                      </span>
                    </div>
                  )}
                </div>

                {/* Entered by */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    <Users className="w-3.5 h-3.5 inline mr-1" />
                    Data entered by
                  </label>
                  <select
                    value={row.enteredBy}
                    onChange={(e) => updateRow(idx, "enteredBy", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="self">Student (self)</option>
                    <option value="mentor">Mentor</option>
                    <option value="team">Team Member</option>
                  </select>
                </div>

                {/* Mentor/Team notes toggle */}
                {row.enteredBy !== "self" && (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleMentorNotes(idx)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      {showMentorNotes[idx] ? "Hide notes ▲" : "Add observation notes ▼"}
                    </button>
                    {showMentorNotes[idx] && (
                      <textarea
                        value={row.mentorNotes}
                        onChange={(e) => updateRow(idx, "mentorNotes", e.target.value)}
                        rows={2}
                        placeholder="Mentor/team member observations for this subject…"
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                      />
                    )}
                  </div>
                )}

                {/* Remove row */}
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="flex items-center gap-1 text-red-500 text-xs hover:underline"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add row */}
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition"
        >
          <PlusCircle className="w-4 h-4" />
          Add another subject
        </button>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Below 50% → Weak (needs training)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> 50%+ → Passing</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Analyze Weak Areas →
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm hover:bg-slate-50 transition"
          >
            Skip
          </button>
        </div>
      </form>
    </div>
  );
};
