import { useState, useEffect } from 'react';
import { FaRocket, FaCheck, FaPlus, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import timetableAPI from '../../services/timetableApi';
import { getSavedLearningPaths, type SavedLearningPath } from '../../api';
import { authService, type AcademicProfile } from '../../services/authService';

const SUBJECT_COLORS = [
  'from-blue-200 to-blue-300',
  'from-purple-200 to-purple-300',
  'from-pink-200 to-pink-300',
  'from-red-200 to-red-300',
  'from-orange-200 to-orange-300',
  'from-yellow-200 to-yellow-300',
  'from-green-200 to-green-300',
  'from-teal-200 to-teal-300',
  'from-cyan-200 to-cyan-300',
  'from-indigo-200 to-indigo-300',
];

/** Credit value → estimated study hours (15 h per credit is standard academic convention) */
const HOURS_PER_CREDIT = 15;

interface SubjectEntry {
  subject_id: string;
  name: string;
  credits: number;
  remaining_needed: number;
  color: string;
}

interface FormData {
  studentId: string;
  name: string;
  startDate: string;
  endDate: string;
  subjects: SubjectEntry[];
  hoursPerDay: Record<string, number>;
}

interface Props {
  onComplete: () => void;
}

/**
 * Find the best-matching academic module for a course name.
 * Returns the module's credit value if a match is found, else null.
 */
function matchModuleCredits(
  courseName: string,
  modules: AcademicProfile['modules'],
): number | null {
  if (!modules || modules.length === 0) return null;
  const lower = courseName.toLowerCase();
  // Exact or substring match
  for (const mod of modules) {
    const modLower = mod.name.toLowerCase();
    if (lower.includes(modLower) || modLower.includes(lower)) {
      return mod.credits;
    }
  }
  // Word-level overlap — if at least one significant word matches
  const courseWords = lower.split(/\W+/).filter((w) => w.length > 3);
  for (const mod of modules) {
    const modWords = mod.name.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    if (courseWords.some((w) => modWords.includes(w))) {
      return mod.credits;
    }
  }
  return null;
}

function TimetableSetupWizard({ onComplete }: Props) {
  const { user } = useAuth();
  const loggedInName = user?.fullName ?? (user ? `${user.firstName} ${user.lastName}`.trim() : '');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // ── Learning path + academic profile state ─────────────────────────────────
  const [savedPaths, setSavedPaths] = useState<SavedLearningPath[]>([]);
  const [academicProfile, setAcademicProfile] = useState<AcademicProfile | null>(null);
  const [selectedPathIds, setSelectedPathIds] = useState<Set<string>>(new Set());
  const [pathsLoading, setPathsLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    studentId: `STUDENT${Date.now()}`,
    name: loggedInName,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subjects: [],
    hoursPerDay: {
      Monday: 4,
      Tuesday: 4,
      Wednesday: 4,
      Thursday: 4,
      Friday: 3,
      Saturday: 6,
      Sunday: 6,
    },
  });

  // ── Load saved paths + academic profile on mount ──────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [pathsResult, profileResult] = await Promise.allSettled([
          getSavedLearningPaths(),
          authService.getAcademicProfile(),
        ]);
        if (pathsResult.status === 'fulfilled') {
          setSavedPaths(pathsResult.value.data.learningPaths ?? []);
        }
        if (profileResult.status === 'fulfilled') {
          setAcademicProfile(profileResult.value.data ?? null);
        }
      } catch {
        // Non-fatal
      } finally {
        setPathsLoading(false);
      }
    })();
  }, []);

  // ── Re-derive subjects whenever selected paths or academic profile change ──
  useEffect(() => {
    const seen = new Set<string>();
    const derived: SubjectEntry[] = [];

    for (const pathId of selectedPathIds) {
      const path = savedPaths.find((p) => p.pathId === pathId);
      if (!path) continue;

      for (const course of path.courses) {
        const key = course.name.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);

        const matchedCredits =
          academicProfile
            ? matchModuleCredits(course.name, academicProfile.modules)
            : null;
        const credits = matchedCredits ?? 3;
        const colorIdx = derived.length % SUBJECT_COLORS.length;

        derived.push({
          subject_id: course.id ?? `course_${derived.length + 1}`,
          name: course.name,
          credits,
          remaining_needed: credits * HOURS_PER_CREDIT,
          color: SUBJECT_COLORS[colorIdx],
        });

        if (derived.length >= 10) break;
      }
      if (derived.length >= 10) break;
    }

    setFormData((prev) => ({ ...prev, subjects: derived }));
  }, [selectedPathIds, savedPaths, academicProfile]);

  const togglePath = (pathId: string) => {
    setSelectedPathIds((prev) => {
      const next = new Set(prev);
      if (next.has(pathId)) {
        next.delete(pathId);
      } else {
        next.add(pathId);
      }
      return next;
    });
  };

  const handleSubjectChange = (index: number, field: keyof SubjectEntry, value: string | number) => {
    const newSubjects = [...formData.subjects];
    newSubjects[index] = { ...newSubjects[index], [field]: value };
    // Recalculate hours when credits change
    if (field === 'credits') {
      newSubjects[index].remaining_needed = (value as number) * HOURS_PER_CREDIT;
    }
    setFormData({ ...formData, subjects: newSubjects });
  };

  const addBlankSubject = () => {
    if (formData.subjects.length >= 10) return;
    const idx = formData.subjects.length;
    setFormData((prev) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        {
          subject_id: `manual_${Date.now()}`,
          name: '',
          credits: 3,
          remaining_needed: 3 * HOURS_PER_CREDIT,
          color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length],
        },
      ],
    }));
  };

  const removeSubject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }))
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const apiData = {
        student_id: formData.studentId,
        name: formData.name,
        start_date: formData.startDate,
        end_date: formData.endDate,
        subjects: formData.subjects.map((s) => ({
          subject_id: s.subject_id,
          name: s.name,
          credits: s.credits,
          remaining_needed: s.remaining_needed,
        })),
        hours_per_day: formData.hoursPerDay,
      };

      const result = await timetableAPI.generateAndSave(apiData);
      if (result.success) {
        onComplete();
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert('Error generating timetable: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const durationDays = Math.ceil(
    (new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="max-w-4xl mx-auto ttm-page-transition">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block mb-4">
          <div className="text-5xl animate-bounce-gentle">🎓</div>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
          Welcome to Your Adaptive Timetable
        </h1>
        <p className="text-gray-600 text-base">
          Let's create a personalized study schedule that adapts to your progress
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[
            { num: 1, label: 'Basic Info' },
            { num: 2, label: 'Subjects' },
            { num: 3, label: 'Schedule' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className="text-center">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-500 transform text-sm ${
                    step >= s.num
                      ? 'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white shadow-glow-blue scale-110'
                      : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <p
                  className={`text-xs font-semibold mt-1.5 transition-colors duration-300 ${
                    step >= s.num ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {s.label}
                </p>
              </div>
              {idx < 2 && (
                <div className="relative w-16 h-1 mx-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ${
                      step > s.num ? 'translate-x-0' : '-translate-x-full'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="ttm-card">
        {/* Step 1 – Basic Info */}
        {step === 1 && (
          <div className="space-y-5 animate-scale-in">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Basic Information</h2>
              <p className="text-gray-500 text-sm">Tell us about yourself and your study timeline</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Your Name
              </label>
              <input
                type="text"
                className="ttm-input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Course Start Date
                </label>
                <input
                  type="date"
                  className="ttm-input-field"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Course End Date
                </label>
                <input
                  type="date"
                  className="ttm-input-field"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 – Select Learning Paths */}
        {step === 2 && (
          <div className="space-y-6 animate-scale-in">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Select Your Learning Paths</h2>
              <p className="text-gray-500 text-sm">
                Choose your saved learning paths. Courses will be mapped to subjects — credit values
                are automatically matched from your academic profile.
              </p>
            </div>

            {/* ── Saved paths list ─────────────────────────────────────────── */}
            {pathsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                <span className="ml-3 text-gray-500 text-sm">Loading your paths…</span>
              </div>
            ) : savedPaths.length === 0 ? (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 text-center">
                <p className="text-amber-700 font-semibold text-sm">
                  No saved learning paths found.
                </p>
                <p className="text-amber-600 text-xs mt-1">
                  Save a learning path first, or add subjects manually below.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Your Paths</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {savedPaths.map((path) => {
                    const selected = selectedPathIds.has(path.pathId);
                    return (
                      <button
                        key={path.pathId}
                        onClick={() => togglePath(path.pathId)}
                        className={`relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          selected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                        }`}
                      >
                        {/* Checkbox indicator */}
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                            selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                          }`}
                        >
                          {selected && <FaCheck className="text-white text-xs" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">
                            {path.pathName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {path.courses.length} course{path.courses.length !== 1 ? 's' : ''} ·{' '}
                            <span className="capitalize">{path.pathType.replace('_', ' ')}</span>
                            {path.targetSkill && ` · ${path.targetSkill}`}
                          </p>
                          {/* Show academic profile match hint */}
                          {academicProfile && (() => {
                            const matched = path.courses.filter(
                              (c) => matchModuleCredits(c.name, academicProfile.modules) !== null,
                            );
                            return matched.length > 0 ? (
                              <p className="text-xs text-green-600 font-semibold mt-1">
                                ✓ {matched.length} course{matched.length !== 1 ? 's' : ''} matched
                                your academic modules
                              </p>
                            ) : null;
                          })()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Derived subject cards ─────────────────────────────────────── */}
            {formData.subjects.length > 0 && (
              <div className="space-y-3 pt-2 border-t-2 border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Subjects ({formData.subjects.length}/10)
                  </p>
                  {academicProfile && (
                    <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      Credits matched from academic profile
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formData.subjects.map((subject, index) => {
                    const isProfileMatch =
                      academicProfile &&
                      matchModuleCredits(subject.name, academicProfile.modules) !== null;
                    return (
                      <div
                        key={subject.subject_id}
                        className={`ttm-subject-card bg-gradient-to-br ${subject.color}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              className="flex-1 px-3 py-2 bg-white bg-opacity-25 backdrop-blur-sm border-2 border-white border-opacity-40 rounded-lg text-white placeholder-white placeholder-opacity-80 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-30 focus:bg-opacity-30 transition-all duration-300 font-semibold text-sm"
                              placeholder={`Subject ${index + 1}`}
                              value={subject.name}
                              onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                            />
                            <button
                              onClick={() => removeSubject(index)}
                              className="flex-shrink-0 p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-colors"
                              title="Remove subject"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                          {isProfileMatch && (
                            <p className="text-xs text-white/80 font-semibold -mt-1">
                              ✓ Credits matched from academic profile
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-white font-semibold mb-1">
                                Credits
                              </label>
                              <select
                                className="w-full px-2 py-1.5 bg-white bg-opacity-25 backdrop-blur-sm border-2 border-white border-opacity-40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-30 font-semibold text-sm"
                                value={subject.credits}
                                onChange={(e) =>
                                  handleSubjectChange(index, 'credits', parseInt(e.target.value))
                                }
                              >
                                {[1, 2, 3, 4, 5, 6].map((c) => (
                                  <option key={c} value={c} className="text-gray-800 font-semibold">
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-white font-semibold mb-1">
                                Hours
                              </label>
                              <input
                                type="number"
                                className="w-full px-2 py-1.5 bg-white bg-opacity-25 backdrop-blur-sm border-2 border-white border-opacity-40 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-30 font-semibold text-sm"
                                value={subject.remaining_needed}
                                onChange={(e) =>
                                  handleSubjectChange(
                                    index,
                                    'remaining_needed',
                                    parseFloat(e.target.value),
                                  )
                                }
                                min="1"
                                step="0.5"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Add manual subject button ─────────────────────────────────── */}
            {formData.subjects.length < 10 && (
              <button
                onClick={addBlankSubject}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-500 transition-all text-sm font-semibold"
              >
                <FaPlus className="text-xs" />
                Add subject manually
              </button>
            )}
          </div>
        )}

        {/* Step 3 – Schedule */}
        {step === 3 && (
          <div className="space-y-5 animate-scale-in">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Daily Study Hours</h2>
              <p className="text-gray-600 text-sm">How many hours can you dedicate each day?</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(formData.hoursPerDay).map(([day, hours], index) => (
                <div
                  key={day}
                  className="space-y-2 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    {day}
                  </label>
                  <input
                    type="number"
                    className="ttm-input-field text-center font-bold"
                    value={hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hoursPerDay: {
                          ...formData.hoursPerDay,
                          [day]: parseFloat(e.target.value),
                        },
                      })
                    }
                    min="0"
                    max="12"
                    step="0.5"
                  />
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="ttm-glass-card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200/50 p-5">
              <h3 className="text-lg font-bold text-blue-800 mb-4">📊 Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/70 rounded-lg p-3 border border-blue-200/50">
                  <p className="text-xs text-blue-600 font-bold mb-1 uppercase">Subjects</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {formData.subjects.filter((s) => s.name).length}
                    <span className="text-lg text-gray-500">/{formData.subjects.length || 10}</span>
                  </p>
                </div>
                <div className="bg-white/70 rounded-lg p-3 border border-blue-200/50">
                  <p className="text-xs text-blue-600 font-bold mb-1 uppercase">Duration</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {durationDays}
                    <span className="text-sm text-gray-500"> days</span>
                  </p>
                </div>
                <div className="bg-white/70 rounded-lg p-3 border border-blue-200/50">
                  <p className="text-xs text-blue-600 font-bold mb-1 uppercase">Total Hours</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {formData.subjects.reduce((sum, s) => sum + s.remaining_needed, 0).toFixed(1)}
                    <span className="text-sm text-gray-500">h</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-5 border-t-2 border-gray-200">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="ttm-btn-secondary">
              ← Previous
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="ttm-btn-primary"
              disabled={
                (step === 1 && !formData.name) ||
                (step === 2 && formData.subjects.filter((s) => s.name.trim()).length === 0)
              }
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              className="ttm-btn-primary flex items-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="relative w-4 h-4">
                    <div className="absolute inset-0 rounded-full border-2 border-white/30" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-white animate-spin" />
                  </div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FaRocket />
                  <span>Generate Timetable</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimetableSetupWizard;
