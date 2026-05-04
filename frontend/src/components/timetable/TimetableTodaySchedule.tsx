import { useState } from 'react';
import { Clock, CheckCircle2, Pencil } from 'lucide-react';
import type { DailyTimetable } from '../../services/timetableApi';

interface Props {
  timetable: DailyTimetable | null;
  onUpdateCompletion: (subjectId: string, completedHours: number) => void;
}

function TimetableTodaySchedule({ timetable, onUpdateCompletion }: Props) {
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [completedHours, setCompletedHours] = useState(0);

  if (!timetable || timetable.allocations.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-extrabold text-gray-900 mb-2">
          No classes today!
        </h3>
        <p className="text-gray-500 text-sm">Enjoy your free day or catch up on other tasks</p>
      </div>
    );
  }

  const progress =
    timetable.total_planned > 0
      ? (timetable.total_completed / timetable.total_planned) * 100
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Today's Schedule</h2>
            <p className="text-xs text-gray-400">Track your daily progress</p>
          </div>
          <div className="bg-blue-700 text-white px-4 py-2 rounded-xl shadow-sm">
            <p className="text-xs font-semibold text-blue-200">Completion</p>
            <p className="text-2xl font-bold">{Math.round(progress)}%</p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="relative">
          <div className="flex justify-between text-xs mb-2 font-semibold">
            <span className="text-gray-500">Overall Progress</span>
            <span className="text-blue-700">
              {timetable.total_completed.toFixed(1)}h / {timetable.total_planned.toFixed(1)}h
            </span>
          </div>
          <div className="relative w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 transition-all duration-700 ease-out rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Subject Allocations */}
      <div className="space-y-3">
        {timetable.allocations.map((allocation) => {
          const isEditing = editingSubject === allocation.subject_id;
          const subjectProgress =
            allocation.planned_hours > 0
              ? (allocation.completed_hours / allocation.planned_hours) * 100
              : 0;

          return (
            <div
              key={allocation.subject_id}
              className="bg-gray-50 border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm mb-1.5">
                    {allocation.subject_name}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg font-medium text-blue-700">
                      <Clock className="w-3 h-3" />
                      {allocation.planned_hours.toFixed(1)}h
                    </span>
                    {allocation.status === 'completed' && (
                      <span className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Done
                      </span>
                    )}
                  </div>
                </div>

                {!isEditing ? (
                  <button
                    onClick={() => {
                      setEditingSubject(allocation.subject_id);
                      setCompletedHours(allocation.completed_hours);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-all text-xs font-semibold"
                  >
                    <Pencil className="w-3 h-3" />
                    Update
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max={allocation.planned_hours}
                      step="0.5"
                      value={completedHours}
                      onChange={(e) => setCompletedHours(parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1.5 border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-center text-sm"
                    />
                    <button
                      onClick={() => {
                        onUpdateCompletion(allocation.subject_id, completedHours);
                        setEditingSubject(null);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-semibold text-xs hover:bg-emerald-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingSubject(null)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-semibold text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Subject Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 rounded-full ${
                    subjectProgress >= 100
                      ? 'bg-emerald-500'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(subjectProgress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 font-medium mt-1.5">
                <span className="font-bold text-blue-700">{Math.round(subjectProgress)}%</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TimetableTodaySchedule;
