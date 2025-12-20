import { useState } from 'react';
import { aiSemanticSearch, type AISearchResult } from '../api';

export default function AISearchTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AISearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState<number>(0);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const data = await aiSemanticSearch(query, 20);
      setResults(data);
      const endTime = performance.now();
      setSearchTime((endTime - startTime) / 1000);
    } catch (err) {
      setError('AI search failed. Make sure embeddings are generated first.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const exampleQueries = [
    'machine learning for beginners',
    'advanced data science with Python',
    'web development with JavaScript',
    'cloud computing and AWS',
    'artificial intelligence and neural networks',
  ];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow-lg p-8'>
        <h2 className='text-3xl font-bold mb-3'>🤖 AI-Powered Semantic Search</h2>
        <p className='text-purple-100 mb-4'>
          Search courses using natural language. Our AI understands context and meaning, not just keywords!
        </p>
        <div className='bg-white/10 backdrop-blur rounded-lg p-4'>
          <p className='text-sm'>
            💡 <strong>How it works:</strong> We use sentence embeddings to understand the semantic meaning of course descriptions, allowing you to find relevant courses even if they don't contain your exact keywords.
          </p>
        </div>
      </div>

      {/* Search Box */}
      <div className='bg-white rounded-lg shadow-lg p-6'>
        <div className='flex gap-3'>
          <input
            type='text'
            placeholder='Describe what you want to learn... (e.g., "learn Python for data analysis")'
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className='flex-1 px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className='px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg'
          >
            {loading ? (
              <span className='flex items-center gap-2'>
                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                Searching...
              </span>
            ) : (
              '🔍 AI Search'
            )}
          </button>
        </div>

        {/* Example Queries */}
        <div className='mt-4'>
          <p className='text-sm text-gray-600 mb-2'>💡 Try these examples:</p>
          <div className='flex flex-wrap gap-2'>
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(example)}
                className='text-sm px-3 py-1 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition-colors'
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <p className='text-xs text-gray-500 mt-4'>
          Endpoint: <code className='bg-gray-100 px-2 py-1 rounded'>POST /ai-search</code>
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-600'>❌ {error}</p>
          <p className='text-sm text-red-500 mt-2'>
            Run <code className='bg-red-100 px-2 py-1 rounded'>python vector_setup.py</code> to generate embeddings first.
          </p>
        </div>
      )}

      {/* Results Header */}
      {!loading && results.length > 0 && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
          <p className='text-green-700 font-medium'>
            ✨ Found {results.length} relevant courses in {searchTime.toFixed(2)}s
          </p>
        </div>
      )}

      {/* Results Grid */}
      {!loading && results.length > 0 && (
        <div className='grid grid-cols-1 gap-4'>
          {results.map((course, idx) => (
            <div
              key={course.id}
              className='bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-xl hover:border-purple-300 transition-all'
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-3'>
                    <div className='bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg'>
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className='text-xl font-bold text-gray-800'>{course.name}</h3>
                      <p className='text-sm text-gray-600'>{course.university}</p>
                    </div>
                  </div>

                  <p className='text-gray-700 mb-4 leading-relaxed'>{course.description}</p>

                  <div className='flex flex-wrap gap-2 mb-4'>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        course.difficulty === 'Beginner'
                          ? 'bg-green-100 text-green-700'
                          : course.difficulty === 'Intermediate'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {course.difficulty}
                    </span>
                    <span className='px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm'>
                      ⭐ {course.rating.toFixed(1)}
                    </span>
                  </div>

                  {course.skills && course.skills.length > 0 && (
                    <div className='flex flex-wrap gap-2 mb-4'>
                      {course.skills.slice(0, 5).map((skill, skillIdx) => (
                        <span
                          key={skillIdx}
                          className='text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded'
                        >
                          {skill}
                        </span>
                      ))}
                      {course.skills.length > 5 && (
                        <span className='text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded'>
                          +{course.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className='flex flex-col items-end gap-3'>
                  <div className='bg-purple-100 px-4 py-2 rounded-lg text-center'>
                    <div className='text-2xl font-bold text-purple-600'>
                      {(course.similarity_score * 100).toFixed(1)}%
                    </div>
                    <div className='text-xs text-purple-600 font-medium'>Match</div>
                  </div>

                  <a
                    href={course.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md text-sm font-medium'
                  >
                    View Course →
                  </a>
                </div>
              </div>

              {/* Similarity Score Bar */}
              <div className='mt-4 bg-gray-200 rounded-full h-2 overflow-hidden'>
                <div
                  className='bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-500'
                  style={{ width: `${course.similarity_score * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div className='bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center'>
          <div className='text-6xl mb-4'>🔍</div>
          <p className='text-gray-600 text-lg'>
            No courses found matching your query. Try different keywords or check if embeddings are generated.
          </p>
        </div>
      )}

      {!query && !loading && (
        <div className='bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-12 text-center'>
          <div className='text-6xl mb-4'>✨</div>
          <h3 className='text-2xl font-bold text-gray-800 mb-3'>Ready to discover courses?</h3>
          <p className='text-gray-600 mb-6'>
            Enter a natural language description of what you want to learn, and our AI will find the most relevant courses for you.
          </p>
          <div className='bg-white rounded-lg p-4 max-w-2xl mx-auto'>
            <p className='text-sm text-gray-700 mb-2'>
              <strong>🎯 Example searches:</strong>
            </p>
            <ul className='text-sm text-gray-600 space-y-1'>
              <li>• "I want to build mobile apps with React Native"</li>
              <li>• "Teach me data visualization and statistics"</li>
              <li>• "Introduction to blockchain and cryptocurrency"</li>
              <li>• "Career change to software engineering"</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
