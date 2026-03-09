// API helper for the Adaptive Visualizer – calls backend-auth (port 5001)
// All requests include the JWT Bearer token from localStorage.

import type { SubjectPerformance, QuizResult } from "./types";

const AUTH_API = "http://localhost:5001";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${AUTH_API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let payload: any;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!res.ok) {
    const msg =
      payload?.message || payload?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return (payload?.data ?? payload) as T;
}

export const adaptiveApi = {
  /** Fetch the current user's adaptive session */
  getSession: () =>
    request<{ weeklySubjects: SubjectPerformance[]; quizHistory: QuizResult[]; currentWeek: number }>(
      "GET",
      "/api/adaptive/session"
    ),

  /** Save / overwrite weekly subjects */
  saveSession: (weeklySubjects: SubjectPerformance[], currentWeek = 1) =>
    request("POST", "/api/adaptive/session", { weeklySubjects, currentWeek }),

  /** Append a quiz result */
  saveQuizResult: (result: QuizResult) =>
    request("POST", "/api/adaptive/quiz-result", result),

  /** Reset the session */
  resetSession: () => request("DELETE", "/api/adaptive/session"),
};
