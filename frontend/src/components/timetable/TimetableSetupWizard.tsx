import { useState, useEffect } from 'react';
import { FaRocket, FaCheck, FaPlus, FaTrash, FaStar, FaClock, FaBook } from 'react-icons/fa';
import { User, CalendarDays, BookOpen, Clock3, BarChart3, Layers, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import timetableAPI from '../../services/timetableApi';
import { getSavedLearningPaths, type SavedLearningPath } from '../../api';
import { authService, type AcademicProfile } from '../../services/authService';

/**
 * Priority tiers based on credit value.
 * Higher credits → higher-intensity gradient to visually signal priority.
 */
const CREDIT_PRIORITY_COLORS: Record<number, string> = {
  6: 'from-violet-600 to-purple-700',
  5: 'from-indigo-600 to-blue-700',
  4: 'from-blue-500 to-cyan-600',
  3: 'from-teal-500 to-emerald-600',
  2: 'from-green-400 to-teal-500',
  1: 'from-slate-400 to-gray-500',
};

function getCreditColor(credits: number): string {
  return CREDIT_PRIORITY_COLORS[credits] ?? CREDIT_PRIORITY_COLORS[3];
}

const SUBJECT_COLORS = [
  'from-violet-600 to-purple-700',
  'from-indigo-600 to-blue-700',
  'from-blue-500 to-cyan-600',
  'from-teal-500 to-emerald-600',
  'from-green-400 to-teal-500',
  'from-slate-400 to-gray-500',
  'from-sky-500 to-blue-600',
  'from-purple-500 to-indigo-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-green-600',
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

        derived.push({
          subject_id: course.id ?? `course_${derived.length + 1}`,
          name: course.name,
          credits,
          remaining_needed: credits * HOURS_PER_CREDIT,
          color: getCreditColor(credits),
        });

        if (derived.length >= 10) break;
      }
      if (derived.length >= 10) break;
    }

    // Sort by credit value descending — higher credits = higher priority
    derived.sort((a, b) => b.credits - a.credits);

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

  const stepIcons = [BookOpen, Layers, Clock3];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 rounded-2xl p-8 mb-8 overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10">
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
            <CalendarDays className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2">
            Adaptive Timetable Planner
          </h1>
          <p className="text-blue-200 text-sm">
            Build a personalised study schedule that adapts to your progress
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8 gap-0">
        {[
          { num: 1, label: 'Basic Info' },
          { num: 2, label: 'Subjects' },
          { num: 3, label: 'Schedule' },
        ].map((s, idx) => {
          const Icon = stepIcons[idx];
          const done = step > s.num;
          const active = step === s.num;
          return (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold transition-all duration-300 border-2 ${
                  done ? 'bg-blue-700 border-blue-700 text-white shadow-md'
                  : active ? 'bg-white border-blue-700 text-blue-700 shadow-lg scale-105'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}>
                  {done ? <FaCheck className="text-xs" /> : <Icon className="w-4 h-4" />}
                </div>
                <p className={`text-xs font-semibold mt-1.5 ${
                  done || active ? 'text-blue-700' : 'text-gray-400'
                }`}>{s.label}</p>
              </div>
              {idx < 2 && (
                <div className="w-20 h-px mx-2 mb-4 bg-gray-200 relative overflow-hidden rounded-full">
                  <div className={`absolute inset-0 bg-blue-600 transition-all duration-500 ${step > s.num ? 'translate-x-0' : '-translate-x-full'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {/* Step 1 – Basic Info */}
        {step === 1 && (
          <div className="space-y-6 animate-scale-in">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Basic Information</h2>
              <p className="text-gray-500 text-sm">Tell us about yourself and your study timeline</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm font-medium text-gray-800"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                  Start Date
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm text-gray-800"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                  End Date
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm text-gray-800"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {formData.startDate && formData.endDate && (
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                <Clock3 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-700 font-medium">
                  Study period: <span className="font-bold">{durationDays} days</span>
                </p>
              </div>
            )}
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
              <div className="space-y-4 pt-2 border-t-2 border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Subjects ({formData.subjects.length}/10)
                  </p>
                  <div className="flex items-center gap-2">
                    {academicProfile && (
                      <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        ✓ Credits matched from academic profile
                      </span>
                    )}
                    <span className="text-xs text-gray-400 font-medium">Sorted by priority</span>
                  </div>
                </div>

                {/* Priority legend */}
                <div className="flex flex-wrap gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <span className="text-xs text-gray-500 font-semibold mr-1 self-center">Priority:</span>
                  {[
                    { credits: 6, label: '6 cr – Highest' },
                    { credits: 4, label: '4 cr – High' },
                    { credits: 3, label: '3 cr – Medium' },
                    { credits: 1, label: '1 cr – Low' },
                  ].map(({ credits, label }) => (
                    <span
                      key={credits}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getCreditColor(credits)}`}
                    >
                      <FaStar className="text-[8px]" />
                      {label}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.subjects.map((subject, index) => {
                    const isProfileMatch =
                      academicProfile &&
                      matchModuleCredits(subject.name, academicProfile.modules) !== null;
                    const priorityLabel =
                      subject.credits >= 6
                        ? 'Highest Priority'
                        : subject.credits >= 5
                        ? 'Very High Priority'
                        : subject.credits >= 4
                        ? 'High Priority'
                        : subject.credits >= 3
                        ? 'Medium Priority'
                        : subject.credits >= 2
                        ? 'Low Priority'
                        : 'Minimal Priority';

                    return (
                      <div
                        key={subject.subject_id}
                        className={`relative rounded-2xl overflow-hidden shadow-lg border border-white/10 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Top color band showing priority tier */}
                        <div className={`bg-gradient-to-r ${getCreditColor(subject.credits)} px-4 py-3 flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                              <FaBook className="text-white text-xs" />
                            </div>
                            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                              {priorityLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Credit star indicators */}
                            {Array.from({ length: Math.min(subject.credits, 6) }).map((_, i) => (
                              <FaStar key={i} className="text-yellow-300 text-[9px]" />
                            ))}
                            <button
                              onClick={() => removeSubject(index)}
                              className="ml-2 p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-colors"
                              title="Remove subject"
                            >
                              <FaTrash className="text-[10px]" />
                            </button>
                          </div>
                        </div>

                        {/* Card body */}
                        <div className="bg-white px-4 py-3 space-y-3">
                          {/* Subject name input */}
                          <div>
                            <input
                              type="text"
                              className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200 font-semibold text-gray-800 text-sm placeholder-gray-400"
                              placeholder={`Subject ${index + 1}`}
                              value={subject.name}
                              onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                            />
                            {isProfileMatch && (
                              <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                                <FaCheck className="text-[9px]" /> Auto-matched from academic profile
                              </p>
                            )}
                          </div>

                          {/* Credits & Hours — read-only badges */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${getCreditColor(subject.credits)} flex items-center justify-center flex-shrink-0`}>
                                <FaStar className="text-white text-[9px]" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide">Credits</p>
                                <p className="text-lg font-extrabold text-blue-800 leading-none">{subject.credits}</p>
                              </div>
                            </div>
                            <div className="flex-1 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <FaClock className="text-white text-[9px]" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">Study Hours</p>
                                <p className="text-lg font-extrabold text-indigo-800 leading-none">{subject.remaining_needed}<span className="text-xs font-semibold text-indigo-400">h</span></p>
                              </div>
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
            <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">Schedule Summary</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-blue-300" />
                    <p className="text-xs text-blue-200 font-semibold uppercase tracking-wide">Subjects</p>
                  </div>
                  <p className="text-2xl font-extrabold">
                    {formData.subjects.filter((s) => s.name).length}
                    <span className="text-base font-normal text-white/50">/{formData.subjects.length || 10}</span>
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CalendarDays className="w-3.5 h-3.5 text-blue-300" />
                    <p className="text-xs text-blue-200 font-semibold uppercase tracking-wide">Duration</p>
                  </div>
                  <p className="text-2xl font-extrabold">
                    {durationDays}<span className="text-sm font-normal text-white/50"> days</span>
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock3 className="w-3.5 h-3.5 text-blue-300" />
                    <p className="text-xs text-blue-200 font-semibold uppercase tracking-wide">Total Hours</p>
                  </div>
                  <p className="text-2xl font-extrabold">
                    {formData.subjects.reduce((sum, s) => sum + s.remaining_needed, 0).toFixed(0)}
                    <span className="text-sm font-normal text-white/50">h</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-5 border-t border-gray-100">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                (step === 1 && !formData.name) ||
                (step === 2 && formData.subjects.filter((s) => s.name.trim()).length === 0)
              }
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating…</span>
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
