import { useState } from 'react';
import { FaClock, FaCheck, FaEdit } from 'react-icons/fa';
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
      <div className="ttm-card text-center py-10 animate-scale-in">
        <div className="text-6xl mb-4 animate-bounce-gentle">🎉</div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          No classes today!
        </h3>
        <p className="text-gray-600 text-sm">Enjoy your free day or catch up on other tasks</p>
      </div>
    );
  }

  const progress =
    timetable.total_planned > 0
      ? (timetable.total_completed / timetable.total_planned) * 100
      : 0;

  return (
    <div className="ttm-card">
      <div className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Today's Schedule</h2>
            <p className="text-xs text-gray-500">Track your daily progress</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <p className="text-xs font-semibold opacity-90">Completion</p>
            <p className="text-2xl font-bold">{Math.round(progress)}%</p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="relative">
          <div className="flex justify-between text-xs mb-2 font-semibold">
            <span className="text-gray-600">Overall Progress</span>
            <span className="text-blue-600">
              {timetable.total_completed.toFixed(1)}h / {timetable.total_planned.toFixed(1)}h
            </span>
          </div>
          <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-700 ease-out rounded-full shadow-lg"
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              <div className="absolute inset-0 ttm-shimmer opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Subject Allocations */}
      <div className="space-y-3">
        {timetable.allocations.map((allocation, index) => {
          const isEditing = editingSubject === allocation.subject_id;
          const subjectProgress =
            allocation.planned_hours > 0
              ? (allocation.completed_hours / allocation.planned_hours) * 100
              : 0;

          return (
            <div
              key={allocation.subject_id}
              className="relative bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200/50 rounded-xl p-4 hover:shadow-lg hover:border-blue-300/50 transition-all duration-300 hover:-translate-y-0.5 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-xl" />

              <div className="relative flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-base mb-1.5">
                    {allocation.subject_name}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-gray-600">
                    <span className="flex items-center bg-blue-50 px-2 py-1 rounded-md font-medium">
                      <FaClock className="mr-1 text-blue-600" />
                      {allocation.planned_hours.toFixed(1)}h
                    </span>
                    {allocation.status === 'completed' && (
                      <span className="flex items-center bg-green-50 px-2 py-1 rounded-md text-green-600 font-semibold">
                        <FaCheck className="mr-1" />
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
                    className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-glow-blue transition-all duration-300 font-semibold text-sm group transform hover:scale-105"
                  >
                    <FaEdit className="group-hover:rotate-12 transition-transform duration-300" />
                    <span>Update</span>
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
                      className="w-16 px-2 py-1.5 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-center text-sm"
                    />
                    <button
                      onClick={() => {
                        onUpdateCompletion(allocation.subject_id, completedHours);
                        setEditingSubject(null);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingSubject(null)}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Subject Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-700 relative overflow-hidden ${
                    subjectProgress >= 100
                      ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600'
                      : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600'
                  }`}
                  style={{ width: `${Math.min(subjectProgress, 100)}%` }}
                >
                  <div className="absolute inset-0 ttm-shimmer opacity-40" />
                </div>
              </div>
              <p className="text-xs text-gray-600 font-medium mt-1.5">
                <span className="font-bold text-blue-600">{Math.round(subjectProgress)}%</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TimetableTodaySchedule;
