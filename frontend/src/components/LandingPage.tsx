interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({
  onGetStarted,
  onLogin,
}: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative">
      {/* Background Image Overlay */}
      <div
        className="fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage: "url(/images/ai-brain-background.jpeg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      />
      <div className="fixed inset-0 z-[1] bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/60" />

      {/* Content Wrapper */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  LP
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  LearnPath AI
                </span>
              </div>
              <button
                onClick={onLogin}
                className="px-6 py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 relative">
          <div className="text-center max-w-4xl mx-auto relative z-10">
            <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm mb-8">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-gray-700">
                AI-Powered Learning Platform
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Learn Smarter,
              </span>
              <br />
              <span className="text-gray-800">Not Harder</span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Discover personalized learning paths powered by AI. Access
              thousands of courses, build in-demand skills, and achieve your
              educational goals faster.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                Get Started Free
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                Explore Features
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  10K+
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Courses Available
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  50K+
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Active Learners
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                  95%
                </div>
                <div className="text-sm text-gray-600 mt-2">Success Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white/60 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Powerful features designed to accelerate your learning journey
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Feature 1 */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-2xl mb-4">
                  🤖
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  AI-Powered Recommendations
                </h3>
                <p className="text-gray-600">
                  Get personalized course suggestions based on your goals,
                  interests, and learning style.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-2xl mb-4">
                  🛤️
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Custom Learning Paths
                </h3>
                <p className="text-gray-600">
                  Follow structured paths tailored to your career objectives and
                  skill development needs.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center text-white text-2xl mb-4">
                  📊
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Progress Tracking
                </h3>
                <p className="text-gray-600">
                  Monitor your learning journey with detailed analytics and
                  achievement milestones.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-2xl mb-4">
                  🎓
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Top Universities
                </h3>
                <p className="text-gray-600">
                  Access courses from world-renowned universities and
                  industry-leading institutions.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-2xl mb-4">
                  🎯
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Skill Assessment
                </h3>
                <p className="text-gray-600">
                  Evaluate your current skills and identify areas for
                  improvement with smart assessments.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-2xl mb-4">
                  🔍
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Smart Search
                </h3>
                <p className="text-gray-600">
                  Find exactly what you need with AI-enhanced search across
                  thousands of courses.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
              {/* Decorative overlay */}
              <div className="absolute inset-0 bg-black/5"></div>
              <div className="relative z-10">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Ready to Start Learning?
                </h2>
                <p className="text-xl text-indigo-100 mb-8">
                  Join thousands of learners who are already transforming their
                  careers
                </p>
                <button
                  onClick={onGetStarted}
                  className="px-10 py-4 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                  Create Free Account
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900/95 backdrop-blur-sm text-gray-400 py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    LP
                  </div>
                  <span className="text-xl font-bold text-white">
                    LearnPath AI
                  </span>
                </div>
                <p className="text-sm">
                  Empowering learners worldwide with AI-driven educational
                  experiences.
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Courses
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Careers
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Privacy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-sm">
              <p>&copy; 2026 LearnPath AI. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
