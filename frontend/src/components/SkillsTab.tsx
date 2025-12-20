import { useState, useEffect } from 'react';
import { getAllSkills, getRelatedSkills, type Skill } from '../api';

export default function SkillsTab() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [relatedSkills, setRelatedSkills] = useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSkills(100);
      setSkills(data);
    } catch (err) {
      setError('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const handleGetRelated = async (skillName: string) => {
    setSelectedSkill(skillName);
    setLoading(true);
    setError(null);
    try {
      const data = await getRelatedSkills(skillName, 20);
      setRelatedSkills(data);
    } catch (err) {
      setError('Failed to load related skills');
      setRelatedSkills([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-2xl font-bold text-gray-800 mb-2'>
          🎯 Skills Catalog
        </h2>
        <p className='text-gray-600'>
          Explore all skills taught across courses and discover related skills
        </p>
        <div className='mt-4 flex gap-3'>
          <button
            onClick={loadSkills}
            className='px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'
          >
            🔄 Refresh Skills
            <div className='text-xs mt-1 opacity-90'>GET /skills</div>
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

      {/* Skills Grid */}
      {!loading && skills.length > 0 && (
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-xl font-bold text-gray-800 mb-4'>
            📚 All Skills ({skills.length})
          </h3>

          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
            {skills.map((skill, idx) => (
              <button
                key={idx}
                onClick={() => handleGetRelated(skill.name)}
                className={`p-3 rounded-lg text-left transition-all ${
                  selectedSkill === skill.name
                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                }`}
              >
                <div className='font-semibold truncate'>{skill.name}</div>
                <div
                  className={`text-sm mt-1 ${
                    selectedSkill === skill.name
                      ? 'text-indigo-100'
                      : 'text-gray-600'
                  }`}
                >
                  {skill.count} courses
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Related Skills */}
      {selectedSkill && relatedSkills.length > 0 && (
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-xl font-bold text-gray-800 mb-2'>
            🔗 Skills Related to "{selectedSkill}"
          </h3>
          <p className='text-sm text-gray-600 mb-4'>
            Endpoint:{' '}
            <code className='bg-gray-100 px-2 py-1 rounded'>
              GET /skills/{selectedSkill}/related
            </code>
          </p>

          <div className='flex flex-wrap gap-2'>
            {relatedSkills.map((skill, idx) => (
              <button
                key={idx}
                onClick={() => handleGetRelated(skill)}
                className='px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium'
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedSkill && relatedSkills.length === 0 && !loading && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700'>
          ℹ️ No related skills found for "{selectedSkill}"
        </div>
      )}

      {!loading && skills.length === 0 && (
        <div className='bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600'>
          No skills found. Click refresh to load skills from the database.
        </div>
      )}
    </div>
  );
}
