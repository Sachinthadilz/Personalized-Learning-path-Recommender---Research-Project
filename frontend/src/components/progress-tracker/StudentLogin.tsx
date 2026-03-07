// src/components/StudentLogin.tsx
import React, { useState } from "react";

interface SubjectRow {
  subject: string;
  grade: string; // A+, A, A-, ... , E
}

interface Props {
  onLogin: (data: {
    studentName: string;
    university: string;
    degree: string;
    week: string;
    weeklySubjects: SubjectRow[];
  }) => void;
}

export const StudentLogin: React.FC<Props> = ({ onLogin }) => {
  const [studentName, setStudentName] = useState("");
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [week, setWeek] = useState("");
  const [subjects, setSubjects] = useState<SubjectRow[]>([
    { subject: "", grade: "" },
  ]);

  const handleSubjectChange = (
    index: number,
    field: "subject" | "grade",
    value: string
  ) => {
    const updated = [...subjects];
    updated[index][field] = value;
    setSubjects(updated);
  };

  const addSubjectRow = () => {
    setSubjects([...subjects, { subject: "", grade: "" }]);
  };

  const removeSubjectRow = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    const cleanedSubjects = subjects.filter(
      (s) => s.subject.trim() !== ""
    );

    onLogin({
      studentName: studentName.trim(),
      university,
      degree,
      week,
      weeklySubjects: cleanedSubjects,
    });
  };

  const gradeOptions = [
    "A+",
    "A",
    "A-",
    "B+",
    "B",
    "B-",
    "C+",
    "C",
    "C-",
    "D+",
    "D",
    "E",
  ];

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow p-8 w-full max-w-xl space-y-6"
      >
        <h2 className="text-xl font-semibold text-slate-800 text-center">
          Student Information
        </h2>
        <p className="text-sm text-slate-600 text-center">
          Enter your details and this week&apos;s subjects and grades.
        </p>

        <div className="space-y-4">
          {/* Student Name */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Student Name
            </label>
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Your full name"
              required
            />
          </div>

          {/* University */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              University
            </label>
            <input
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Eg: SLIIT, NSBM, IIT"
            />
          </div>

          {/* Degree */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Degree / Program
            </label>
            <input
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Eg: BSc (Hons) in IT"
            />
          </div>

          {/* Week Number */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Week Number
            </label>
            <input
              type="number"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Eg: 5"
            />
          </div>

          {/* Subjects + Grades */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              This Week&apos;s Subjects &amp; Grades
            </label>

            <div className="space-y-3">
              {subjects.map((row, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    value={row.subject}
                    onChange={(e) =>
                      handleSubjectChange(index, "subject", e.target.value)
                    }
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={`Subject ${index + 1}`}
                  />

                  <select
                    value={row.grade}
                    onChange={(e) =>
                      handleSubjectChange(index, "grade", e.target.value)
                    }
                    className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Grade</option>
                    {gradeOptions.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>

                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeSubjectRow(index)}
                      className="text-red-500 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addSubjectRow}
                className="text-blue-600 text-sm font-medium"
              >
                + Add another subject
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
        >
          Continue
        </button>
      </form>
    </div>
  );
};
