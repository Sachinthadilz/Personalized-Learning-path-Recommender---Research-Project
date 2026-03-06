import {
  Sparkles,
  GitBranch,
  BarChart2,
  Building2,
  ClipboardCheck,
  Search,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Zap,
  Users,
  ChevronRight,
} from "lucide-react";
import Footer from "./Footer";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onBackToDashboard?: () => void;
}

export default function LandingPage({
  onGetStarted,
  onLogin,
  onBackToDashboard,
}: LandingPageProps) {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
              LearnPath AI
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <button onClick={() => scrollTo("features")} className="hover:text-indigo-600 transition-colors">Features</button>
            <button onClick={() => scrollTo("how-it-works")} className="hover:text-indigo-600 transition-colors">How It Works</button>
            <button onClick={() => scrollTo("stats")} className="hover:text-indigo-600 transition-colors">About</button>
          </nav>
          <div className="flex items-center gap-3">
            {onBackToDashboard ? (
              <button onClick={onBackToDashboard} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:shadow-md hover:-translate-y-px transition-all">
                Explore Now <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button onClick={onLogin} className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">Sign In</button>
                <button onClick={onGetStarted} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:shadow-md hover:-translate-y-px transition-all">
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24 pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-br from-indigo-100/60 to-purple-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-100/40 rounded-full blur-2xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            AI-Powered Learning Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6 max-w-4xl mx-auto">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">Learn Smarter.</span>
            <br />
            <span className="text-gray-900">Grow Faster.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover AI-curated learning paths, thousands of courses from top universities, and personalised skill recommendations â€” all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onBackToDashboard ?? onGetStarted} className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-base">
              {onBackToDashboard ? "Explore Now" : "Get Started Free"} <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => scrollTo("features")} className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-base">
              See Features <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-8 text-sm text-gray-400 flex items-center justify-center gap-2 flex-wrap">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card required
            &nbsp;Â·&nbsp;
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Free to explore
          </p>
        </div>
      </section>

      {/* â”€â”€ STATS BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="stats" className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {([
            { value: "10K+", label: "Courses Available", Icon: BookOpen, color: "text-indigo-600" },
            { value: "500+", label: "Universities", Icon: Building2, color: "text-purple-600" },
            { value: "50K+", label: "Active Learners", Icon: Users, color: "text-pink-600" },
            { value: "95%",  label: "Learner Satisfaction", Icon: Zap, color: "text-amber-500" },
          ] as const).map(({ value, label, Icon, color }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon className={`w-6 h-6 ${color}`} />
              <span className={`text-4xl font-extrabold ${color}`}>{value}</span>
              <span className="text-sm text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* â”€â”€ FEATURES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-3">Features</span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to succeed</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base">Powerful tools designed to personalise and accelerate your learning journey from day one.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { Icon: Sparkles, gradient: "from-indigo-500 to-purple-500", title: "AI-Powered Recommendations", desc: "Get personalised course suggestions based on your goals, interests, and current skill level." },
              { Icon: GitBranch, gradient: "from-purple-500 to-pink-500", title: "Custom Learning Paths", desc: "Follow structured, goal-oriented paths tailored to your career objectives and timeline." },
              { Icon: BarChart2, gradient: "from-pink-500 to-rose-500", title: "Progress Analytics", desc: "Track your learning journey with clear dashboards, milestones, and achievement insights." },
              { Icon: Building2, gradient: "from-blue-500 to-indigo-500", title: "Top Universities", desc: "Access courses from world-class universities and industry-leading institutions globally." },
              { Icon: ClipboardCheck, gradient: "from-green-500 to-teal-500", title: "Skill Assessment", desc: "Identify strengths and growth areas with smart assessments that guide your next step." },
              { Icon: Search, gradient: "from-amber-500 to-orange-500", title: "Smart Search", desc: "Find exactly what you need instantly with AI-enhanced search across thousands of courses." },
            ].map(({ Icon, gradient, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white mb-5 shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ HOW IT WORKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-3">How It Works</span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Start learning in 3 simple steps</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base">Getting started is quick and completely free.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Create your profile", desc: "Sign up in seconds and tell us about your learning goals and current skills.", color: "bg-indigo-600" },
              { step: "02", title: "Get your path", desc: "Our AI analyses your profile and generates a personalised learning roadmap just for you.", color: "bg-purple-600" },
              { step: "03", title: "Learn & grow", desc: "Follow your path, complete courses, track progress, and unlock new skills every day.", color: "bg-pink-600" },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="flex flex-col items-center text-center gap-4">
                <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-lg`}>{step}</div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ CTA BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!onBackToDashboard && (
        <section className="py-24 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to transform your learning?</h2>
              <p className="text-indigo-100 text-base mb-8 max-w-xl mx-auto">Join over 50,000 learners already building in-demand skills with LearnPath AI.</p>
              <button onClick={onGetStarted} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      <Footer onScrollTo={scrollTo} />
    </div>
  );
}
