import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "./Header";
import UserProfile from "./UserProfile";
import { Network, Code2, Layers, PenTool, X, ArrowRight } from "lucide-react";

interface TeamComponentSelectionProps {
  onSelectComponent: (tab?: string) => void;
  onLogoClick?: () => void;
}

const TeamComponentSelection = ({
  onSelectComponent,
  onLogoClick,
}: TeamComponentSelectionProps) => {
  useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const components = [
    {
      id: 1,
      name: "Explore Courses",
      color: "from-blue-500 to-indigo-600",
      Icon: Network,
      available: true,
      tab: "dashboard",
    },
    {
      id: 2,
      name: "Timetable Planner",
      color: "from-purple-500 to-pink-600",
      Icon: Code2,
      available: false,
      tab: undefined,
    },
    {
      id: 3,
      name: "Learner Status",
      color: "from-green-500 to-teal-600",
      Icon: Layers,
      available: true,
      tab: "learner-status",
    },
    {
      id: 4,
      name: "Progress Tracker",
      color: "from-orange-500 to-red-600",
      Icon: PenTool,
      available: false,
      tab: undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <Header onOpenProfile={() => setIsProfileOpen(true)} onLogoClick={onLogoClick} />

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
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <UserProfile />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What would you like to explore today?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pick a module below to get started. More features are on the way.
          </p>
        </div>

        {/* Component Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {components.map((component) => (
            <div
              key={component.id}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 ${
                component.available
                  ? "hover:scale-105 hover:shadow-2xl cursor-pointer"
                  : "opacity-75 cursor-not-allowed"
              }`}
              onClick={component.available ? () => onSelectComponent(component.tab) : undefined}
            >
              {/* Gradient Header */}
              <div
                className={`h-32 bg-gradient-to-r ${component.color} flex items-center justify-center`}
              >
                <component.Icon className="w-14 h-14 text-white opacity-90" />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {component.name}
                </h3>
              </div>

              {/* Hover Effect Overlay */}
              {component.available && (
                <div className="absolute inset-0 bg-indigo-600 bg-opacity-0 hover:bg-opacity-5 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                  <span className="flex items-center gap-2 text-white font-semibold text-base bg-indigo-600 px-5 py-2.5 rounded-lg shadow">
                    Explore Now <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default TeamComponentSelection;
