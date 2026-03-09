import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  GraduationCap,
  ChevronDown,
  User,
  HelpCircle,
  LogOut,
  BookOpen,
} from "lucide-react";

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenAcademicProfile?: () => void;
  hasUnfilledProfile?: boolean;
  onLogoClick?: () => void;
}

export default function Header({ onOpenProfile, onOpenAcademicProfile, hasUnfilledProfile = false, onLogoClick }: HeaderProps) {
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo and Title */}
          <button
            onClick={onLogoClick}
            className="flex items-center space-x-3 rounded-xl px-2 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                LearnPath AI
              </h1>
              <p className="text-xs text-gray-500">
                Personalized Learning Paths
              </p>
            </div>
          </button>

          {/* User Profile Section */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 hover:bg-gray-50 rounded-xl px-3 py-2 transition-colors"
              >
                {/* Avatar with notification dot */}
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                  {hasUnfilledProfile && (
                    <span className="absolute top-0 right-0 block w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                </div>

                {/* User Info */}
                <div className="text-left hidden md:block">
                  <p className="text-sm font-semibold text-gray-800">
                    {user.fullName || "User"}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>

                {/* Dropdown Arrow */}
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-fade-in">
                  {/* User Info in Dropdown */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">
                      {user.fullName || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenProfile();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      <User className="w-4 h-4 mr-3" />
                      My Profile
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenAcademicProfile?.();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 mr-3" />
                      <span className="flex-1 text-left">Academic Profile</span>
                      {hasUnfilledProfile && (
                        <span className="ml-2 flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                          Pending
                        </span>
                      )}
                    </button>

                    <a
                      href="#help"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 mr-3" />
                      Help & Support
                    </a>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 pt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
      </div>
    </header>
  );
}
