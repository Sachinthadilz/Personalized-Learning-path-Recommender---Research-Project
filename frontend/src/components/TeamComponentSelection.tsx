import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "./Header";
import UserProfile from "./UserProfile";

interface TeamComponentSelectionProps {
  onSelectComponent: () => void;
}

const TeamComponentSelection = ({
  onSelectComponent,
}: TeamComponentSelectionProps) => {
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const components = [
    {
      id: 1,
      name: "Course Knowledge Graph Generator",
      description:
        "Explore courses, skills, and universities with AI-powered search and learning paths",
      color: "from-blue-500 to-indigo-600",
      icon: "🎓",
      available: true,
      createdBy: user?.fullName || user?.email || "You",
    },
    {
      id: 2,
      name: "Component 2",
      description: "Coming soon - Teammate's component",
      color: "from-purple-500 to-pink-600",
      icon: "🚀",
      available: false,
      createdBy: "Teammate 1",
    },
    {
      id: 3,
      name: "Component 3",
      description: "Coming soon - Teammate's component",
      color: "from-green-500 to-teal-600",
      icon: "💡",
      available: false,
      createdBy: "Teammate 2",
    },
    {
      id: 4,
      name: "Component 4",
      description: "Coming soon - Teammate's component",
      color: "from-orange-500 to-red-600",
      icon: "⚡",
      available: false,
      createdBy: "Teammate 3",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Our Team Project! 👋
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our team has built multiple components. Choose the one you'd like to
            explore.
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
              onClick={component.available ? onSelectComponent : undefined}
            >
              {/* Gradient Header */}
              <div
                className={`h-32 bg-gradient-to-r ${component.color} flex items-center justify-center`}
              >
                <span className="text-6xl">{component.icon}</span>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {component.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 min-h-[48px]">
                  {component.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    By {component.createdBy}
                  </span>
                  {component.available ? (
                    <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                      Available
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>

              {/* Hover Effect Overlay */}
              {component.available && (
                <div className="absolute inset-0 bg-indigo-600 bg-opacity-0 hover:bg-opacity-5 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                  <span className="text-white font-semibold text-lg bg-indigo-600 px-6 py-3 rounded-lg">
                    Explore Now →
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
