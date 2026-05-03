import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { useAuth } from "./contexts/AuthContext";
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
  Brain,
} from "lucide-react";

const LandingPage = lazy(() => import("./components/LandingPage"));
const Login = lazy(() => import("./components/Login"));
const Signup = lazy(() => import("./components/Signup"));
const Header = lazy(() => import("./components/Header"));
const UserProfile = lazy(() => import("./components/UserProfile"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const CoursesTab = lazy(() => import("./components/CoursesTab"));
const SkillsTab = lazy(() => import("./components/SkillsTab"));
const UniversitiesTab = lazy(() => import("./components/UniversitiesTab"));
const AISearchTab = lazy(() => import("./components/AISearchTab"));
const LearningPathTab = lazy(() => import("./components/LearningPathTab"));
const SavedPathsTab = lazy(() => import("./components/SavedPathsTab"));
const TeamComponentSelection = lazy(
  () => import("./components/TeamComponentSelection"),
);
const AutoLearnerProfileTab = lazy(
  () => import("./components/AutoLearnerProfileTab"),
);
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const TimetablePlanner = lazy(() => import("./components/TimetablePlanner"));
const OnboardingForm = lazy(() => import("./components/OnboardingForm"));
const AdaptiveVisualizerTab = lazy(
  () => import("./components/AdaptiveVisualizerTab"),
);
const EmailVerification = lazy(() => import("./components/EmailVerification"));
const ForgotPassword = lazy(() => import("./components/ForgotPassword"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));

type Tab =
  | "dashboard"
  | "ai-search"
  | "courses"
  | "learning-path"
  | "saved-paths"
  | "skills"
  | "universities"
  | "learner-status"
  | "admin"
  | "timetable-planner"
  | "adaptive-visualizer";

type SelectedComponent =
  | "explore-courses"
  | "timetable-planner"
  | "adaptive-visualizer"
  | "learner-status";

type AuthView = "landing" | "login" | "signup";

const STORAGE_KEYS = {
  hasSelectedComponent: "app.hasSelectedComponent",
  selectedComponent: "app.selectedComponent",
  activeTab: "app.activeTab",
};

const VALID_TABS: Tab[] = [
  "dashboard",
  "ai-search",
  "courses",
  "learning-path",
  "saved-paths",
  "skills",
  "universities",
  "learner-status",
  "admin",
  "timetable-planner",
  "adaptive-visualizer",
];

const VALID_SELECTED_COMPONENTS: SelectedComponent[] = [
  "explore-courses",
  "timetable-planner",
  "adaptive-visualizer",
  "learner-status",
];

function getStoredValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function AppLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-700 mx-auto" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const storedTab = getStoredValue(STORAGE_KEYS.activeTab);
    if (storedTab && VALID_TABS.includes(storedTab as Tab)) {
      return storedTab as Tab;
    }
    return "dashboard";
  });
  const [authView, setAuthView] = useState<AuthView>("landing");
  const [_hasError, setHasError] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasSelectedComponent, setHasSelectedComponent] = useState<boolean>(
    () => {
      return getStoredValue(STORAGE_KEYS.hasSelectedComponent) === "true";
    },
  );
  const [selectedComponent, setSelectedComponent] = useState<SelectedComponent>(
    () => {
      const storedComponent = getStoredValue(STORAGE_KEYS.selectedComponent);
      if (
        storedComponent &&
        VALID_SELECTED_COMPONENTS.includes(storedComponent as SelectedComponent)
      ) {
        return storedComponent as SelectedComponent;
      }
      return "explore-courses";
    },
  );
  const [showLanding, setShowLanding] = useState(false);
  const [hasAcademicProfile, setHasAcademicProfile] = useState(false);
  const [isAcademicProfileOpen, setIsAcademicProfileOpen] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);

  const withSuspense = (content: ReactNode) => (
    <Suspense fallback={<AppLoadingScreen />}>{content}</Suspense>
  );

  // Reset all state when the user logs out (only after auth finishes initializing)
  useEffect(() => {
    // Avoid clearing state during initial auth check; only clear on confirmed logout
    if (!isAuthenticated && !isLoading) {
      // Reset to initial state when user logs out
      setActiveTab("dashboard");
      setAuthView("landing");
      setIsProfileOpen(false);
      setIsSidebarCollapsed(false);
      setHasSelectedComponent(false);
      setSelectedComponent("explore-courses");
      setShowLanding(false);
      setHasAcademicProfile(false);
      setIsAcademicProfileOpen(false);
      setProfileVersion(0);
      setHasError(false);

      localStorage.removeItem(STORAGE_KEYS.hasSelectedComponent);
      localStorage.removeItem(STORAGE_KEYS.selectedComponent);
      localStorage.removeItem(STORAGE_KEYS.activeTab);
    }
  }, [isAuthenticated, user?.id, isLoading]);

  useEffect(() => {
    if (!isAuthenticated) return;
    localStorage.setItem(
      STORAGE_KEYS.hasSelectedComponent,
      String(hasSelectedComponent),
    );
  }, [hasSelectedComponent, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    localStorage.setItem(STORAGE_KEYS.selectedComponent, selectedComponent);
  }, [selectedComponent, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    localStorage.setItem(STORAGE_KEYS.activeTab, activeTab);
  }, [activeTab, isAuthenticated]);

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
    return <AppLoadingScreen />;
  }

  // ── URL-based public routes (for email links) ───────────────────────────────
  const pathname = window.location.pathname;

  // /verify-email/<token>
  const verifyMatch = pathname.match(/^\/verify-email\/(.+)$/);
  if (verifyMatch) {
    return withSuspense(<EmailVerification token={verifyMatch[1]} />);
  }

  // /forgot-password
  if (pathname === "/forgot-password") {
    return withSuspense(<ForgotPassword />);
  }

  // /reset-password/<token>
  const resetMatch = pathname.match(/^\/reset-password\/(.+)$/);
  if (resetMatch) {
    return withSuspense(<ResetPassword token={resetMatch[1]} />);
  }

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    if (authView === "landing") {
      return withSuspense(
        <LandingPage
          onGetStarted={() => setAuthView("signup")}
          onLogin={() => setAuthView("login")}
        />,
      );
    }
    if (authView === "signup") {
      return withSuspense(
        <Signup
          onSwitchToLogin={() => setAuthView("login")}
          onBackToLanding={() => setAuthView("landing")}
        />,
      );
    }
    return withSuspense(
      <Login
        onSwitchToSignup={() => setAuthView("signup")}
        onBackToLanding={() => setAuthView("landing")}
      />,
    );
  }

  // Show landing page when logo is clicked (checked before component selection)
  if (showLanding) {
    return withSuspense(
      <LandingPage
        onGetStarted={() => setShowLanding(false)}
        onLogin={() => setShowLanding(false)}
        onBackToDashboard={() => {
          setShowLanding(false);
          setHasSelectedComponent(false);
        }}
      />,
    );
  }

  // Show component selection page after login
  if (!hasSelectedComponent) {
    return withSuspense(
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
        onSelectLearnerStatus={() => {
          setHasSelectedComponent(true);
          setSelectedComponent("learner-status");
          setActiveTab("learner-status");
        }}
        onLogoClick={() => setShowLanding(true)}
        onOpenAdmin={() => {
          setSelectedComponent("explore-courses");
          setHasSelectedComponent(true);
          setActiveTab("admin");
        }}
      />,
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
        case "learner-status":
          return <AutoLearnerProfileTab />;
        case "admin":
          return (
            <AdminDashboard onBack={() => setHasSelectedComponent(false)} />
          );
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

  const allTabs: {
    id: Tab;
    label: string;
    Icon: ComponentType<{ className?: string }>;
  }[] = [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "ai-search", label: "AI Search", Icon: Sparkles },
    { id: "courses", label: "Courses", Icon: BookOpen },
    { id: "learning-path", label: "Learning Path", Icon: GitBranch },
    { id: "saved-paths", label: "Saved Paths", Icon: Bookmark },
    { id: "skills", label: "Skills", Icon: Zap },
    { id: "universities", label: "Universities", Icon: GraduationCap },
    { id: "learner-status", label: "Learner Status", Icon: Brain },
    { id: "timetable-planner", label: "Timetable", Icon: CalendarDays },
    { id: "adaptive-visualizer", label: "Progress Tracker", Icon: Sparkles },
  ];

  const tabs =
    activeTab === "admin"
      ? [] // No tabs shown for admin dashboard - keep it clean
      : selectedComponent === "timetable-planner"
        ? allTabs.filter((t) => t.id === "timetable-planner")
        : selectedComponent === "adaptive-visualizer"
          ? allTabs.filter((t) => t.id === "adaptive-visualizer")
          : selectedComponent === "learner-status"
            ? allTabs.filter((t) => t.id === "learner-status")
            : allTabs.filter(
                (t) =>
                  t.id !== "timetable-planner" &&
                  t.id !== "adaptive-visualizer" &&
                  t.id !== "learner-status",
              );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <Suspense fallback={<AppLoadingScreen />}>
        <Header
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenAcademicProfile={() => setIsAcademicProfileOpen(true)}
          hasUnfilledProfile={!hasAcademicProfile}
          onLogoClick={() => setShowLanding(true)}
          onOpenAdmin={() => {
            setSelectedComponent("explore-courses");
            setHasSelectedComponent(true);
            setActiveTab("admin");
          }}
        />
      </Suspense>

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
              <Suspense fallback={<AppLoadingScreen />}>
                <UserProfile />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Academic Profile Modal */}
      {isAcademicProfileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Academic Profile
              </h2>
              <button
                onClick={() => setIsAcademicProfileOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <Suspense fallback={<AppLoadingScreen />}>
                <OnboardingForm
                  onComplete={() => {
                    setHasAcademicProfile(true);
                    setIsAcademicProfileOpen(false);
                    setProfileVersion((v) => v + 1);
                  }}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation - Hide for admin */}
        {activeTab !== "admin" && (
          <aside
            className={`${isSidebarCollapsed ? "w-[68px]" : "w-60"} bg-white flex flex-col transition-all duration-300 flex-shrink-0 border-r border-gray-100`}
          >
            {/* Toggle Button */}
            <div className="px-3 py-3">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="w-full flex items-center justify-center p-2 text-gray-400 hover:bg-gray-50 hover:text-blue-700 rounded-xl transition-colors"
                title={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>

            <nav className="px-3 space-y-1 flex-1 overflow-y-auto">
              {tabs.map((tab) => {
                const { Icon } = tab;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 text-left rounded-xl transition-all relative ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                    title={isSidebarCollapsed ? tab.label : ""}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-700 rounded-r-full" />
                    )}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive
                          ? "bg-blue-700 text-white"
                          : "bg-transparent text-gray-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {!isSidebarCollapsed && (
                      <span className="text-sm">{tab.label}</span>
                    )}
                  </button>
                );
              })}

              {/* Back to Components Button */}
              <div className="pt-3 mt-3 border-t border-gray-100">
                <button
                  onClick={() => setHasSelectedComponent(false)}
                  className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 text-left rounded-xl transition-all text-gray-400 hover:bg-amber-50 hover:text-amber-600`}
                  title={isSidebarCollapsed ? "Back to Components" : ""}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  {!isSidebarCollapsed && (
                    <span className="text-sm font-medium">Back</span>
                  )}
                </button>
              </div>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Suspense fallback={<AppLoadingScreen />}>{renderTab()}</Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
