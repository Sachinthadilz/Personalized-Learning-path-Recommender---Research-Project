// src/components/SubjectInfoForm.tsx
import React, { useState } from "react";

interface Props {
  studentName: string;
  onSubmit: (data: any) => void;
}

export const SubjectInfoForm: React.FC<Props> = ({ studentName, onSubmit }) => {
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [week, setWeek] = useState("");
  const [subjects, setSubjects] = useState<string[]>([""]);

  const handleSubjectChange = (index: number, value: string) => {
    const updated = [...subjects];
    updated[index] = value;
    setSubjects(updated);
  };

  const addSubject = () => setSubjects([...subjects, ""]);
  const removeSubject = (index: number) =>
    setSubjects(subjects.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      studentName,
      university,
      degree,
      week,
      subjects: subjects.filter((s) => s.trim() !== ""),
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
          Fill in your academic details for this week&apos;s study cycle.
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
            placeholder="Eg: SLIIT, NSBM, IIT"
            required
          />
        </div>

        {/* Degree Program */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Degree Program
          </label>
          <input
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Eg: BSc (Hons) in IT"
            required
          />
        </div>

        {/* Current Week */}
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
            required
          />
        </div>

        {/* Subjects */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">
            Subjects for This Week
          </label>

          <div className="space-y-3">
            {subjects.map((sub, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={sub}
                  onChange={(e) =>
                    handleSubjectChange(index, e.target.value)
                  }
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder={`Subject ${index + 1}`}
                  required
                />

                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeSubject(index)}
                    className="text-red-500 text-sm"
                  >
                    Remove
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
          Continue to Study Plan
        </button>
      </form>
    </div>
  );
};
