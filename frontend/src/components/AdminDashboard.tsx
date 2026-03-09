import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import type { User } from "../services/authService";
import {
  Shield,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Crown,
  ShieldCheck,
  ShieldAlert,
  MoreVertical,
  X,
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

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin:     "bg-rose-100 text-rose-700 border-rose-200",
    moderator: "bg-amber-100 text-amber-700 border-amber-200",
    user:      "bg-indigo-100 text-indigo-700 border-indigo-200",
  };
  const icons: Record<string, React.ReactNode> = {
    admin:     <Crown className="w-3 h-3" />,
    moderator: <ShieldCheck className="w-3 h-3" />,
    user:      <Users className="w-3 h-3" />,
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
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${active ? "text-emerald-600" : "text-gray-400"}`}>
      <span className={`w-2 h-2 rounded-full ${active ? "bg-emerald-500" : "bg-gray-300"}`} />
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
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
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

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();

  // Stats
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Users table
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // In-row actions
  const [actionMenuUser, setActionMenuUser] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Confirm dialog
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // ── Load stats ─────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await authService.adminGetStats();
      setStats(res.data);
    } catch (err: any) {
      setStatsError(err?.response?.data?.message ?? err?.message ?? "Failed to load stats");
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
      setTableError(err?.response?.data?.message ?? err?.message ?? "Failed to load users");
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadUsers(1, debouncedSearch);
  }, [debouncedSearch, loadUsers]);

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

  const handleRoleChange = (userId: string, role: "user" | "admin" | "moderator") => {
    setConfirm({
      message: `Change this user's role to "${role}"?`,
      onConfirm: async () => {
        setConfirm(null);
        setActionMenuUser(null);
        setActionLoading(userId);
        setActionError(null);
        try {
          await authService.adminUpdateRole(userId, role);
          flashSuccess("Role updated");
          loadUsers(pagination.page, debouncedSearch);
          loadStats();
        } catch (err: any) {
          setActionError(err?.response?.data?.message ?? "Failed to update role");
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
        setActionMenuUser(null);
        setActionLoading(user.id);
        setActionError(null);
        try {
          await authService.adminUpdateStatus(user.id, next);
          flashSuccess(`Account ${next ? "activated" : "deactivated"}`);
          loadUsers(pagination.page, debouncedSearch);
          loadStats();
        } catch (err: any) {
          setActionError(err?.response?.data?.message ?? "Failed to update status");
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
        setActionMenuUser(null);
        setActionLoading(user.id);
        setActionError(null);
        try {
          await authService.adminDeleteUser(user.id);
          flashSuccess("User deleted");
          // If we deleted the last item on a page, go back one
          const newPage = users.length === 1 && pagination.page > 1
            ? pagination.page - 1
            : pagination.page;
          loadUsers(newPage, debouncedSearch);
          loadStats();
        } catch (err: any) {
          setActionError(err?.response?.data?.message ?? "Failed to delete user");
        } finally {
          setActionLoading(null);
        }
      },
    });
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Shield className="w-6 h-6 text-rose-600" />
              Admin Dashboard
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Signed in as <span className="font-semibold text-gray-700">{currentUser.firstName} {currentUser.lastName}</span>
              &nbsp;·&nbsp;
              <RoleBadge role={currentUser.role} />
            </p>
          </div>
          <button
            onClick={() => { loadStats(); loadUsers(pagination.page, debouncedSearch); }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats cards ──────────────────────────────────────────────────── */}
      {statsError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {statsError}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total Users",
            value: stats?.totalUsers,
            icon: <Users className="w-5 h-5 text-indigo-600" />,
            bg: "bg-indigo-50",
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
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              {icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {statsLoading ? <span className="text-gray-300">—</span> : (value ?? 0)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Role breakdown */}
      {!statsLoading && stats?.roleBreakdown && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Role Breakdown</h3>
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
        <div className={`rounded-xl p-4 flex items-center gap-3 text-sm border ${actionSuccess ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {actionSuccess
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle  className="w-4 h-4 flex-shrink-0" />}
          {actionSuccess ?? actionError}
          <button className="ml-auto" onClick={() => { setActionError(null); setActionSuccess(null); }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Users table ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
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
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* Table */}
        {tableError ? (
          <div className="p-8 text-center text-sm text-red-600">{tableError}</div>
        ) : tableLoading ? (
          <div className="p-8 flex justify-center">
            <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3 text-left font-medium">User</th>
                  <th className="px-5 py-3 text-left font-medium">Role</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Last Login</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => {
                  const isSelf = u.id === currentUser.id;
                  const busy   = actionLoading === u.id;
                  return (
                    <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${busy ? "opacity-50 pointer-events-none" : ""}`}>
                      {/* User info */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {u.firstName} {u.lastName}
                              {isSelf && (
                                <span className="ml-1.5 text-xs text-indigo-500 font-normal">(you)</span>
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
                      {/* Last login */}
                      <td className="px-5 py-3 text-xs text-gray-400 hidden md:table-cell">
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleDateString()
                          : "Never"}
                      </td>
                      {/* Action menu */}
                      <td className="px-5 py-3 text-right">
                        {isSelf ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : (
                          <div className="relative inline-block">
                            <button
                              onClick={() =>
                                setActionMenuUser(actionMenuUser === u.id ? null : u.id)
                              }
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {actionMenuUser === u.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 text-sm">
                                <p className="px-3 py-1.5 text-xs text-gray-400 font-medium uppercase tracking-wide">
                                  Set Role
                                </p>
                                {(["user", "moderator", "admin"] as const).map((r) => (
                                  <button
                                    key={r}
                                    disabled={u.role === r}
                                    onClick={() => handleRoleChange(u.id, r)}
                                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 ${u.role === r ? "opacity-40 cursor-default" : ""}`}
                                  >
                                    <RoleBadge role={r} />
                                  </button>
                                ))}
                                <hr className="my-1 border-gray-100" />
                                <button
                                  onClick={() => handleStatusToggle(u)}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                >
                                  {u.isActive ? (
                                    <><UserX className="w-3.5 h-3.5 text-amber-500" /> Deactivate</>
                                  ) : (
                                    <><UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Activate</>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDelete(u)}
                                  className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2 text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete user
                                </button>
                              </div>
                            )}
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
                onClick={() => loadUsers(pagination.page - 1, debouncedSearch)}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadUsers(pagination.page + 1, debouncedSearch)}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click-away to close action menus */}
      {actionMenuUser && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenuUser(null)}
        />
      )}
    </div>
  );
}
