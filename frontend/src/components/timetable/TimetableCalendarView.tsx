import { useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 rounded-2xl p-5 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/4 w-28 h-28 bg-amber-400/10 rounded-full translate-y-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Full Timetable</h1>
              <p className="text-blue-200 text-sm font-medium">View and manage your schedule</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-1.5">
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                )
              }
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center min-w-[160px]">
              <p className="text-lg font-bold">{format(currentMonth, 'MMMM yyyy')}</p>
            </div>
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                )
              }
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-200 border-t-blue-700 mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-600">Loading calendar...</p>
          </div>
        ) : (
          <div>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                (day) => (
                  <div key={day} className="text-center">
                    <div className="font-bold text-gray-600 py-2 bg-gray-50 rounded-xl text-xs uppercase tracking-wide">
                      <span className="hidden md:inline">{day}</span>
                      <span className="md:hidden">{day.slice(0, 3)}</span>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((day) => {
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
                      ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-100'}
                      ${today ? 'ring-2 ring-blue-400/50' : ''}
                      ${!isSameMonth(day, currentMonth) ? 'opacity-30' : 'hover:border-blue-300 hover:shadow-md'}
                      ${timetable ? 'bg-white' : 'bg-gray-50/50'}
                    `}
                  >
                    <div className="text-left h-full flex flex-col">
                      <div
                        className={`text-sm font-bold mb-1.5 ${
                          today ? 'text-blue-700' : isSelected ? 'text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                      {timetable && (
                        <div className="space-y-1.5 flex-1">
                          <span className="font-bold text-blue-700 text-xs">
                            {timetable.total_planned.toFixed(1)}h
                          </span>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  (timetable.total_completed / timetable.total_planned) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 font-medium">
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-scale-in">
          <div className="mb-5 pb-4 border-b border-gray-100">
            <h3 className="text-xl font-extrabold text-gray-900 mb-1">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <p className="text-gray-400 text-sm">Detailed breakdown</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedTimetable.allocations.map((allocation) => (
              <div
                key={allocation.subject_id}
                className="bg-gray-50 border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all duration-300"
              >
                <h4 className="font-bold text-gray-900 text-sm mb-3">{allocation.subject_name}</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Planned: <strong className="text-blue-700">{allocation.planned_hours.toFixed(1)}h</strong>
                  </span>
                  <span className="text-gray-500">
                    Done: <strong className="text-emerald-600">{allocation.completed_hours.toFixed(1)}h</strong>
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
