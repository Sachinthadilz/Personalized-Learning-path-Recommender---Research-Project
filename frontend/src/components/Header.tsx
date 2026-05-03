import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ChevronDown, User, LogOut, Shield, BookOpen } from "lucide-react";

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenAcademicProfile?: () => void;
  hasUnfilledProfile?: boolean;
  onLogoClick?: () => void;
  onOpenAdmin?: () => void;
}

function Header({
  onOpenProfile,
  onOpenAcademicProfile,
  hasUnfilledProfile = false,
  onLogoClick,
  onOpenAdmin,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout]);

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-full mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo and Title */}
        <button
          type="button"
          onClick={onLogoClick}
          aria-label="Go to home"
          className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-blue-50/60 transition-colors cursor-pointer"
        >
          <img
            src="/images/logo.png"
            alt="LearnPath AI"
            className="w-11 h-11 object-contain"
          />
          <div className="text-left hidden sm:block">
            <h1 className="text-lg font-bold leading-tight">
              <span className="text-blue-700">LearnPath</span>{" "}
              <span className="text-amber-500">AI</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none">
              Personalized Learning
            </p>
          </div>
        </button>

        {/* User Profile Section */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-haspopup="menu"
              aria-expanded={isDropdownOpen}
              aria-label="Open user menu"
              className="flex items-center gap-3 hover:bg-gray-50 rounded-xl px-3 py-2 transition-colors"
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-blue-100">
                  {getInitials(user.firstName, user.lastName)}
                </div>
                {hasUnfilledProfile && (
                  <span className="absolute -top-0.5 -right-0.5 block w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white" />
                )}
              </div>

              {/* User Info */}
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {user.fullName || "User"}
                </p>
                <p className="text-[11px] text-gray-400">{user.email}</p>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 animate-fade-in">
                {/* User Info in Dropdown */}
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-sm font-bold text-gray-900">
                    {user.fullName || "User"}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {user.email}
                  </p>
                  {user.role === "admin" && (
                    <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600 uppercase tracking-wider">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  )}
                </div>

                {/* Menu Items */}
                <div className="py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenProfile();
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-lg mx-auto"
                  >
                    <User className="w-4 h-4 mr-3 text-gray-400" />
                    My Profile
                  </button>

                  {user.role === "admin" && onOpenAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenAdmin();
                      }}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors rounded-lg"
                    >
                      <Shield className="w-4 h-4 mr-3" />
                      Admin Dashboard
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenAcademicProfile?.();
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-lg"
                  >
                    <BookOpen className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="flex-1 text-left">Academic Profile</span>
                    {hasUnfilledProfile && (
                      <span className="ml-2 flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        Pending
                      </span>
                    )}
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-50 pt-1.5 mx-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors rounded-lg"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default memo(Header);
