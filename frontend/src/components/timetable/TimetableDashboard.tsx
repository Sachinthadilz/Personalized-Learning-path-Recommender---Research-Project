import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { FaCalendar, FaClock, FaCheckCircle, FaChartLine } from 'react-icons/fa';
import timetableAPI from '../../services/timetableApi';
import type { DailyTimetable } from '../../services/timetableApi';
import TimetableTodaySchedule from './TimetableTodaySchedule';
import TimetableProgressOverview from './TimetableProgressOverview';
import TimetableCalendarView from './TimetableCalendarView';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
  delay: string;
}

function StatCard({ icon, label, value, color, delay }: StatCardProps) {
  const colorMap = {
    blue:   'from-blue-500 to-blue-600 shadow-glow-blue',
    purple: 'from-purple-500 to-indigo-600 shadow-glow-purple',
    green:  'from-green-500 to-teal-600 shadow-glow-green',
    orange: 'from-orange-500 to-red-500 shadow-glow-orange',
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl p-4 transition-all duration-500 hover:scale-105 hover:-translate-y-1 hover:shadow-xl animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[color]} opacity-90`} />
      <div className="relative text-white">
        <div className="flex items-center justify-between mb-2">
          <span className="bg-white/20 p-2 rounded-lg">{icon}</span>
        </div>
        <p className="text-xs text-white/80 font-semibold">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
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
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-indigo-600 animate-spin" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Loading your timetable...</p>
          <p className="text-sm text-gray-500 mt-2">Preparing your personalized schedule</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ttm-card bg-red-50 border-red-200 p-8 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <button onClick={loadDashboardData} className="ttm-btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 ttm-page-transition">
      {/* Welcome Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur-2xl opacity-20 animate-pulse-soft" />
        <div className="relative ttm-glass-card bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold animate-slide-up">Timetable Planner 📅</h1>
              <p className="text-blue-100 text-sm font-medium">Let's make today productive</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  view === 'dashboard' ? 'bg-white text-indigo-700' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  view === 'calendar' ? 'bg-white text-indigo-700' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Calendar
              </button>
            </div>
          </div>
        </div>
      </div>

      {view === 'calendar' ? (
        <TimetableCalendarView />
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<FaCalendar className="text-xl" />} label="This Week" value={`${weekTimetables.length} days`} color="blue" delay="100" />
            <StatCard icon={<FaClock className="text-xl" />} label="Today's Plan" value={todayTimetable ? `${todayTimetable.total_planned.toFixed(1)}h` : '0h'} color="purple" delay="200" />
            <StatCard icon={<FaCheckCircle className="text-xl" />} label="Completed" value={todayTimetable ? `${todayTimetable.total_completed.toFixed(1)}h` : '0h'} color="green" delay="300" />
            <StatCard
              icon={<FaChartLine className="text-xl" />}
              label="Progress"
              value={
                todayTimetable && todayTimetable.total_planned > 0
                  ? `${Math.round((todayTimetable.total_completed / todayTimetable.total_planned) * 100)}%`
                  : '0%'
              }
              color="orange"
              delay="400"
            />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
          <div className="ttm-card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">This Week's Schedule</h2>
            <div className="space-y-3">
              {weekTimetables.map((timetable, index) => (
                <div
                  key={timetable.date}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200/50 hover:shadow-lg hover:border-blue-300/50 transition-all duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg p-2 min-w-[50px] shadow-md">
                      <p className="text-xs font-semibold">
                        {new Date(timetable.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className="text-lg font-bold">{new Date(timetable.date).getDate()}</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{timetable.day_of_week}</p>
                      <p className="text-xs text-gray-500">{timetable.allocations.length} subjects</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {timetable.total_planned.toFixed(1)}h
                    </p>
                    <p className="text-xs text-gray-500">{timetable.total_completed.toFixed(1)}h done</p>
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
