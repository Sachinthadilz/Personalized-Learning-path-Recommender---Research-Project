import React, { useState } from "react";

interface SubjectInput {
  subject: string;
  confidence: number;
  difficulty: number;
}

interface Props {
  studentName: string;
  onSubmit: (data: any) => void;
}

export const SubjectInfoForm: React.FC<Props> = ({ studentName, onSubmit }) => {
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [week, setWeek] = useState("");
  const [subjects, setSubjects] = useState<SubjectInput[]>([
    { subject: "", confidence: 3, difficulty: 3 },
  ]);

  const handleSubjectChange = (
    index: number,
    field: keyof SubjectInput,
    value: string | number
  ) => {
    const updated = [...subjects];
    updated[index] = { ...updated[index], [field]: value };
    setSubjects(updated);
  };

  const addSubject = () =>
    setSubjects([...subjects, { subject: "", confidence: 3, difficulty: 3 }]);

  const removeSubject = (index: number) =>
    setSubjects(subjects.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      studentName,
      university,
      degree,
      week,
      subjects: subjects.filter((s) => s.subject.trim() !== ""),
    });
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow p-8 w-full max-w-lg space-y-6"
      >
        <h2 className="text-xl font-semibold text-slate-800 text-center">
          Subject Information Form
        </h2>

        <p className="text-sm text-slate-600 text-center">
          Provide confidence and difficulty levels. The system will identify weak
          subjects automatically.
        </p>

        {/* ✅ Research visibility line (UI-level) */}
        <p className="text-xs text-slate-500 text-center">
          Your weekly inputs are analyzed together with historical quiz
          performance data (CSV) to generate evidence-based learning support.
        </p>

        {/* Student Name */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Student Name
          </label>
          <input
            value={studentName}
            readOnly
            className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm"
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
            required
          />
        </div>

        {/* Degree */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Degree Program
          </label>
          <input
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>

        {/* Week */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Week Number
          </label>
          <input
            type="number"
            min={1}
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Enter the tracking week in the system (Week 1 for first submission,
            then Week 2, 3...).
          </p>
        </div>

        {/* Subjects */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">
            Subjects for This Week
          </label>

          <div className="space-y-4">
            {subjects.map((item, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <input
                  value={item.subject}
                  onChange={(e) =>
                    handleSubjectChange(index, "subject", e.target.value)
                  }
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder={`Subject ${index + 1}`}
                  required
                />

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-slate-600">
                      Confidence (1–5)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={item.confidence}
                      onChange={(e) =>
                        handleSubjectChange(
                          index,
                          "confidence",
                          Number(e.target.value)
                        )
                      }
                      className="w-full rounded border px-2 py-1 text-sm"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="text-xs text-slate-600">
                      Difficulty (1–5)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={item.difficulty}
                      onChange={(e) =>
                        handleSubjectChange(
                          index,
                          "difficulty",
                          Number(e.target.value)
                        )
                      }
                      className="w-full rounded border px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeSubject(index)}
                    className="text-red-500 text-xs"
                  >
                    Remove Subject
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addSubject}
              className="text-blue-600 text-sm font-medium"
            >
              + Add Another Subject
            </button>
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
