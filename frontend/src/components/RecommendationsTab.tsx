import { useState } from 'react';
import {
  getSimilarCourses,
  getRecommendations,
  getPopularCourses,
  type Course,
} from '../api';

export default function RecommendationsTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [courseId, setCourseId] = useState('');
  const [skills, setSkills] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const handleGetSimilar = async () => {
    if (!courseId) {
      setError('Please enter a course ID');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getSimilarCourses(courseId, 10);
      setCourses(data);
    } catch (err) {
      setError('Failed to get similar courses');
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const skillsArray = skills
        ? skills.split(',').map(s => s.trim())
        : undefined;
      const data = await getRecommendations(
        courseId || undefined,
        skillsArray,
        difficulty || undefined,
        10
      );
      setCourses(data);
    } catch (err) {
      setError('Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleGetPopular = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPopularCourses(20);
      setCourses(data);
    } catch (err) {
      setError('Failed to get popular courses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Input Section */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-2xl font-bold text-gray-800 mb-4'>
          ⭐ Get Recommendations
        </h2>

        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Course ID (for similar courses)
            </label>
            <input
              type='text'
              placeholder='Enter course ID...'
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Skills (comma-separated)
            </label>
            <input
              type='text'
              placeholder='e.g., Python, Machine Learning, Data Science'
              value={skills}
              onChange={e => setSkills(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
            >
              <option value=''>Any Difficulty</option>
              <option value='Beginner'>Beginner</option>
              <option value='Intermediate'>Intermediate</option>
              <option value='Advanced'>Advanced</option>
            </select>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mt-6'>
          <button
            onClick={handleGetSimilar}
            disabled={!courseId}
            className='px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed'
          >
            🔗 Similar Courses
            <div className='text-xs mt-1 opacity-90'>
              GET /recommendations/similar/{'{id}'}
            </div>
          </button>

          <button
            onClick={handleGetRecommendations}
            className='px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
          >
            🎯 Personalized
            <div className='text-xs mt-1 opacity-90'>POST /recommendations</div>
          </button>

          <button
            onClick={handleGetPopular}
            className='px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors'
          >
            🔥 Popular Courses
            <div className='text-xs mt-1 opacity-90'>
              GET /recommendations/popular
            </div>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4 text-red-600'>
          ❌ {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className='flex justify-center items-center h-32'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
        </div>
      )}

      {/* Results */}
      {!loading && courses.length > 0 && (
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-xl font-bold text-gray-800 mb-4'>
            📚 Recommended Courses ({courses.length})
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {courses.map(course => (
              <div
                key={course.id}
                className='border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow'
              >
                <h4 className='font-semibold text-gray-800 mb-2 line-clamp-2'>
                  {course.name}
                </h4>
                <p className='text-sm text-gray-600 mb-2'>
                  {course.university}
                </p>
                <p className='text-xs text-gray-500 mb-3 line-clamp-2'>
                  {course.description}
                </p>
                <div className='flex justify-between items-center'>
                  <span className='text-xs px-2 py-1 bg-indigo-100 text-indigo-600 rounded'>
                    {course.difficulty}
                  </span>
                  <span className='text-yellow-500 text-sm'>
                    ⭐ {course.rating.toFixed(1)}
                  </span>
                </div>
                {course.skills && course.skills.length > 0 && (
                  <div className='flex flex-wrap gap-1 mt-3'>
                    {course.skills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className='text-xs px-2 py-1 bg-green-50 text-green-600 rounded'
                      >
                        {skill}
                      </span>
                    ))}
                    {course.skills.length > 3 && (
                      <span className='text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded'>
                        +{course.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}
                <a
                  href={course.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='block text-center mt-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors text-sm'
                >
                  View Course →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && courses.length === 0 && (
        <div className='bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600'>
          No recommendations yet. Try one of the options above!
        </div>
      )}
    </div>
  );
}
