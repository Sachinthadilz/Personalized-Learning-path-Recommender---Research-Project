import { Flame, Trophy, TrendingUp, Lightbulb } from 'lucide-react';
import type { DailyTimetable } from '../../services/timetableApi';

interface Props {
  weekTimetables: DailyTimetable[];
}

function TimetableProgressOverview({ weekTimetables }: Props) {
  const totalPlanned = weekTimetables.reduce((sum, t) => sum + t.total_planned, 0);
  const totalCompleted = weekTimetables.reduce((sum, t) => sum + t.total_completed, 0);
  const completionRate = totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0;

  const daysCompleted = weekTimetables.filter(
    (t) => t.total_completed >= t.total_planned && t.total_planned > 0
  ).length;

  return (
    <div className="space-y-4">
      {/* Weekly Stats */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 rounded-2xl p-5 text-white overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-blue-100">Weekly Stats</h3>
            <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-blue-200 font-medium mb-1">Total Hours</p>
              <p className="text-2xl font-extrabold">
                {totalCompleted.toFixed(1)}{' '}
                <span className="text-base text-blue-300">/ {totalPlanned.toFixed(1)}h</span>
              </p>
            </div>

            <div className="relative w-full bg-blue-900/40 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${Math.min(completionRate, 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-blue-200 font-medium">Completion Rate</p>
              <p className="text-base font-bold">{completionRate.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Days Completed */}
      <div className="relative bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 text-white overflow-hidden shadow-sm">
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-amber-400/20 rounded-full translate-y-1/3 translate-x-1/4" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-amber-100 font-semibold mb-1 uppercase tracking-wide">
              Days Completed
            </p>
            <p className="text-3xl font-extrabold">{daysCompleted}</p>
          </div>
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Achievement badge */}
      {completionRate >= 80 && (
        <div className="relative bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl p-5 text-white overflow-hidden shadow-sm animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm mb-0.5">Great Progress!</p>
              <p className="text-xs text-amber-100">You're crushing it! 🎉</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Tip */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <h4 className="font-bold text-blue-800 mb-1 text-sm">Quick Tip</h4>
            <p className="text-xs text-blue-600 leading-relaxed">
              Update completion hours daily to help the AI adapt your schedule!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimetableProgressOverview;
