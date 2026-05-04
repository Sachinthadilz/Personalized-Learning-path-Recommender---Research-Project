import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  GitBranch,
  BarChart2,
  Building2,
  ClipboardCheck,
  Search,
  ArrowRight,
  BookOpen,
  Zap,
  Users,
  ChevronRight,
  ChevronLeft,
  Play,
} from "lucide-react";
import Footer from "./Footer";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onBackToDashboard?: () => void;
}

const slides = [
  {
    src: "/images/slider-1.png",
    title: "Your Learning Journey\nStarts Here",
    subtitle: "AI-powered course recommendations tailored to your career goals",
  },
  {
    src: "/images/slider-2.png",
    title: "Smart Paths,\nReal Results",
    subtitle:
      "Personalised roadmaps from 10,000+ courses across 500+ universities",
  },
  {
    src: "/images/slider-3.png",
    title: "Learn Without\nBoundaries",
    subtitle: "Track progress, earn skills, and grow — anytime, anywhere",
  },
];

const features = [
  {
    Icon: Sparkles,
    title: "AI Recommendations",
    desc: "Course suggestions based on your goals, interests, and skill level.",
    accent: "bg-blue-600",
  },
  {
    Icon: GitBranch,
    title: "Learning Paths",
    desc: "Structured, goal-oriented roadmaps tailored to your career.",
    accent: "bg-blue-700",
  },
  {
    Icon: BarChart2,
    title: "Progress Analytics",
    desc: "Clear dashboards, milestones, and achievement insights.",
    accent: "bg-amber-500",
  },
  {
    Icon: Building2,
    title: "Top Universities",
    desc: "Courses from world-class institutions globally.",
    accent: "bg-sky-600",
  },
  {
    Icon: ClipboardCheck,
    title: "Skill Assessment",
    desc: "Smart assessments that guide your learning journey.",
    accent: "bg-teal-500",
  },
  {
    Icon: Search,
    title: "Smart Search",
    desc: "AI-enhanced search across thousands of courses.",
    accent: "bg-amber-600",
  },
];

const steps = [
  {
    num: "01",
    title: "Create Profile",
    desc: "Sign up and tell us about your learning goals.",
  },
  {
    num: "02",
    title: "Get Your Path",
    desc: "Our AI generates a personalised learning roadmap.",
  },
  {
    num: "03",
    title: "Learn & Grow",
    desc: "Complete courses, track progress, unlock new skills.",
  },
];

export default function LandingPage({
  onGetStarted,
  onLogin,
  onBackToDashboard,
}: LandingPageProps) {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const [current, setCurrent] = useState(0);

  const next = useCallback(
    () => setCurrent((p) => (p + 1) % slides.length),
    [],
  );
  const prev = useCallback(
    () => setCurrent((p) => (p - 1 + slides.length) % slides.length),
    [],
  );

  useEffect(() => {
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [next]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ═══════════════ NAVBAR (overlaid on slider) ═══════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/70 via-black/40 to-transparent"
        style={{ backdropFilter: "blur(2px)" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="LearnPath AI"
              className="w-11 h-11 object-contain drop-shadow-lg"
            />
            <span className="text-xl font-bold text-white tracking-tight drop-shadow">
              LearnPath <span className="text-amber-400">AI</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80">
            <button
              onClick={() => scrollTo("features")}
              className="hover:text-amber-400 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="hover:text-amber-400 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo("stats")}
              className="hover:text-amber-400 transition-colors"
            >
              About
            </button>
          </nav>
          <div className="flex items-center gap-3">
            {onBackToDashboard ? (
              <button
                onClick={onBackToDashboard}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-blue-950 text-sm font-bold rounded-lg hover:bg-amber-400 transition-all shadow-lg"
              >
                Explore Now <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={onLogin}
                  className="px-5 py-2.5 text-sm font-medium text-white/90 hover:text-white border border-white/30 rounded-lg hover:border-white/60 transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={onGetStarted}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-blue-950 text-sm font-bold rounded-lg hover:bg-amber-400 transition-all shadow-lg"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════ HERO IMAGE SLIDER (full viewport) ═══════════════ */}
      <section className="relative w-full h-[85vh] min-h-[600px] overflow-hidden">
        {/* Slides */}
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`slider-slide absolute inset-0 ${
              idx === current ? "opacity-100 scale-100" : "opacity-0 scale-105"
            }`}
          >
            <img
              src={slide.src}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Dark gradient overlays — layered for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/85 via-blue-950/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-transparent to-blue-950/40" />

        {/* Content overlaid on slider */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="max-w-2xl">
              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6 whitespace-pre-line animate-slide-up"
                style={{
                  textShadow:
                    "0 2px 20px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.4)",
                }}
              >
                {slides[current].title}
              </h1>
              <p
                className="text-lg md:text-xl text-blue-100 mb-8 max-w-lg leading-relaxed animate-slide-up-delay"
                style={{ textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}
              >
                {slides[current].subtitle}
              </p>
              <div className="flex flex-wrap gap-4 animate-slide-up-delay-2">
                <button
                  onClick={onBackToDashboard ?? onGetStarted}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 text-blue-950 font-bold rounded-xl shadow-xl hover:bg-amber-400 hover:shadow-2xl hover:-translate-y-0.5 transition-all text-base"
                >
                  {onBackToDashboard ? "Explore Now" : "Get Started Free"}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollTo("features")}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-md text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-base"
                >
                  <Play className="w-4 h-4" /> Learn More
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Slider nav arrows */}
        <button
          onClick={prev}
          className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/25 transition-all border border-white/20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/25 transition-all border border-white/20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`rounded-full transition-all duration-500 ${
                idx === current
                  ? "w-10 h-3 bg-amber-400"
                  : "w-3 h-3 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ═══════════════ FLOATING STATS BAR ═══════════════ */}
      <section id="stats" className="relative z-10 -mt-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="stats-float bg-white/95 rounded-2xl shadow-2xl border border-gray-100 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {(
              [
                {
                  value: "3K+",
                  label: "Courses",
                  Icon: BookOpen,
                  color: "text-blue-700",
                },
                {
                  value: "150+",
                  label: "Universities",
                  Icon: Building2,
                  color: "text-blue-500",
                },
                {
                  value: "50K+",
                  label: "Learners",
                  Icon: Users,
                  color: "text-amber-500",
                },
                {
                  value: "95%",
                  label: "Satisfaction",
                  Icon: Zap,
                  color: "text-amber-600",
                },
              ] as const
            ).map(({ value, label, Icon, color }) => (
              <div
                key={label}
                className="flex flex-col items-center py-8 px-4 gap-1"
              >
                <Icon className={`w-5 h-5 ${color} mb-1`} />
                <span
                  className={`text-3xl md:text-4xl font-extrabold ${color}`}
                >
                  {value}
                </span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES — Asymmetric Layout ═══════════════ */}
      <section id="features" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-16 items-start">
            {/* Left – Heading */}
            <div className="lg:col-span-2 lg:sticky lg:top-32">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-500 mb-4">
                Features
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Everything you need to{" "}
                <span className="text-blue-700">succeed</span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Powerful tools designed to personalise and accelerate your
                learning journey from day one.
              </p>
              <button
                onClick={onBackToDashboard ?? onGetStarted}
                className="inline-flex items-center gap-2 text-blue-700 font-semibold hover:gap-3 transition-all"
              >
                Explore all features <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right – Feature Cards */}
            <div className="lg:col-span-3 grid sm:grid-cols-2 gap-5">
              {features.map(({ Icon, title, desc, accent }) => (
                <div
                  key={title}
                  className="group bg-gray-50 hover:bg-white rounded-2xl p-6 border border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-default"
                >
                  <div
                    className={`w-12 h-12 ${accent} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS — Horizontal Timeline ═══════════════ */}
      <section
        id="how-it-works"
        className="py-28 bg-gradient-to-b from-blue-50/60 to-white"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-500 mb-4">
              How It Works
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
              Start learning in <span className="text-blue-700">3 steps</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] timeline-line rounded-full" />

            <div className="grid md:grid-cols-3 gap-12 md:gap-8 relative">
              {steps.map(({ num, title, desc }, idx) => (
                <div
                  key={num}
                  className="flex flex-col items-center text-center relative"
                >
                  {/* Step Circle */}
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-extrabold shadow-xl mb-6 relative z-10 ${
                      idx === 2
                        ? "bg-amber-500 text-blue-950"
                        : "bg-blue-700 text-white"
                    }`}
                  >
                    {num}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA BANNER ═══════════════ */}
      {!onBackToDashboard && (
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="relative bg-blue-800 rounded-3xl p-16 overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/30 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/20 rounded-full translate-y-1/3 -translate-x-1/4" />
              <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-blue-500/20 rounded-full" />

              <div className="relative z-10 text-center">
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
                  Ready to transform
                  <br />
                  your learning?
                </h2>
                <p className="text-blue-200 text-lg mb-10 max-w-lg mx-auto">
                  Join 50,000+ learners building in-demand skills with LearnPath
                  AI.
                </p>
                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center gap-3 px-10 py-5 bg-amber-500 text-blue-950 font-bold rounded-xl shadow-2xl hover:bg-amber-400 hover:-translate-y-1 transition-all text-lg"
                >
                  Create Free Account <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer onScrollTo={scrollTo} />
    </div>
  );
}
