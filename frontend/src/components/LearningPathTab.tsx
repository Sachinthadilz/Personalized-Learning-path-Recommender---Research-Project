import { useState } from 'react';
import { getLearningPath, type Course } from '../api';

export default function LearningPathTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [targetSkill, setTargetSkill] = useState('');
  const [startCourseId, setStartCourseId] = useState('');
  const [maxCourses, setMaxCourses] = useState(5);

  const handleGeneratePath = async () => {
    if (!targetSkill) {
      setError('Please enter a target skill');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getLearningPath(
        targetSkill,
        startCourseId || undefined,
        maxCourses
      );
      setCourses(data);
    } catch (err) {
      setError('Failed to generate learning path');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Input Section */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-2xl font-bold text-gray-800 mb-4'>
          🛤️ Generate Learning Path
        </h2>
        <p className='text-gray-600 mb-6'>
          Create a personalized learning path to acquire a target skill
        </p>

        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Target Skill * (required)
            </label>
            <input
              type='text'
              placeholder='e.g., Machine Learning, Python, Data Science'
              value={targetSkill}
              onChange={e => setTargetSkill(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Starting Course ID (optional)
            </label>
            <input
              type='text'
              placeholder='Leave empty to start from beginner level'
              value={startCourseId}
              onChange={e => setStartCourseId(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Maximum Courses: {maxCourses}
            </label>
            <input
              type='range'
              min='1'
              max='10'
              value={maxCourses}
              onChange={e => setMaxCourses(parseInt(e.target.value))}
              className='w-full'
            />
          </div>
        </div>

        <button
          onClick={handleGeneratePath}
          disabled={!targetSkill}
          className='w-full mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium'
        >
          🚀 Generate Learning Path
          <div className='text-xs mt-1 opacity-90'>POST /learning-path</div>
        </button>
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

      {/* Learning Path Results */}
      {!loading && courses.length > 0 && (
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-xl font-bold text-gray-800 mb-2'>
            🎯 Your Learning Path to "{targetSkill}"
          </h3>
          <p className='text-gray-600 mb-6'>
            Follow these {courses.length} courses in order to master{' '}
            {targetSkill}
          </p>

          <div className='space-y-4'>
            {courses.map((course, idx) => (
              <div key={course.id} className='relative'>
                {/* Connector Line */}
                {idx < courses.length - 1 && (
                  <div className='absolute left-6 top-16 bottom-0 w-0.5 bg-indigo-200 -mb-4'></div>
                )}

                <div className='flex gap-4'>
                  {/* Step Number */}
                  <div className='flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg z-10'>
                    {idx + 1}
                  </div>

                  {/* Course Card */}
                  <div className='flex-1 border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white'>
                    <h4 className='font-semibold text-gray-800 text-lg mb-2'>
                      {course.name}
                    </h4>

                    <div className='grid grid-cols-2 gap-2 mb-3'>
                      <div className='text-sm'>
                        <span className='text-gray-600'>University:</span>
                        <span className='ml-2 font-medium'>
                          {course.university}
                        </span>
                      </div>
                      <div className='text-sm'>
                        <span className='text-gray-600'>Rating:</span>
                        <span className='ml-2 text-yellow-500'>
                          ⭐ {course.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className='mb-3'>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          course.difficulty === 'Beginner'
                            ? 'bg-green-100 text-green-600'
                            : course.difficulty === 'Intermediate'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {course.difficulty}
                      </span>
                    </div>

                    <p className='text-sm text-gray-600 mb-3 line-clamp-2'>
                      {course.description}
                    </p>

                    {course.skills && course.skills.length > 0 && (
                      <div className='flex flex-wrap gap-2 mb-3'>
                        {course.skills.map((skill, skillIdx) => (
                          <span
                            key={skillIdx}
                            className={`text-xs px-2 py-1 rounded ${
                              skill
                                .toLowerCase()
                                .includes(targetSkill.toLowerCase())
                                ? 'bg-indigo-100 text-indigo-600 font-semibold'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <a
                      href={course.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm'
                    >
                      🔗 Enroll Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className='mt-6 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <h4 className='font-semibold text-green-800 mb-2'>
              ✅ Learning Path Summary
            </h4>
            <ul className='text-sm text-green-700 space-y-1'>
              <li>• Total Courses: {courses.length}</li>
              <li>• Target Skill: {targetSkill}</li>
              <li>
                • Difficulty Progression:{' '}
                {courses.map(c => c.difficulty).join(' → ')}
              </li>
              <li>
                • Average Rating:{' '}
                {(
                  courses.reduce((sum, c) => sum + c.rating, 0) / courses.length
                ).toFixed(1)}{' '}
                ⭐
              </li>
            </ul>
          </div>
        </div>
      )}

      {!loading && courses.length === 0 && (
        <div className='bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600'>
          Enter a target skill above to generate your personalized learning path
        </div>
      )}
    </div>
  );
}
