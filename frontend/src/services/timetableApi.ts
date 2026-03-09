/**
 * API Service for Adaptive Timetable
 *
 * - Python backend (port 8080): ML generation only
 * - Node.js auth backend (port 5001): save / get / update (authenticated)
 */

import axios from 'axios';

// Python FastAPI backend — timetable generation
const PYTHON_API_URL = (import.meta.env.VITE_API_URL as string) || 'http://127.0.0.1:5000';

// Node.js auth backend — storage + auth
const AUTH_API_URL = (import.meta.env.VITE_AUTH_API_URL as string) || 'http://localhost:5001';

const pythonApi = axios.create({
  baseURL: PYTHON_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

const authApi = axios.create({
  baseURL: AUTH_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to auth backend requests automatically
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SubjectInput {
  subject_id: string;
  name: string;
  credits: number;
  remaining_needed: number;
}

export interface GenerateTimetablePayload {
  student_id: string;
  name: string;
  start_date: string;
  end_date: string;
  subjects: SubjectInput[];
  hours_per_day: Record<string, number>;
}

export interface DailyAllocation {
  subject_id: string;
  subject_name: string;
  planned_hours: number;
  completed_hours: number;
  status: 'planned' | 'in_progress' | 'completed' | 'missed';
}

export interface DailyTimetable {
  date: string;
  day_of_week: string;
  total_hours_available: number;
  allocations: DailyAllocation[];
  total_planned: number;
  total_completed: number;
  is_locked: boolean;
}

export interface GeneratedTimetable {
  success: boolean;
  student_id: string;
  name: string;
  start_date: string;
  end_date: string;
  subjects: SubjectInput[];
  days: DailyTimetable[];
}

export interface TimetableResult {
  success: boolean;
  timetables: DailyTimetable[];
  data: {
    student_id: string;
    name: string;
    start_date: string;
    end_date: string;
    subjects: SubjectInput[];
  } | null;
}

// ── API methods ───────────────────────────────────────────────────────────────

const timetableAPI = {
  /**
   * Step 1 — call Python backend to generate timetable (ML / rule-based)
   * Step 2 — call Node.js backend to save it to the user's account
   */
  generateAndSave: async (payload: GenerateTimetablePayload): Promise<TimetableResult> => {
    // Generate via Python ML backend
    const genRes = await pythonApi.post<GeneratedTimetable>('/timetable/generate', payload);
    const generated = genRes.data;

    // Save to Node.js auth backend (linked to logged-in user)
    const saveRes = await authApi.post('/api/timetable', {
      student_id: generated.student_id,
      name: generated.name,
      start_date: generated.start_date,
      end_date: generated.end_date,
      subjects: generated.subjects,
      days: generated.days,
    });

    return {
      success: true,
      data: saveRes.data.data,
      timetables: generated.days,
    };
  },

  /** Get the logged-in user's saved timetable (from Node.js backend) */
  getTimetable: async (
    startDate?: string,
    endDate?: string
  ): Promise<TimetableResult> => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const res = await authApi.get<TimetableResult>('/api/timetable', { params });
    return res.data;
  },

  /** Update completion hours for a subject on a specific day */
  updateCompletion: async (
    date: string,
    subjectId: string,
    completedHours: number
  ): Promise<Record<string, unknown>> => {
    const res = await authApi.patch<Record<string, unknown>>('/api/timetable/completion', {
      date,
      subject_id: subjectId,
      completed_hours: completedHours,
    });
    return res.data;
  },

  /** Delete (reset) the logged-in user's timetable */
  deleteTimetable: async (): Promise<void> => {
    await authApi.delete('/api/timetable');
  },
};

export default timetableAPI;

