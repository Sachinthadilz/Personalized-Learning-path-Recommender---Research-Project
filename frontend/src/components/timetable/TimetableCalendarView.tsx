import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import timetableAPI from '../../services/timetableApi';
import type { DailyTimetable } from '../../services/timetableApi';

function TimetableCalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timetables, setTimetables] = useState<DailyTimetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadMonthTimetables();
  }, [currentMonth]);

  const loadMonthTimetables = async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const result = await timetableAPI.getTimetable(start, end);
      if (result.success) setTimetables(result.timetables);
    } catch (err) {
      console.error('Error loading timetables:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimetableForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return timetables.find((t) => t.date === dateStr) ?? null;
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const selectedTimetable = selectedDate ? getTimetableForDate(selectedDate) : null;

  return (
    <div className="space-y-5 ttm-page-transition">
      {/* Calendar Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur-2xl opacity-20 animate-pulse-soft" />
        <div className="relative ttm-glass-card bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white p-5 shadow-glow-purple">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-xl">
                <FaCalendarAlt className="text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Full Timetable</h1>
                <p className="text-indigo-100 text-sm font-medium">View and manage your schedule</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-1.5">
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                  )
                }
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-110"
              >
                <FaChevronLeft className="text-lg" />
              </button>
              <div className="text-center min-w-[160px]">
                <p className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</p>
              </div>
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                  )
                }
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-110"
              >
                <FaChevronRight className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="ttm-card">
        {loading ? (
          <div className="text-center py-12">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-purple-600 animate-spin" />
            </div>
            <p className="text-base font-semibold text-gray-700">Loading calendar...</p>
          </div>
        ) : (
          <div>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                (day) => (
                  <div key={day} className="text-center">
                    <div className="font-bold text-gray-800 py-2 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200/50 text-sm">
                      <span className="hidden md:inline">{day}</span>
                      <span className="md:hidden">{day.slice(0, 3)}</span>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((day, idx) => {
                const timetable = getTimetableForDate(day);
                const isSelected =
                  selectedDate &&
                  format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                const today = isToday(day);

                return (
                  <button
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative p-3 rounded-xl border-2 transition-all duration-300 min-h-[90px] group
                      ${isSelected ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg scale-105' : 'border-gray-200/50'}
                      ${today ? 'ring-2 ring-blue-400/50 shadow-glow-blue' : ''}
                      ${!isSameMonth(day, currentMonth) ? 'opacity-30' : 'hover:border-indigo-400 hover:shadow-lg hover:-translate-y-0.5'}
                      ${timetable ? 'bg-gradient-to-br from-white to-gray-50' : 'bg-white/50'}
                    `}
                    style={{ animationDelay: `${idx * 10}ms` }}
                  >
                    <div className="text-left h-full flex flex-col">
                      <div
                        className={`text-base font-bold mb-1.5 ${
                          today ? 'text-blue-600' : isSelected ? 'text-indigo-600' : 'text-gray-700'
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                      {timetable && (
                        <div className="space-y-1.5 flex-1">
                          <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent text-xs">
                            {timetable.total_planned.toFixed(1)}h
                          </span>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-500 relative overflow-hidden"
                              style={{
                                width: `${Math.min(
                                  (timetable.total_completed / timetable.total_planned) * 100,
                                  100
                                )}%`,
                              }}
                            >
                              <div className="absolute inset-0 ttm-shimmer opacity-50" />
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 font-medium">
                            {timetable.allocations.length} subj.
                          </p>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Day Detail */}
      {selectedTimetable && selectedDate && (
        <div className="ttm-card animate-scale-in">
          <div className="mb-5 pb-4 border-b-2 border-gray-200">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-1">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <p className="text-gray-500 text-sm">Detailed breakdown</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedTimetable.allocations.map((allocation, index) => (
              <div
                key={allocation.subject_id}
                className="relative bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200/50 rounded-xl p-4 hover:shadow-lg hover:border-indigo-300/50 transition-all duration-300 hover:-translate-y-0.5 animate-slide-up overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h4 className="font-bold text-gray-800 text-base mb-3">{allocation.subject_name}</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Planned: <strong className="text-indigo-600">{allocation.planned_hours.toFixed(1)}h</strong>
                  </span>
                  <span className="text-gray-500">
                    Done: <strong className="text-green-600">{allocation.completed_hours.toFixed(1)}h</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TimetableCalendarView;
