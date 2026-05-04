import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import type {
  User,
  AdminQuizBankItem,
  AdminQuizQuestion,
} from "../services/authService";
import {
  Shield,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Crown,
  ShieldCheck,
  ShieldAlert,
  X,
  ArrowLeft,
  BookOpen,
  Pencil,
  Trash,
  Save,
  Eye,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  verifiedUsers: number;
  newUsersThisMonth: number;
  roleBreakdown: Record<string, number>;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type AdminView = "users" | "quizzes";

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: "bg-rose-100 text-rose-700 border-rose-200",
    moderator: "bg-amber-100 text-amber-700 border-amber-200",
    user: "bg-blue-100 text-blue-700 border-blue-200",
  };
  const icons: Record<string, React.ReactNode> = {
    admin: <Crown className="w-3 h-3" />,
    moderator: <ShieldCheck className="w-3 h-3" />,
    user: <Users className="w-3 h-3" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[role] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
    >
      {icons[role]}
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}

// ─── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${active ? "text-emerald-600" : "text-gray-400"}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${active ? "bg-emerald-500" : "bg-gray-300"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-start gap-3 mb-4">
          <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-white bg-rose-600 rounded-lg hover:bg-rose-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboard({ onBack }: { onBack?: () => void }) {
  const { user: currentUser } = useAuth();
  const [activeView, setActiveView] = useState<AdminView>("users");

  // Stats
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Users table
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Quiz bank
  const [quizzes, setQuizzes] = useState<AdminQuizBankItem[]>([]);
  const [quizPagination, setQuizPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [quizLoading, setQuizLoading] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizSearch, setQuizSearch] = useState("");
  const [debouncedQuizSearch, setDebouncedQuizSearch] = useState("");
  const [quizEditorLoading, setQuizEditorLoading] = useState(false);
  const [quizSaving, setQuizSaving] = useState(false);
  const [quizPreviewLoading, setQuizPreviewLoading] = useState(false);
  const [quizPreview, setQuizPreview] = useState<AdminQuizBankItem | null>(
    null,
  );
  const [quizEditor, setQuizEditor] = useState<{
    id: string;
    courseName: string;
    courseDescription: string;
    difficulty: string;
    skillsRaw: string;
    questions: AdminQuizQuestion[];
  } | null>(null);

  // In-row actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Confirm dialog
  const [confirm, setConfirm] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuizSearch(quizSearch), 350);
    return () => clearTimeout(t);
  }, [quizSearch]);

  // ── Load stats ─────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await authService.adminGetStats();
      setStats(res.data);
    } catch (err: any) {
      setStatsError(
        err?.response?.data?.message ?? err?.message ?? "Failed to load stats",
      );
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Load users ─────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async (page: number, searchTerm: string) => {
    setTableLoading(true);
    setTableError(null);
    try {
      const res = await authService.adminGetUsers({
        page,
        limit: 15,
        search: searchTerm || undefined,
      });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err: any) {
      setTableError(
        err?.response?.data?.message ?? err?.message ?? "Failed to load users",
      );
    } finally {
      setTableLoading(false);
    }
  }, []);

  const loadQuizzes = useCallback(async (page: number, searchTerm: string) => {
    setQuizLoading(true);
    setQuizError(null);
    try {
      const res = await authService.adminGetQuizzes({
        page,
        limit: 10,
        search: searchTerm || undefined,
      });
      setQuizzes(res.data.quizzes);
      setQuizPagination(res.data.pagination);
    } catch (err: any) {
      setQuizError(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to load quizzes",
      );
    } finally {
      setQuizLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadUsers(1, debouncedSearch);
  }, [debouncedSearch, loadUsers]);

  useEffect(() => {
    loadQuizzes(1, debouncedQuizSearch);
  }, [debouncedQuizSearch, loadQuizzes]);

  // ── Guard: only admin ──────────────────────────────────────────────────────
  if (currentUser?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ShieldAlert className="w-12 h-12 text-rose-400" />
        <p className="text-gray-600 font-medium">Admin access required.</p>
      </div>
    );
  }

  // ── Action helpers ─────────────────────────────────────────────────────────
  const flashSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleRoleChange = (
    userId: string,
    role: "user" | "admin" | "moderator",
  ) => {
    setConfirm({
      message: `Change this user's role to "${role}"?`,
      onConfirm: async () => {
        setConfirm(null);
        setActionLoading(userId);
        setActionError(null);
        try {
          await authService.adminUpdateRole(userId, role);
          flashSuccess("Role updated");
          loadUsers(pagination.page, debouncedSearch);
          loadStats();
        } catch (err: any) {
          setActionError(
            err?.response?.data?.message ?? "Failed to update role",
          );
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleStatusToggle = (user: User) => {
    const next = !user.isActive;
    setConfirm({
      message: `${next ? "Activate" : "Deactivate"} account for ${user.firstName} ${user.lastName}?`,
      onConfirm: async () => {
        setConfirm(null);
        setActionLoading(user.id);
        setActionError(null);
        try {
          await authService.adminUpdateStatus(user.id, next);
          flashSuccess(`Account ${next ? "activated" : "deactivated"}`);
          loadUsers(pagination.page, debouncedSearch);
          loadStats();
        } catch (err: any) {
          setActionError(
            err?.response?.data?.message ?? "Failed to update status",
          );
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleDelete = (user: User) => {
    setConfirm({
      message: `Permanently delete ${user.firstName} ${user.lastName}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        setActionLoading(user.id);
        setActionError(null);
        try {
          await authService.adminDeleteUser(user.id);
          flashSuccess("User deleted");
          // If we deleted the last item on a page, go back one
          const newPage =
            users.length === 1 && pagination.page > 1
              ? pagination.page - 1
              : pagination.page;
          loadUsers(newPage, debouncedSearch);
          loadStats();
        } catch (err: any) {
          setActionError(
            err?.response?.data?.message ?? "Failed to delete user",
          );
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const openQuizEditor = async (quizId: string) => {
    setQuizEditorLoading(true);
    setQuizError(null);
    try {
      const res = await authService.adminGetQuizById(quizId);
      const q = res.data;
      setQuizEditor({
        id: q.id,
        courseName: q.courseName,
        courseDescription: q.courseDescription || "",
        difficulty: q.difficulty || "",
        skillsRaw: (q.skills || []).join(", "),
        questions: (q.questions || []).map((item) => ({
          question: item.question,
          options: [...item.options],
          correctAnswer: item.correctAnswer,
        })),
      });
    } catch (err: any) {
      setQuizError(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to load quiz details",
      );
    } finally {
      setQuizEditorLoading(false);
    }
  };

  const openQuizPreview = async (quizId: string) => {
    setQuizPreviewLoading(true);
    setQuizError(null);
    try {
      const res = await authService.adminGetQuizById(quizId);
      setQuizPreview(res.data);
    } catch (err: any) {
      setQuizError(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to load quiz preview",
      );
    } finally {
      setQuizPreviewLoading(false);
    }
  };

  const updateEditorQuestion = (
    idx: number,
    field: "question" | "correctAnswer",
    value: string | number,
  ) => {
    setQuizEditor((prev) => {
      if (!prev) return null;
      const questions = [...prev.questions];
      questions[idx] = {
        ...questions[idx],
        [field]: value,
      };
      return { ...prev, questions };
    });
  };

  const updateEditorOption = (qIdx: number, optIdx: number, value: string) => {
    setQuizEditor((prev) => {
      if (!prev) return null;
      const questions = [...prev.questions];
      const options = [...questions[qIdx].options];
      options[optIdx] = value;
      questions[qIdx] = { ...questions[qIdx], options };
      return { ...prev, questions };
    });
  };

  const saveQuizEdits = async () => {
    if (!quizEditor) return;

    if (!quizEditor.courseName.trim()) {
      setQuizError("Course name is required");
      return;
    }

    if (quizEditor.questions.length !== 5) {
      setQuizError("Quiz must contain exactly 5 questions");
      return;
    }

    for (const q of quizEditor.questions) {
      if (!q.question.trim() || q.options.some((opt) => !opt.trim())) {
        setQuizError("All question texts and options are required");
        return;
      }
      if (q.correctAnswer < 0 || q.correctAnswer > 3) {
        setQuizError("Each question must have a valid correct option");
        return;
      }
    }

    setQuizSaving(true);
    setQuizError(null);
    try {
      await authService.adminUpdateQuiz(quizEditor.id, {
        courseName: quizEditor.courseName,
        courseDescription: quizEditor.courseDescription,
        difficulty: quizEditor.difficulty,
        skills: quizEditor.skillsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        questions: quizEditor.questions,
      });
      flashSuccess("Quiz updated successfully");
      setQuizEditor(null);
      loadQuizzes(quizPagination.page, debouncedQuizSearch);
    } catch (err: any) {
      setQuizError(
        err?.response?.data?.message ?? err?.message ?? "Failed to update quiz",
      );
    } finally {
      setQuizSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                  title="Back to dashboard"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Shield className="w-6 h-6 text-rose-600" />
                Admin Dashboard
              </h2>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Signed in as{" "}
              <span className="font-semibold text-gray-700">
                {currentUser.firstName} {currentUser.lastName}
              </span>
              &nbsp;·&nbsp;
              <RoleBadge role={currentUser.role} />
            </p>
          </div>
          <button
            onClick={() => {
              loadStats();
              if (activeView === "users") {
                loadUsers(pagination.page, debouncedSearch);
              } else {
                loadQuizzes(quizPagination.page, debouncedQuizSearch);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 inline-flex gap-2">
        <button
          onClick={() => setActiveView("users")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeView === "users"
              ? "bg-blue-700 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveView("quizzes")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeView === "quizzes"
              ? "bg-blue-700 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Quiz Bank
        </button>
      </div>

      {/* ── Stats cards ──────────────────────────────────────────────────── */}
      {statsError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {statsError}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total Users",
            value: stats?.totalUsers,
            icon: <Users className="w-5 h-5 text-blue-700" />,
            bg: "bg-blue-50",
          },
          {
            label: "Active",
            value: stats?.activeUsers,
            icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
            bg: "bg-emerald-50",
          },
          {
            label: "Inactive",
            value: stats?.inactiveUsers,
            icon: <UserX className="w-5 h-5 text-gray-500" />,
            bg: "bg-gray-50",
          },
          {
            label: "Verified",
            value: stats?.verifiedUsers,
            icon: <CheckCircle2 className="w-5 h-5 text-blue-600" />,
            bg: "bg-blue-50",
          },
          {
            label: "New this month",
            value: stats?.newUsersThisMonth,
            icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
            bg: "bg-amber-50",
          },
        ].map(({ label, value, icon, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
          >
            <div
              className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}
            >
              {icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {statsLoading ? (
                <span className="text-gray-300">—</span>
              ) : (
                (value ?? 0)
              )}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Role breakdown */}
      {!statsLoading && stats?.roleBreakdown && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">
            Role Breakdown
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.roleBreakdown).map(([role, count]) => (
              <div key={role} className="flex items-center gap-2">
                <RoleBadge role={role} />
                <span className="text-sm font-bold text-gray-700">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Toast banner ─────────────────────────────────────────────────── */}
      {(actionError || actionSuccess) && (
        <div
          className={`rounded-xl p-4 flex items-center gap-3 text-sm border ${actionSuccess ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}
        >
          {actionSuccess ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {actionSuccess ?? actionError}
          <button
            className="ml-auto"
            onClick={() => {
              setActionError(null);
              setActionSuccess(null);
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Users table ──────────────────────────────────────────────────── */}
      {activeView === "users" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          {/* Table toolbar */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <h3 className="text-base font-semibold text-gray-800 flex-1">
              All Users
              <span className="ml-2 text-xs font-normal text-gray-400">
                {pagination.total > 0 ? `${pagination.total} total` : ""}
              </span>
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Table */}
          {tableError ? (
            <div className="p-8 text-center text-sm text-red-600">
              {tableError}
            </div>
          ) : tableLoading ? (
            <div className="p-8 flex justify-center">
              <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-5 py-3 text-left font-medium">User</th>
                    <th className="px-5 py-3 text-left font-medium">Role</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium">Verified</th>
                    <th className="px-5 py-3 text-left font-medium hidden md:table-cell">
                      Last Login
                    </th>
                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser.id;
                    const busy = actionLoading === u.id;
                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-gray-50 transition-colors ${busy ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        {/* User info */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                              {u.firstName[0]}
                              {u.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {u.firstName} {u.lastName}
                                {isSelf && (
                                  <span className="ml-1.5 text-xs text-blue-600 font-normal">
                                    (you)
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Role */}
                        <td className="px-5 py-3">
                          <RoleBadge role={u.role} />
                        </td>
                        {/* Status */}
                        <td className="px-5 py-3">
                          <StatusDot active={u.isActive ?? true} />
                        </td>
                        {/* Verified */}
                        <td className="px-5 py-3">
                          {u.isEmailVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                              Unverified
                            </span>
                          )}
                        </td>
                        {/* Last login */}
                        <td className="px-5 py-3 text-xs text-gray-400 hidden md:table-cell">
                          {u.lastLogin
                            ? new Date(u.lastLogin).toLocaleDateString()
                            : "Never"}
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-3">
                          {isSelf ? (
                            <span className="text-xs text-gray-300">—</span>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {/* Role change buttons */}
                              <div className="flex gap-1">
                                {(["user", "moderator", "admin"] as const).map(
                                  (r) => (
                                    <button
                                      key={r}
                                      disabled={u.role === r}
                                      onClick={() => handleRoleChange(u.id, r)}
                                      className={`px-2 py-1 text-xs rounded font-medium transition-all ${
                                        u.role === r
                                          ? "bg-gray-100 text-gray-400 cursor-default"
                                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                      }`}
                                    >
                                      {r.charAt(0).toUpperCase() + r.slice(1)}
                                    </button>
                                  ),
                                )}
                              </div>

                              {/* Status toggle */}
                              <button
                                onClick={() => handleStatusToggle(u)}
                                className={`px-2 py-1 text-xs rounded font-medium transition-all ${
                                  u.isActive
                                    ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                }`}
                              >
                                {u.isActive ? "Deactivate" : "Activate"}
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={() => handleDelete(u)}
                                className="px-2 py-1 text-xs rounded font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    loadUsers(pagination.page - 1, debouncedSearch)
                  }
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    loadUsers(pagination.page + 1, debouncedSearch)
                  }
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Quiz bank table ─────────────────────────────────────────────── */}
      {activeView === "quizzes" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <h3 className="text-base font-semibold text-gray-800 flex-1">
              Question Bank
              <span className="ml-2 text-xs font-normal text-gray-400">
                {quizPagination.total > 0
                  ? `${quizPagination.total} total`
                  : ""}
              </span>
            </h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search course or id..."
                value={quizSearch}
                onChange={(e) => setQuizSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {quizError ? (
            <div className="p-8 text-center text-sm text-red-600">
              {quizError}
            </div>
          ) : quizLoading ? (
            <div className="p-8 flex justify-center">
              <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
            </div>
          ) : quizzes.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              No quizzes found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-5 py-3 text-left font-medium">Course</th>
                    <th className="px-5 py-3 text-left font-medium">Source</th>
                    <th className="px-5 py-3 text-left font-medium">Updated</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {quizzes.map((quiz) => (
                    <tr
                      key={quiz.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">
                          {quiz.courseName}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            quiz.createdBy === "admin"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-blue-100 text-blue-700 border-blue-200"
                          }`}
                        >
                          {quiz.createdBy === "admin"
                            ? "Admin edited"
                            : "AI generated"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {new Date(quiz.updatedAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openQuizPreview(quiz.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Preview
                          </button>
                          <button
                            onClick={() => openQuizEditor(quiz.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit Quiz
                          </button>
                          <button
                            onClick={() => {
                              setConfirm({
                                message: `Permanently delete quiz for \"${quiz.courseName}\"? This cannot be undone.`,
                                onConfirm: async () => {
                                  setConfirm(null);
                                  setActionLoading(quiz.id);
                                  setActionError(null);
                                  try {
                                    await authService.adminDeleteQuiz(quiz.id);
                                    flashSuccess("Quiz deleted");
                                    // If deleted last item on page, go back one
                                    const newPage =
                                      quizzes.length === 1 &&
                                      quizPagination.page > 1
                                        ? quizPagination.page - 1
                                        : quizPagination.page;
                                    loadQuizzes(newPage, debouncedQuizSearch);
                                  } catch (err: any) {
                                    setActionError(
                                      err?.response?.data?.message ??
                                        "Failed to delete quiz",
                                    );
                                  } finally {
                                    setActionLoading(null);
                                  }
                                },
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {quizPagination.totalPages > 1 && (
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <span>
                Page {quizPagination.page} of {quizPagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={quizPagination.page <= 1}
                  onClick={() =>
                    loadQuizzes(quizPagination.page - 1, debouncedQuizSearch)
                  }
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={quizPagination.page >= quizPagination.totalPages}
                  onClick={() =>
                    loadQuizzes(quizPagination.page + 1, debouncedQuizSearch)
                  }
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(quizPreviewLoading || quizPreview) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* ── Header Banner ─────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Quiz Preview</h3>
                  <p className="text-emerald-100 text-xs mt-0.5">
                    {quizPreview
                      ? `${(quizPreview.questions || []).length} questions · ${quizPreview.courseName || "Untitled"}`
                      : "Loading..."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setQuizPreview(null);
                  setQuizPreviewLoading(false);
                }}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quizPreviewLoading || !quizPreview ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
                <p className="text-sm text-gray-400">Loading preview…</p>
              </div>
            ) : (
              <>
                {/* ── Scrollable Body ────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* ── Course Metadata ──────────────────────────────── */}
                  <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                      Course Information
                    </h4>
                    <h3 className="text-base font-bold text-gray-900">
                      {quizPreview.courseName}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {quizPreview.courseId || quizPreview.courseKey}
                    </p>
                    {(quizPreview.difficulty ||
                      (quizPreview.skills &&
                        quizPreview.skills.length > 0)) && (
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {quizPreview.difficulty && (
                          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                            {quizPreview.difficulty}
                          </span>
                        )}
                        {quizPreview.skills &&
                          quizPreview.skills.length > 0 &&
                          quizPreview.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* ── Questions ─────────────────────────────────────── */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                      Questions ({(quizPreview.questions || []).length})
                    </h4>

                    <div className="space-y-4">
                      {(quizPreview.questions || []).map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
                        >
                          {/* Question Header */}
                          <div className="flex items-center gap-3 px-5 py-3 bg-gray-50/60 border-b border-gray-100">
                            <div className="w-8 h-8 bg-blue-700 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {qIdx + 1}
                            </div>
                            <p className="text-sm font-semibold text-gray-800 flex-1">
                              {q.question}
                            </p>
                          </div>

                          {/* Options */}
                          <div className="p-5 space-y-2.5">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm border transition-colors ${
                                  q.correctAnswer === optIdx
                                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-800"
                                    : "bg-gray-50/50 border-gray-100 text-gray-700"
                                }`}
                              >
                                <span
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    q.correctAnswer === optIdx
                                      ? "bg-emerald-500 text-white"
                                      : "bg-gray-200 text-gray-500"
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="flex-1">{opt}</span>
                                {q.correctAnswer === optIdx && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Sticky Footer ──────────────────────────────────── */}
                <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
                  <p className="text-xs text-gray-400 hidden sm:block">
                    {(quizPreview.questions || []).length} questions · Read-only
                    preview
                  </p>
                  <button
                    onClick={() => {
                      setQuizPreview(null);
                      setQuizPreviewLoading(false);
                    }}
                    className="ml-auto px-5 py-2.5 text-sm border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 font-medium transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {(quizEditorLoading || quizEditor) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* ── Header Banner ─────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 px-6 py-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Edit Quiz Bank Entry
                  </h3>
                  <p className="text-blue-100 text-xs mt-0.5">
                    {quizEditor
                      ? `${quizEditor.questions.length} questions · ${quizEditor.courseName || "Untitled"}`
                      : "Loading..."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!quizSaving) {
                    setQuizEditor(null);
                    setQuizEditorLoading(false);
                  }
                }}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quizEditorLoading || !quizEditor ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
                <p className="text-sm text-gray-400">Loading quiz data…</p>
              </div>
            ) : (
              <>
                {/* ── Scrollable Body ────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* ── Course Metadata Section ─────────────────────── */}
                  <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                      Course Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Course Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          value={quizEditor.courseName}
                          onChange={(e) =>
                            setQuizEditor((prev) =>
                              prev
                                ? { ...prev, courseName: e.target.value }
                                : null,
                            )
                          }
                          className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                          placeholder="e.g. Introduction to Machine Learning"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Difficulty
                        </label>
                        <input
                          value={quizEditor.difficulty}
                          onChange={(e) =>
                            setQuizEditor((prev) =>
                              prev
                                ? { ...prev, difficulty: e.target.value }
                                : null,
                            )
                          }
                          className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                          placeholder="e.g. Intermediate"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Skills{" "}
                          <span className="text-gray-400 font-normal">
                            (comma separated)
                          </span>
                        </label>
                        <input
                          value={quizEditor.skillsRaw}
                          onChange={(e) =>
                            setQuizEditor((prev) =>
                              prev
                                ? { ...prev, skillsRaw: e.target.value }
                                : null,
                            )
                          }
                          className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                          placeholder="e.g. Python, Data Science, ML"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Course Description
                        </label>
                        <textarea
                          value={quizEditor.courseDescription}
                          onChange={(e) =>
                            setQuizEditor((prev) =>
                              prev
                                ? { ...prev, courseDescription: e.target.value }
                                : null,
                            )
                          }
                          rows={2}
                          className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition resize-none"
                          placeholder="Brief description of the course…"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Questions Section ────────────────────────────── */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Questions ({quizEditor.questions.length})
                      </h4>
                      <span className="text-xs text-gray-400">
                        Green border = correct answer
                      </span>
                    </div>

                    <div className="space-y-4">
                      {quizEditor.questions.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* Question Header */}
                          <div className="flex items-center gap-3 px-5 py-3 bg-gray-50/60 border-b border-gray-100">
                            <div className="w-8 h-8 bg-blue-700 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {qIdx + 1}
                            </div>
                            <span className="text-sm font-semibold text-gray-700 flex-1">
                              Question {qIdx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-400 hidden sm:block">
                                Correct:
                              </label>
                              <select
                                value={q.correctAnswer}
                                onChange={(e) =>
                                  updateEditorQuestion(
                                    qIdx,
                                    "correctAnswer",
                                    Number(e.target.value),
                                  )
                                }
                                className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                              >
                                <option value={0}>Option A</option>
                                <option value={1}>Option B</option>
                                <option value={2}>Option C</option>
                                <option value={3}>Option D</option>
                              </select>
                            </div>
                          </div>

                          {/* Question Body */}
                          <div className="p-5">
                            <textarea
                              value={q.question}
                              onChange={(e) =>
                                updateEditorQuestion(
                                  qIdx,
                                  "question",
                                  e.target.value,
                                )
                              }
                              rows={2}
                              placeholder="Enter the question text…"
                              className="w-full mb-4 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition resize-none"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="relative">
                                  <span
                                    className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold ${
                                      q.correctAnswer === optIdx
                                        ? "text-emerald-600"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <input
                                    value={opt}
                                    onChange={(e) =>
                                      updateEditorOption(
                                        qIdx,
                                        optIdx,
                                        e.target.value,
                                      )
                                    }
                                    className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition ${
                                      q.correctAnswer === optIdx
                                        ? "border-emerald-300 bg-emerald-50/50"
                                        : "border-gray-200 bg-white"
                                    }`}
                                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                  />
                                  {q.correctAnswer === optIdx && (
                                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Sticky Footer ──────────────────────────────────── */}
                <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
                  <p className="text-xs text-gray-400 hidden sm:block">
                    {quizEditor.questions.length} questions · All changes are
                    saved to the server
                  </p>
                  <div className="flex gap-3 ml-auto">
                    <button
                      onClick={() => setQuizEditor(null)}
                      disabled={quizSaving}
                      className="px-5 py-2.5 text-sm border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 disabled:opacity-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveQuizEdits}
                      disabled={quizSaving}
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-sm bg-blue-700 text-white rounded-xl hover:bg-blue-800 disabled:opacity-50 font-medium shadow-sm transition-colors"
                    >
                      {quizSaving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
