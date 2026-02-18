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

type Tab =
  | "dashboard"
  | "ai-search"
  | "courses"
  | "learning-path"
  | "saved-paths"
  | "skills"
  | "universities";

type AuthView = "landing" | "login" | "signup";

function App() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [authView, setAuthView] = useState<AuthView>("landing");
  const [hasError, setHasError] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasSelectedComponent, setHasSelectedComponent] = useState(false);

  useEffect(() => {
    // Reset error state when tab changes
    setHasError(false);
  }, [activeTab]);

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

  // Show component selection page after login
  if (!hasSelectedComponent) {
    return (
      <TeamComponentSelection
        onSelectComponent={() => setHasSelectedComponent(true)}
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

  const tabs = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: "📊" },
    { id: "ai-search" as Tab, label: "AI Search", icon: "🤖" },
    { id: "courses" as Tab, label: "Courses", icon: "📚" },
    { id: "learning-path" as Tab, label: "Learning Path", icon: "🛤️" },
    { id: "saved-paths" as Tab, label: "Saved Paths", icon: "💾" },
    { id: "skills" as Tab, label: "Skills", icon: "🎯" },
    { id: "universities" as Tab, label: "Universities", icon: "🎓" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <Header onOpenProfile={() => setIsProfileOpen(true)} />

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <UserProfile />
            </div>
          </div>
        </div>
      )}

      {/* Main Layout with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`${isSidebarCollapsed ? "w-16" : "w-64"} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
        >
          {/* Toggle Button */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} px-4 py-3 text-left rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                title={isSidebarCollapsed ? tab.label : ""}
              >
                <span className="text-xl">{tab.icon}</span>
                {!isSidebarCollapsed && (
                  <span className="font-medium">{tab.label}</span>
                )}
              </button>
            ))}

            {/* Back to Components Button */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={() => setHasSelectedComponent(false)}
                className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} px-4 py-3 text-left rounded-lg transition-all text-gray-700 hover:bg-orange-50 hover:text-orange-600`}
                title={isSidebarCollapsed ? "Back to Components" : ""}
              >
                <span className="text-xl">🏠</span>
                {!isSidebarCollapsed && (
                  <span className="font-medium">Back to Components</span>
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
              <p className="text-sm mt-2">Backend: http://127.0.0.1:5000</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
