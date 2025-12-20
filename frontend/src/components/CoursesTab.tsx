import { useState, useEffect } from 'react';
import {
  getCourses,
  searchCourses,
  getCourseById,
  getCoursesBySkill,
  type Course,
  type CourseDetail,
} from '../api';

export default function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [minRating, setMinRating] = useState<number>(0);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourses(0, 50);
      setCourses(data);
    } catch (err) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const skills = skillFilter
        ? skillFilter.split(',').map(s => s.trim())
        : undefined;
      const data = await searchCourses(
        searchQuery,
        skills,
        difficultyFilter || undefined,
        minRating || undefined,
        50
      );
      setCourses(data);
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchBySkill = async () => {
    if (!skillFilter) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCoursesBySkill(skillFilter, 50);
      setCourses(data);
    } catch (err) {
      setError('Failed to search by skill');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCourse = async (courseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourseById(courseId);
      setSelectedCourse(data);
    } catch (err) {
      setError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Search Section */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-2xl font-bold text-gray-800 mb-4'>
          🔍 Search Courses
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
          <input
            type='text'
            placeholder='Search query...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
          />

          <input
            type='text'
            placeholder='Skills (comma-separated)'
            value={skillFilter}
            onChange={e => setSkillFilter(e.target.value)}
            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
          />

          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value)}
            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
          >
            <option value=''>All Difficulties</option>
            <option value='Beginner'>Beginner</option>
            <option value='Intermediate'>Intermediate</option>
            <option value='Advanced'>Advanced</option>
          </select>

          <input
            type='number'
            placeholder='Min Rating (0-5)'
            value={minRating}
            onChange={e => setMinRating(parseFloat(e.target.value))}
            min='0'
            max='5'
            step='0.1'
            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
          />
        </div>

        <div className='flex gap-2'>
          <button
            onClick={handleSearch}
            className='px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'
          >
            🔍 Search (POST /courses/search)
          </button>

          <button
            onClick={handleSearchBySkill}
            className='px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
          >
            🎯 By Skill (GET /courses/by-skill/{'{skill}'})
          </button>

          <button
            onClick={loadCourses}
            className='px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'
          >
            📚 All Courses (GET /courses)
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

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6'>
            <div className='flex justify-between items-start mb-4'>
              <h2 className='text-2xl font-bold text-gray-800'>
                {selectedCourse.name}
              </h2>
              <button
                onClick={() => setSelectedCourse(null)}
                className='text-gray-500 hover:text-gray-700 text-2xl'
              >
                ×
              </button>
            </div>

            <div className='space-y-4'>
              <div>
                <span className='font-semibold'>University:</span>{' '}
                {selectedCourse.university}
              </div>
              <div>
                <span className='font-semibold'>Difficulty:</span>{' '}
                <span className='px-2 py-1 bg-indigo-100 text-indigo-600 rounded'>
                  {selectedCourse.difficulty}
                </span>
              </div>
              <div>
                <span className='font-semibold'>Rating:</span>{' '}
                <span className='text-yellow-500'>
                  ⭐ {selectedCourse.rating.toFixed(1)}
                </span>
              </div>
              <div>
                <span className='font-semibold'>Description:</span>
                <p className='text-gray-600 mt-1'>
                  {selectedCourse.description}
                </p>
              </div>

              {selectedCourse.skills && selectedCourse.skills.length > 0 && (
                <div>
                  <span className='font-semibold'>Skills:</span>
                  <div className='flex flex-wrap gap-2 mt-2'>
                    {selectedCourse.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className='px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm'
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCourse.similar_courses &&
                selectedCourse.similar_courses.length > 0 && (
                  <div>
                    <span className='font-semibold'>Similar Courses:</span>
                    <div className='space-y-2 mt-2'>
                      {selectedCourse.similar_courses.map(course => (
                        <div key={course.id} className='p-3 bg-gray-50 rounded'>
                          <div className='font-medium'>{course.name}</div>
                          <div className='text-sm text-gray-600'>
                            {course.university}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <a
                href={selectedCourse.url}
                target='_blank'
                rel='noopener noreferrer'
                className='block text-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'
              >
                🔗 View Course
              </a>
            </div>

            <p className='text-sm text-gray-600 mt-4'>
              Endpoint:{' '}
              <code className='bg-gray-100 px-2 py-1 rounded'>
                GET /courses/{'{id}'}
              </code>
            </p>
          </div>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && courses.length > 0 && (
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-xl font-bold text-gray-800 mb-4'>
            📚 Results ({courses.length} courses)
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {courses.map(course => (
              <div
                key={course.id}
                className='border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer'
                onClick={() => handleViewCourse(course.id)}
              >
                <h4 className='font-semibold text-gray-800 mb-2 line-clamp-2'>
                  {course.name}
                </h4>
                <p className='text-sm text-gray-600 mb-2'>
                  {course.university}
                </p>
                <div className='flex justify-between items-center'>
                  <span className='text-xs px-2 py-1 bg-indigo-100 text-indigo-600 rounded'>
                    {course.difficulty}
                  </span>
                  <span className='text-yellow-500 text-sm'>
                    ⭐ {course.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && courses.length === 0 && (
        <div className='bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600'>
          No courses found. Try searching or loading all courses.
        </div>
      )}
    </div>
  );
}
