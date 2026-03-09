import { FaFire, FaTrophy, FaChartLine } from 'react-icons/fa';
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
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl blur-xl opacity-30 animate-pulse-soft" />
        <div className="relative ttm-card bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 text-white shadow-glow-purple">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">Weekly Stats</h3>
            <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg">
              <FaChartLine className="text-xl" />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-purple-100 font-semibold mb-1">Total Hours</p>
              <p className="text-2xl font-bold drop-shadow-lg">
                {totalCompleted.toFixed(1)}{' '}
                <span className="text-lg opacity-75">/ {totalPlanned.toFixed(1)}h</span>
              </p>
            </div>

            <div className="relative w-full bg-purple-700/50 rounded-full h-2 overflow-hidden shadow-inner">
              <div
                className="h-full bg-white rounded-full transition-all duration-700 shadow-lg relative overflow-hidden"
                style={{ width: `${Math.min(completionRate, 100)}%` }}
              >
                <div className="absolute inset-0 ttm-shimmer" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-purple-100 font-semibold">Completion Rate</p>
              <p className="text-lg font-bold">{completionRate.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Days Completed */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl blur-xl opacity-30 animate-pulse-soft" />
        <div className="relative ttm-card bg-gradient-to-br from-orange-600 via-orange-500 to-red-600 text-white shadow-glow-orange">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-orange-100 font-semibold mb-1 uppercase tracking-wide">
                Days Completed
              </p>
              <p className="text-3xl font-bold drop-shadow-lg">{daysCompleted}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg">
              <FaFire className="text-3xl animate-pulse-soft" />
            </div>
          </div>
        </div>
      </div>

      {/* Achievement badge */}
      {completionRate >= 80 && (
        <div className="relative overflow-hidden animate-scale-in">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl blur-xl opacity-40 animate-pulse-soft" />
          <div className="relative ttm-card bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 text-white shadow-hard">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <FaTrophy className="text-2xl animate-bounce-gentle" />
              </div>
              <div>
                <p className="font-bold text-sm mb-0.5">Great Progress!</p>
                <p className="text-xs opacity-95">You're crushing it! 🎉</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Tip */}
      <div className="ttm-card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200/50">
        <div className="flex items-start space-x-2">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-bold text-blue-800 mb-1 text-sm">Quick Tip</h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              Update completion hours daily to help the AI adapt your schedule!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimetableProgressOverview;
