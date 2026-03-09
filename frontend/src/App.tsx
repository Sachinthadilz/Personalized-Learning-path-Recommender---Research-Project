import { useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Header from "./components/Header";
import UserProfile from "./components/UserProfile";
import Dashboard from "./components/Dashboard";
import CoursesTab from "./components/CoursesTab";
import SkillsTab from "./components/SkillsTab";
import UniversitiesTab from "./components/UniversitiesTab";
import AISearchTab from "./components/AISearchTab";
import LearningPathTab from "./components/LearningPathTab";
import SavedPathsTab from "./components/SavedPathsTab";
import TeamComponentSelection from "./components/TeamComponentSelection";
import TimetablePlanner from "./components/TimetablePlanner";
import OnboardingForm from "./components/OnboardingForm";
import AdaptiveVisualizerTab from "./components/AdaptiveVisualizerTab";
import { authService } from "./services/authService";
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  GitBranch,
  Bookmark,
  Zap,
  GraduationCap,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  X,
} from "lucide-react";

type Tab =
  | "dashboard"
  | "ai-search"
  | "courses"
  | "learning-path"
  | "saved-paths"
  | "skills"
  | "universities"
  | "timetable-planner"
  | "adaptive-visualizer";

type SelectedComponent = "explore-courses" | "timetable-planner" | "adaptive-visualizer";

type AuthView = "landing" | "login" | "signup";

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [authView, setAuthView] = useState<AuthView>("landing");
  const [_hasError, setHasError] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasSelectedComponent, setHasSelectedComponent] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<SelectedComponent>("explore-courses");
  const [showLanding, setShowLanding] = useState(false);
  const [hasAcademicProfile, setHasAcademicProfile] = useState(false);
  const [isAcademicProfileOpen, setIsAcademicProfileOpen] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);

  useEffect(() => {
    // Reset error state when tab changes
    setHasError(false);
  }, [activeTab]);

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

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    if (authView === "landing") {
      return (
        <LandingPage
          onGetStarted={() => setAuthView("signup")}
          onLogin={() => setAuthView("login")}
        />
      );
    }
    if (authView === "signup") {
      return (
        <Signup
          onSwitchToLogin={() => setAuthView("login")}
          onBackToLanding={() => setAuthView("landing")}
        />
      );
    }
    return (
      <Login
        onSwitchToSignup={() => setAuthView("signup")}
        onBackToLanding={() => setAuthView("landing")}
      />
    );
  }

  // Show landing page when logo is clicked (checked before component selection)
  if (showLanding) {
    return (
      <LandingPage
        onGetStarted={() => setShowLanding(false)}
        onLogin={() => setShowLanding(false)}
        onBackToDashboard={() => {
          setShowLanding(false);
          setHasSelectedComponent(false);
        }}
      />
    );
  }

  // Show component selection page after login
  if (!hasSelectedComponent) {
    return (
      <TeamComponentSelection
        onSelectComponent={() => {
          setHasSelectedComponent(true);
          setSelectedComponent("explore-courses");
          setActiveTab("dashboard");
        }}
        onSelectTimetable={() => {
          setHasSelectedComponent(true);
          setSelectedComponent("timetable-planner");
          setActiveTab("timetable-planner");
        }}
        onSelectAdaptive={() => {
          setHasSelectedComponent(true);
          setSelectedComponent("adaptive-visualizer");
          setActiveTab("adaptive-visualizer");
        }}
        onLogoClick={() => setShowLanding(true)}
      />
    );
  }

  const renderTab = () => {
    try {
      switch (activeTab) {
        case "dashboard":
          return <Dashboard />;
        case "ai-search":
          return <AISearchTab />;
        case "courses":
          return <CoursesTab />;
        case "learning-path":
          return <LearningPathTab />;
        case "saved-paths":
          return <SavedPathsTab />;
        case "skills":
          return <SkillsTab />;
        case "universities":
          return <UniversitiesTab />;
        case "timetable-planner":
          return <TimetablePlanner />;
        case "adaptive-visualizer":
          return <AdaptiveVisualizerTab profileVersion={profileVersion} />;
        default:
          return <Dashboard />;
      }
    } catch (error) {
      setHasError(true);
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Component Error
          </h2>
          <p className="text-red-600 mb-4">{String(error)}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      );
    }
  };

  const allTabs: { id: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "ai-search", label: "AI Search", Icon: Sparkles },
    { id: "courses", label: "Courses", Icon: BookOpen },
    { id: "learning-path", label: "Learning Path", Icon: GitBranch },
    { id: "saved-paths", label: "Saved Paths", Icon: Bookmark },
    { id: "skills", label: "Skills", Icon: Zap },
    { id: "universities", label: "Universities", Icon: GraduationCap },
    { id: "timetable-planner", label: "Timetable", Icon: CalendarDays },
    { id: "adaptive-visualizer", label: "Progress Tracker", Icon: Sparkles },
  ];

  const tabs =
    selectedComponent === "timetable-planner"
      ? allTabs.filter((t) => t.id === "timetable-planner")
      : selectedComponent === "adaptive-visualizer"
      ? allTabs.filter((t) => t.id === "adaptive-visualizer")
      : allTabs.filter((t) => t.id !== "timetable-planner" && t.id !== "adaptive-visualizer");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <Header
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAcademicProfile={() => setIsAcademicProfileOpen(true)}
        hasUnfilledProfile={!hasAcademicProfile}
        onLogoClick={() => setShowLanding(true)}
      />

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Academic Profile</h2>
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
                  setProfileVersion((v) => v + 1);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Layout with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`${isSidebarCollapsed ? "w-16" : "w-56"} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 flex-shrink-0`}
        >
          {/* Toggle Button */}
          <div className="p-3 border-b border-gray-200">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 rounded-lg transition-colors"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>

          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            {tabs.map((tab) => {
              const { Icon } = tab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 text-left rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  title={isSidebarCollapsed ? tab.label : ""}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isSidebarCollapsed && (
                    <span className="text-sm font-medium">{tab.label}</span>
                  )}
                </button>
              );
            })}

            {/* Back to Components Button */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={() => setHasSelectedComponent(false)}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 text-left rounded-lg transition-all text-gray-500 hover:bg-orange-50 hover:text-orange-600`}
                title={isSidebarCollapsed ? "Back to Components" : ""}
              >
                <ArrowLeft className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && (
                  <span className="text-sm font-medium">Back to Components</span>
                )}
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">{renderTab()}</div>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-12">
            <div className="container mx-auto px-4 py-6 text-center text-gray-600">
              <p>Course Knowledge Graph API - Built with FastAPI & Neo4j</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
