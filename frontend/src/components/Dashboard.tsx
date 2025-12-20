import { useState, useEffect } from 'react';
import { getStats, healthCheck, type Stats } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<string>('checking...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, healthData] = await Promise.all([
        getStats(),
        healthCheck(),
      ]);
      setStats(statsData);
      setHealth(healthData.status);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
        <p className='text-red-600'>❌ Error: {error}</p>
        <button
          onClick={loadData}
          className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Health Status */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-2xl font-bold text-gray-800 mb-4'>
          🏥 API Health Status
        </h2>
        <div className='flex items-center space-x-2'>
          <span className='text-green-500 text-2xl'>●</span>
          <span className='text-lg font-medium'>{health}</span>
        </div>
        <p className='text-sm text-gray-600 mt-2'>
          Endpoint:{' '}
          <code className='bg-gray-100 px-2 py-1 rounded'>GET /health</code>
        </p>
      </div>

      {/* Statistics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow p-6'>
          <div className='text-3xl mb-2'>📚</div>
          <div className='text-3xl font-bold'>{stats?.total_courses}</div>
          <div className='text-blue-100 mt-1'>Total Courses</div>
        </div>

        <div className='bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-6'>
          <div className='text-3xl mb-2'>🎓</div>
          <div className='text-3xl font-bold'>{stats?.total_universities}</div>
          <div className='text-green-100 mt-1'>Universities</div>
        </div>

        <div className='bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow p-6'>
          <div className='text-3xl mb-2'>🎯</div>
          <div className='text-3xl font-bold'>{stats?.total_skills}</div>
          <div className='text-purple-100 mt-1'>Skills</div>
        </div>

        <div className='bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow p-6'>
          <div className='text-3xl mb-2'>⭐</div>
          <div className='text-3xl font-bold'>
            {stats?.avg_rating ? stats.avg_rating.toFixed(2) : '0.00'}
          </div>
          <div className='text-orange-100 mt-1'>Avg Rating</div>
        </div>
      </div>

      {/* Top Universities */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h3 className='text-xl font-bold text-gray-800 mb-4'>
          🎓 Top Universities
        </h3>
        <div className='space-y-2'>
          {stats?.top_universities.slice(0, 10).map((uni, idx) => (
            <div
              key={idx}
              className='flex justify-between items-center p-3 bg-gray-50 rounded'
            >
              <span className='font-medium text-gray-700'>{uni.name}</span>
              <span className='text-indigo-600 font-semibold'>
                {uni.course_count} courses
              </span>
            </div>
          ))}
        </div>
        <p className='text-sm text-gray-600 mt-4'>
          Endpoint:{' '}
          <code className='bg-gray-100 px-2 py-1 rounded'>GET /stats</code>
        </p>
      </div>

      {/* Top Skills */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h3 className='text-xl font-bold text-gray-800 mb-4'>🎯 Top Skills</h3>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2'>
          {stats?.top_skills.slice(0, 20).map((skill, idx) => (
            <div key={idx} className='p-3 bg-indigo-50 rounded text-center'>
              <div className='font-semibold text-indigo-600'>{skill.name}</div>
              <div className='text-sm text-gray-600'>{skill.count} courses</div>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadData}
        className='w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium'
      >
        🔄 Refresh Dashboard
      </button>
    </div>
  );
}
