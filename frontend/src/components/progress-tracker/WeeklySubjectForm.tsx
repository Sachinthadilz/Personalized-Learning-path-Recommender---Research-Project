import React, { useState } from "react";
import type { SubjectPerformance } from "../../types";

interface Props {
  subjects: string[];
  onSubmit: (data: SubjectPerformance[]) => void;
  onSkip: () => void;
}

type SubjectRow = {
  id: string;
  name: string;
  grade: string;
};

export const WeeklySubjectForm: React.FC<Props> = ({ onSubmit }) => {
  const [rows, setRows] = useState<SubjectRow[]>([
    { id: "row-1", name: "", grade: "" },
  ]);
  const [savedData, setSavedData] = useState<SubjectPerformance[] | null>(null);

  const updateRow = (
    id: string,
    field: "name" | "grade",
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addNewRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${prev.length + 1}`,
        name: "",
        grade: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const cleaned = rows
      .map((row, index) => ({
        id: `week-${index}`,
        name: row.name.trim(),
        grade: row.grade.trim(),
      }))
      .filter((row) => row.name !== "" && row.grade !== "");

    if (cleaned.length === 0) return;

    setSavedData(cleaned);
  };

  const handleContinue = () => {
    if (savedData) {
      onSubmit(savedData);
    }
  };

  const handleEditForm = () => {
    setSavedData(null);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-3xl space-y-6">
        {!savedData ? (
          <form onSubmit={handleSave} className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800">
              Subject Info Form
            </h2>

            <p className="text-sm text-slate-600">
              Enter subject names and results, then save.
            </p>

            <div className="space-y-4">
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-slate-200 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">
                      Subject {index + 1}
                    </h3>

                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) =>
                        updateRow(row.id, "name", e.target.value)
                      }
                      placeholder="Enter subject"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Result / Grade
                    </label>
                    <input
                      type="text"
                      value={row.grade}
                      onChange={(e) =>
                        updateRow(row.id, "grade", e.target.value)
                      }
                      placeholder="Enter result or grade"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={addNewRow}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                + Add Another Subject
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800">
              Subject Summary
            </h2>

            <p className="text-sm text-slate-600">
              Review the saved subjects and continue.
            </p>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                      Result / Grade
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {savedData.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 text-sm text-slate-800">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800">
                        {item.grade}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleEditForm}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                Edit Form
              </button>

              <button
                type="button"
                onClick={handleContinue}
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};