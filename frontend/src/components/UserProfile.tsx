import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import { Mail, ShieldCheck } from "lucide-react";

export default function UserProfile() {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Refresh user data on mount to get latest verification status
  useEffect(() => {
    refreshUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await updateUser(formData);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    });
    setIsEditing(false);
    setMessage(null);
  };

  const handleVerifyNow = async () => {
    setIsVerifying(true);
    setMessage(null);
    try {
      const res = await authService.requestVerification();
      setMessage({ type: "success", text: res.message || "Verification email sent!" });
      // Refresh user state in case they were already verified
      await refreshUser();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to send verification email",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
          <p className="text-gray-600">Manage your account information</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
        >
          Logout
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                First Name
              </label>
              <p className="text-lg text-gray-900">{user.firstName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Last Name
              </label>
              <p className="text-lg text-gray-900">{user.lastName}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                  Email Address
                </label>
                <p className="text-gray-900 font-medium">{user.email}</p>
              </div>
            </div>
            
            {user.isEmailVerified ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                VERIFIED
              </div>
            ) : (
              <button
                onClick={handleVerifyNow}
                disabled={isVerifying}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg border border-amber-200 text-xs font-bold transition-all disabled:opacity-50"
              >
                {isVerifying ? (
                  "SENDING..."
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    VERIFY NOW
                  </>
                )}
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Role
            </label>
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              {user.role}
            </span>
          </div>

          {user.lastLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Last Login
              </label>
              <p className="text-lg text-gray-900">
                {new Date(user.lastLogin).toLocaleString()}
              </p>
            </div>
          )}

          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
}
