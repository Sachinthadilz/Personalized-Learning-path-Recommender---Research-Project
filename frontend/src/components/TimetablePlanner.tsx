import { useState, useEffect } from 'react';
import TimetableSetupWizard from './timetable/TimetableSetupWizard';
import TimetableDashboard from './timetable/TimetableDashboard';
import timetableAPI from '../services/timetableApi';

/**
 * TimetablePlanner
 *
 * Top-level wrapper for the Timetable Planner module.
 * Timetables are saved per authenticated user in the Node.js backend.
 */
function TimetablePlanner() {
  const [setupDone, setSetupDone] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  // On mount, verify from the backend whether this user already has a timetable.
  // This avoids the issue where a previous user's localStorage flag persists
  // for a newly registered user on the same browser.
  useEffect(() => {
    timetableAPI
      .getTimetable()
      .then((res) => {
        const hasTimetable = !!(res.data && res.timetables && res.timetables.length > 0);
        setSetupDone(hasTimetable);
      })
      .catch(() => {
        // On error (e.g. not found / 404), treat as no timetable → show wizard
        setSetupDone(false);
      })
      .finally(() => setIsChecking(false));
  }, []);

  const handleSetupComplete = () => {
    setSetupDone(true);
  };

  const handleReset = async () => {
    try {
      await timetableAPI.deleteTimetable();
    } catch {
      // ignore errors — still reset locally
    }
    setSetupDone(false);
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-200 border-t-blue-700 mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading timetable…</p>
        </div>
      </div>
    );
  }

  if (!setupDone) {
    return <TimetableSetupWizard onComplete={handleSetupComplete} />;
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-600 transition-colors px-4 py-2 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200"
        >
          Reset / Regenerate Timetable
        </button>
      </div>
      <TimetableDashboard />
    </div>
  );
}

export default TimetablePlanner;
