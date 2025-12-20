import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import CoursesTab from './components/CoursesTab';
import RecommendationsTab from './components/RecommendationsTab';
import SkillsTab from './components/SkillsTab';
import UniversitiesTab from './components/UniversitiesTab';
import LearningPathTab from './components/LearningPathTab';
import AISearchTab from './components/AISearchTab';

type Tab =
  | 'dashboard'
  | 'ai-search'
  | 'courses'
  | 'recommendations'
  | 'skills'
  | 'universities'
  | 'learning-path';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset error state when tab changes
    setHasError(false);
  }, [activeTab]);

  const renderTab = () => {
    try {
      switch (activeTab) {
        case 'dashboard':
          return <Dashboard />;
        case 'ai-search':
          return <AISearchTab />;
        case 'courses':
          return <CoursesTab />;
        case 'recommendations':
          return <RecommendationsTab />;
        case 'skills':
          return <SkillsTab />;
        case 'universities':
          return <UniversitiesTab />;
        case 'learning-path':
          return <LearningPathTab />;
        default:
          return <Dashboard />;
      }
    } catch (error) {
      setHasError(true);
      return (
        <div className='bg-red-50 border border-red-200 rounded-lg p-8 text-center'>
          <h2 className='text-2xl font-bold text-red-600 mb-4'>
            ⚠️ Component Error
          </h2>
          <p className='text-red-600 mb-4'>{String(error)}</p>
          <button
            onClick={() => window.location.reload()}
            className='px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'
          >
            Reload Page
          </button>
        </div>
      );
    }
  };

  const tabs = [
    { id: 'dashboard' as Tab, label: '📊 Dashboard', icon: '📊' },
    { id: 'ai-search' as Tab, label: '🤖 AI Search', icon: '🤖' },
    { id: 'courses' as Tab, label: '📚 Courses', icon: '📚' },
    { id: 'recommendations' as Tab, label: '⭐ Recommendations', icon: '⭐' },
    { id: 'skills' as Tab, label: '🎯 Skills', icon: '🎯' },
    { id: 'universities' as Tab, label: '🎓 Universities', icon: '🎓' },
    { id: 'learning-path' as Tab, label: '🛤️ Learning Path', icon: '🛤️' },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      {/* Header */}
      <header className='bg-white shadow-md'>
        <div className='container mx-auto px-4 py-4'>
          <h1 className='text-3xl font-bold text-indigo-600'>
            🎓 Course Knowledge Graph
          </h1>
          <p className='text-gray-600 mt-1'>
            FastAPI Backend Testing Dashboard
          </p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className='bg-white border-b border-gray-200 sticky top-0 z-10'>
        <div className='container mx-auto px-4'>
          <div className='flex space-x-1 overflow-x-auto'>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className='container mx-auto px-4 py-8'>{renderTab()}</main>

      {/* Footer */}
      <footer className='bg-white border-t border-gray-200 mt-12'>
        <div className='container mx-auto px-4 py-6 text-center text-gray-600'>
          <p>Course Knowledge Graph API - Built with FastAPI & Neo4j</p>
          <p className='text-sm mt-2'>Backend: http://127.0.0.1:5000</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
