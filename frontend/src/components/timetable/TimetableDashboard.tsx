import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { CalendarDays, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import timetableAPI from '../../services/timetableApi';
import type { DailyTimetable } from '../../services/timetableApi';
import TimetableTodaySchedule from './TimetableTodaySchedule';
import TimetableProgressOverview from './TimetableProgressOverview';
import TimetableCalendarView from './TimetableCalendarView';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  color: string;
  iconBg: string;
}

function StatCard({ icon, label, value, color, iconBg }: StatCardProps) {
  return (
    <div className={`${color} rounded-2xl p-5 border border-transparent hover:shadow-lg transition-all`}>
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs font-medium opacity-70 uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}

function TimetableDashboard() {
  const [loading, setLoading] = useState(true);
  const [todayTimetable, setTodayTimetable] = useState<DailyTimetable | null>(null);
  const [weekTimetables, setWeekTimetables] = useState<DailyTimetable[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'calendar'>('dashboard');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const result = await timetableAPI.getTimetable(today, weekLater);
      if (result.success) {
        const todayData = result.timetables.find((t) => t.date === today) ?? null;
        setTodayTimetable(todayData);
        setWeekTimetables(result.timetables);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletionUpdate = async (subjectId: string, completedHours: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await timetableAPI.updateCompletion(today, subjectId, completedHours);
      await loadDashboardData();
    } catch (err: unknown) {
      alert('Error updating completion: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-200 border-t-blue-700 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-600">Loading your timetable...</p>
          <p className="text-xs text-gray-400 mt-1">Preparing your personalized schedule</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h3>
        <p className="text-red-600 text-sm mb-6">{error}</p>
        <button
          onClick={loadDashboardData}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/20 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-amber-400/15 rounded-full translate-y-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white mb-1">Timetable Planner 📅</h1>
            <p className="text-blue-200 text-sm font-medium">Let's make today productive</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                view === 'dashboard' ? 'bg-white text-blue-700 shadow-md' : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                view === 'calendar' ? 'bg-white text-blue-700 shadow-md' : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {view === 'calendar' ? (
        <TimetableCalendarView />
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<CalendarDays className="w-5 h-5 text-blue-700" />}
              label="This Week"
              value={`${weekTimetables.length} days`}
              color="bg-blue-50 text-blue-700"
              iconBg="bg-blue-100"
            />
            <StatCard
              icon={<Clock className="w-5 h-5 text-teal-700" />}
              label="Today's Plan"
              value={todayTimetable ? `${todayTimetable.total_planned.toFixed(1)}h` : '0h'}
              color="bg-teal-50 text-teal-700"
              iconBg="bg-teal-100"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5 text-sky-700" />}
              label="Completed"
              value={todayTimetable ? `${todayTimetable.total_completed.toFixed(1)}h` : '0h'}
              color="bg-sky-50 text-sky-700"
              iconBg="bg-sky-100"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
              label="Progress"
              value={
                todayTimetable && todayTimetable.total_planned > 0
                  ? `${Math.round((todayTimetable.total_completed / todayTimetable.total_planned) * 100)}%`
                  : '0%'
              }
              color="bg-amber-50 text-amber-600"
              iconBg="bg-amber-100"
            />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TimetableTodaySchedule
                timetable={todayTimetable}
                onUpdateCompletion={handleCompletionUpdate}
              />
            </div>
            <div className="space-y-4">
              <TimetableProgressOverview weekTimetables={weekTimetables} />
            </div>
          </div>

          {/* This week */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">This Week's Schedule</h2>
            <div className="space-y-2.5">
              {weekTimetables.map((timetable) => (
                <div
                  key={timetable.date}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-center bg-blue-700 text-white rounded-xl p-2 min-w-[50px] shadow-sm">
                      <p className="text-xs font-semibold">
                        {new Date(timetable.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className="text-lg font-bold">{new Date(timetable.date).getDate()}</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{timetable.day_of_week}</p>
                      <p className="text-xs text-gray-400">{timetable.allocations.length} subjects</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-blue-700">
                      {timetable.total_planned.toFixed(1)}h
                    </p>
                    <p className="text-xs text-gray-400">{timetable.total_completed.toFixed(1)}h done</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TimetableDashboard;
