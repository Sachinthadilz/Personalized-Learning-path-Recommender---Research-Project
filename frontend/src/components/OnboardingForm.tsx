import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import type { AcademicModule, AcademicWeakSubject } from "../services/authService";
import { PlusCircle, Trash2, GraduationCap, BookOpen, CheckCircle, Pencil, X, AlertTriangle } from "lucide-react";

interface OnboardingFormProps {
  onComplete: () => void;
}

interface ModuleRow {
  id: number;
  name: string;
  credits: string;
}

interface WeakSubjectRow {
  id: number;
  name: string;
  grade: string;   // A/B/C/D/E/F
  marks: string;   // 0–100
}

const YEAR_OPTIONS = [
  { value: 1, label: "Year 1" },
  { value: 2, label: "Year 2" },
  { value: 3, label: "Year 3" },
  { value: 4, label: "Year 4" },
  { value: 5, label: "Year 5" },
  { value: 6, label: "Year 6" },
  { value: 7, label: "Year 7" },
  { value: 8, label: "Year 8" },
];

export default function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const { user: _user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState(1);
  const [modules, setModules] = useState<ModuleRow[]>([{ id: 1, name: "", credits: "" }]);
  const [nextId, setNextId] = useState(2);
  const [weakSubjects, setWeakSubjects] = useState<WeakSubjectRow[]>([]);
  const [nextWeakId, setNextWeakId] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ general?: string; modules?: string; university?: string }>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadProfile = () => {
    setIsLoading(true);
    setLoadError(false);
    authService
      .getAcademicProfile()
      .then((res) => {
        if (res.data) {
          setHasExisting(true);
          setUniversity(res.data.university);
          setDegree(res.data.degree || "");
          setYearOfStudy(res.data.yearOfStudy || 1);
          const rows: ModuleRow[] = (res.data.modules || []).map((m, i) => ({
            id: i + 1,
            name: m.name,
            credits: String(m.credits),
          }));
          setModules(rows.length > 0 ? rows : [{ id: 1, name: "", credits: "" }]);
          setNextId((res.data.modules?.length || 0) + 2);
          const weakRows: WeakSubjectRow[] = (res.data.weakSubjects || []).map((w, i) => ({
            id: i + 1,
            name: w.name,
            grade: w.grade,
            marks: String(w.marks),
          }));
          setWeakSubjects(weakRows);
          setNextWeakId((res.data.weakSubjects?.length || 0) + 2);
          setIsEditing(false);
        } else {
          // No profile yet — go straight to fill-in mode
          setHasExisting(false);
          setIsEditing(true);
        }
      })
      .catch(() => {
        // Show error instead of silently blanking the form
        setLoadError(true);
      })
      .finally(() => setIsLoading(false));
  };

  // Load existing profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const addModule = () => {
    setModules((prev) => [...prev, { id: nextId, name: "", credits: "" }]);
    setNextId((n) => n + 1);
  };

  const removeModule = (id: number) => {
    setModules((prev) => prev.filter((m) => m.id !== id));
  };

  const updateModule = (id: number, field: "name" | "credits", value: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const addWeakSubject = () => {
    setWeakSubjects((prev) => [...prev, { id: nextWeakId, name: "", grade: "F", marks: "" }]);
    setNextWeakId((n) => n + 1);
  };

  const removeWeakSubject = (id: number) => {
    setWeakSubjects((prev) => prev.filter((w) => w.id !== id));
  };

  const updateWeakSubject = (id: number, field: keyof Omit<WeakSubjectRow, "id">, value: string) => {
    setWeakSubjects((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: value } : w))
    );
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!university.trim()) newErrors.university = "University name is required.";
    const validModules = modules.filter((m) => m.name.trim());
    if (validModules.length === 0) {
      newErrors.modules = "Please add at least one module.";
    } else {
      const bad = validModules.find((m) => {
        const c = Number(m.credits);
        return !m.credits || isNaN(c) || c < 1 || c > 120;
      });
      if (bad) newErrors.modules = "Each module must have a valid credit value (1–120).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSavedSuccess(false);
    try {
      const payload: AcademicModule[] = modules
        .filter((m) => m.name.trim())
        .map((m) => ({ name: m.name.trim(), credits: Number(m.credits) }));

      const weakPayload: AcademicWeakSubject[] = weakSubjects
        .filter((w) => w.name.trim() && w.marks !== "")
        .map((w) => ({
          name: w.name.trim(),
          grade: w.grade,
          marks: Math.max(0, Math.min(100, Number(w.marks))),
        }));

      await authService.saveAcademicProfile({
        university: university.trim(),
        degree: degree.trim(),
        yearOfStudy,
        modules: payload,
        weakSubjects: weakPayload,
      });

      setHasExisting(true);
      setIsEditing(false);
      setSavedSuccess(true);
      onComplete();
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.message || "Failed to save. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setErrors({});
    if (!hasExisting) {
      setIsEditing(false);
      return;
    }
    // Re-fetch to restore original values
    setIsLoading(true);
    setLoadError(false);
    authService
      .getAcademicProfile()
      .then((res) => {
        if (res.data) {
          setUniversity(res.data.university);
          setDegree(res.data.degree || "");
          setYearOfStudy(res.data.yearOfStudy || 1);
          const rows: ModuleRow[] = (res.data.modules || []).map((m, i) => ({
            id: i + 1,
            name: m.name,
            credits: String(m.credits),
          }));
          setModules(rows.length > 0 ? rows : [{ id: 1, name: "", credits: "" }]);
          const weakRows: WeakSubjectRow[] = (res.data.weakSubjects || []).map((w, i) => ({
            id: i + 1,
            name: w.name,
            grade: w.grade,
            marks: String(w.marks),
          }));
          setWeakSubjects(weakRows);
          setIsEditing(false);
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  };

  // ── Loading spinner ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        <p className="text-sm text-gray-500">Loading your profile…</p>
      </div>
    );
  }

  // ── Load error ───────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
          <GraduationCap className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <p className="text-gray-800 font-semibold">Could not load your academic profile</p>
          <p className="text-sm text-gray-500 mt-1">Check that the backend is running and try again.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadProfile}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition"
          >
            Retry
          </button>
          <button
            onClick={() => { setLoadError(false); setHasExisting(false); setIsEditing(true); }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition"
          >
            Set up new profile
          </button>
        </div>
      </div>
    );
  }

  // ── View mode ────────────────────────────────────────────────────────────
  if (hasExisting && !isEditing) {
    const yearLabel = YEAR_OPTIONS.find((o) => o.value === yearOfStudy)?.label ?? `Year ${yearOfStudy}`;
    return (
      <div className="space-y-6">
        {savedSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Academic profile saved successfully.
          </div>
        )}

        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-white w-7 h-7" />
            <div>
              <p className="text-white font-bold text-lg leading-tight">{university}</p>
              {degree && <p className="text-indigo-100 text-sm">{degree}</p>}
            </div>
          </div>
          <span className="text-indigo-100 text-sm font-medium bg-white/20 px-3 py-1 rounded-full">{yearLabel}</span>
        </div>

        {/* Modules table */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-700">Modules</h3>
            <span className="text-xs text-gray-400">({modules.length})</span>
          </div>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-[1fr_80px] bg-gray-50 px-4 py-2 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Module Name</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Credits</span>
            </div>
            {modules.map((m, i) => (
              <div
                key={m.id}
                className={`grid grid-cols-[1fr_80px] px-4 py-3 ${i !== modules.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <span className="text-sm text-gray-800">{m.name}</span>
                <span className="text-sm text-gray-600 text-right font-medium">{m.credits}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Edit button */}
        <div className="flex justify-end">
          <button
            onClick={() => { setSavedSuccess(false); setIsEditing(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition"
          >
            <Pencil className="w-4 h-4" />
            Edit Profile
          </button>
        </div>

        {/* Weak Subjects table (view mode) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-gray-700">Weak Subjects</h3>
            {weakSubjects.length > 0 && (
              <span className="text-xs text-gray-400">({weakSubjects.length})</span>
            )}
          </div>

          {weakSubjects.length === 0 ? (
            <button
              onClick={() => { setSavedSuccess(false); setIsEditing(true); }}
              className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-red-200 bg-red-50/40 px-6 py-5 text-center hover:bg-red-50 hover:border-red-300 transition group"
            >
              <AlertTriangle className="w-6 h-6 text-red-300 group-hover:text-red-400 transition" />
              <p className="text-sm font-medium text-red-500 group-hover:text-red-600 transition">
                Add your weak subjects
              </p>
              <p className="text-xs text-gray-400">
                Track subjects you find difficult — your personalised learning plan will adapt to them.
              </p>
            </button>
          ) : (
            <div className="rounded-xl border border-red-100 overflow-hidden">
              <div className="grid grid-cols-[1fr_60px_80px] bg-red-50 px-4 py-2 border-b border-red-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Grade</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Marks</span>
              </div>
              {weakSubjects.map((w, i) => (
                <div
                  key={w.id}
                  className={`grid grid-cols-[1fr_60px_80px] px-4 py-3 ${i !== weakSubjects.length - 1 ? "border-b border-red-50" : ""}`}
                >
                  <span className="text-sm text-gray-800">{w.name}</span>
                  <span className="text-sm text-red-600 text-center font-bold">{w.grade}</span>
                  <span className="text-sm text-gray-600 text-right font-medium">{w.marks}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Edit / Fill mode ─────────────────────────────────────────────────────
  return (

    <>
        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="text-white w-8 h-8" />
              <h1 className="text-2xl font-bold text-white">
                {hasExisting ? "Edit Academic Profile" : "Set Up Academic Profile"}
              </h1>
            </div>
            <p className="text-indigo-100 text-sm">
              {hasExisting
                ? "Update your university details and modules below."
                : "Tell us about your academic background so we can personalise your experience."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {errors.general}
              </div>
            )}

            {/* University */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                University <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. University of Plymouth"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  errors.university ? "border-red-400 bg-red-50" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-indigo-400 transition text-sm`}
              />
              {errors.university && (
                <p className="mt-1 text-xs text-red-500">{errors.university}</p>
              )}
            </div>

            {/* Degree */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Degree / Programme
              </label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="e.g. BSc Computer Science"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition text-sm"
              />
            </div>

            {/* Year of Study */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Year of Study
              </label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition text-sm bg-white"
              >
                {YEAR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Modules */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    University Modules <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_100px_36px] gap-2 px-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Module Name</span>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Credits</span>
                  <span />
                </div>

                {modules.map((mod, idx) => (
                  <div key={mod.id} className="grid grid-cols-[1fr_100px_36px] gap-2 items-center">
                    <input
                      type="text"
                      value={mod.name}
                      onChange={(e) => updateModule(mod.id, "name", e.target.value)}
                      placeholder={`Module ${idx + 1}`}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition text-sm"
                    />
                    <input
                      type="number"
                      value={mod.credits}
                      onChange={(e) => updateModule(mod.id, "credits", e.target.value)}
                      placeholder="Credits"
                      min={1}
                      max={120}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeModule(mod.id)}
                      disabled={modules.length === 1}
                      className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Remove module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {errors.modules && (
                <p className="mt-1.5 text-xs text-red-500">{errors.modules}</p>
              )}

              <button
                type="button"
                onClick={addModule}
                className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition"
              >
                <PlusCircle className="w-4 h-4" />
                Add another module
              </button>
            </div>

            {/* ── Weak Subjects ──────────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Weak Subjects
                    <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span>
                  </span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                List subjects you find difficult with your grade and marks. This helps personalise your learning plan.
              </p>

              {weakSubjects.length > 0 && (
                <div className="space-y-2 mb-3">
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_80px_90px_36px] gap-2 px-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject Name</span>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Grade</span>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Marks %</span>
                    <span />
                  </div>

                  {weakSubjects.map((ws) => (
                    <div key={ws.id} className="grid grid-cols-[1fr_80px_90px_36px] gap-2 items-center">
                      <input
                        type="text"
                        value={ws.name}
                        onChange={(e) => updateWeakSubject(ws.id, "name", e.target.value)}
                        placeholder="e.g. Databases"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 transition text-sm"
                      />
                      <select
                        value={ws.grade}
                        onChange={(e) => updateWeakSubject(ws.id, "grade", e.target.value)}
                        className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 transition text-sm bg-white"
                      >
                        {["A", "B", "C", "D", "E", "F"].map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={ws.marks}
                        onChange={(e) => updateWeakSubject(ws.id, "marks", e.target.value)}
                        placeholder="0–100"
                        min={0}
                        max={100}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 transition text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeWeakSubject(ws.id)}
                        className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={addWeakSubject}
                className="flex items-center gap-1.5 text-sm text-red-500 font-medium hover:text-red-700 transition"
              >
                <PlusCircle className="w-4 h-4" />
                Add a weak subject
              </button>
            </div>

            {/* Submit */}
            <div className="pt-2 flex gap-3">
              {hasExisting && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {hasExisting ? "Save Changes" : "Complete Setup"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {!hasExisting && (
          <p className="text-center text-xs text-gray-400 mt-4">
            You can update this information later from your profile settings.
          </p>
        )}
    </>
  );
}
