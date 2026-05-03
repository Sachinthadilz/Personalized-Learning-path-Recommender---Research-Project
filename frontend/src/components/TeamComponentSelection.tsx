import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/authService";
import Header from "./Header";
import UserProfile from "./UserProfile";
import OnboardingForm from "./OnboardingForm";
import { Network, Code2, Layers, PenTool, X, ArrowRight } from "lucide-react";
import ProgressTrackerBanner from "./ProgressTrackerBanner";

interface TeamComponentSelectionProps {
  onSelectComponent: () => void;
  onSelectTimetable?: () => void;
  onSelectAdaptive?: () => void;
  onSelectLearnerStatus?: () => void;
  onLogoClick?: () => void;
  onOpenAdmin?: () => void;
}

const TeamComponentSelection = ({
  onSelectComponent,
  onSelectTimetable,
  onSelectAdaptive,
  onSelectLearnerStatus,
  onLogoClick,
  onOpenAdmin,
}: TeamComponentSelectionProps) => {
  const { isAuthenticated } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAcademicProfileOpen, setIsAcademicProfileOpen] = useState(false);
  const [hasAcademicProfile, setHasAcademicProfile] = useState(false);

  // Check whether the logged-in user has already filled their academic profile
  useEffect(() => {
    if (!isAuthenticated) {
      setHasAcademicProfile(false);
      return;
    }
    authService
      .getAcademicProfile()
      .then((res) => {
        setHasAcademicProfile(res.data !== null);
      })
      .catch(() => {
        // If the request fails, don't show notification
        setHasAcademicProfile(true);
      });
  }, [isAuthenticated]);

  const components = [
    {
      id: 1,
      name: "Explore Courses",
      desc: "Browse 3K+ courses from top universities worldwide",
      color: "border-blue-500",
      iconBg: "bg-blue-700",
      Icon: Network,
      available: true,
      onClick: onSelectComponent,
    },
    {
      id: 2,
      name: "Timetable Planner",
      desc: "Organise your weekly study schedule efficiently",
      color: "border-sky-400",
      iconBg: "bg-sky-600",
      Icon: Code2,
      available: true,
      onClick: onSelectTimetable ?? onSelectComponent,
    },
    {
      id: 3,
      name: "Learner Status",
      desc: "Track your learning progress and engagement",
      color: "border-teal-400",
      iconBg: "bg-teal-500",
      Icon: Layers,
      available: true,
      onClick: onSelectLearnerStatus ?? onSelectComponent,
    },
    {
      id: 4,
      name: "Progress Tracker",
      desc: "Visualise your adaptive learning journey",
      color: "border-amber-400",
      iconBg: "bg-amber-500",
      Icon: PenTool,
      available: true,
      onClick: onSelectAdaptive ?? onSelectComponent,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAcademicProfile={() => setIsAcademicProfileOpen(true)}
        hasUnfilledProfile={!hasAcademicProfile}
        onLogoClick={onLogoClick}
        onOpenAdmin={onOpenAdmin}
      />

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <UserProfile />
            </div>
          </div>
        </div>
      )}

      {/* Academic Profile Modal */}
      {isAcademicProfileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">Academic Profile</h2>
              <button
                onClick={() => setIsAcademicProfileOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <OnboardingForm
                onComplete={() => {
                  setHasAcademicProfile(true);
                  setIsAcademicProfileOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content — fits on one screen */}
      <main className="max-w-6xl mx-auto px-6 flex flex-col justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
            What would you like to explore?
          </h2>
          <p className="text-gray-400 text-sm">
            Select a module to get started
          </p>
        </div>

        {/* Component Grid — 4 in a row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {components.map((component) => (
            <div
              key={component.id}
              className={`group relative bg-white rounded-2xl border-2 border-gray-100 overflow-hidden transition-all duration-300 ${component.available
                ? "hover:shadow-xl hover:-translate-y-1 cursor-pointer hover:border-blue-200"
                : "opacity-60 cursor-not-allowed"
                }`}
              onClick={component.available ? component.onClick : undefined}
            >
              <div className="p-6">
                {/* Icon */}
                <div className={`w-12 h-12 ${component.iconBg} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <component.Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-blue-700 transition-colors">
                  {component.name}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  {component.desc}
                </p>

                {/* CTA link */}
                {component.available && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    Explore <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {/* Bottom accent line */}
              <div className={`h-1 w-0 group-hover:w-full transition-all duration-500 ${component.iconBg}`} />
            </div>
          ))}
        </div>

        {/* ── Browser Extension: Progress Tracker ── */}
        <div className="mt-8 mb-6">
          <ProgressTrackerBanner />
        </div>
      </main>
    </div>
  );
};

export default TeamComponentSelection;
