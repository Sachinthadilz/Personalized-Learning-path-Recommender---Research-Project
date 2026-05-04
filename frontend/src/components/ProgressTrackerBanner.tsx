import { useState } from "react";
import {
  Download,
  Chrome,
  X,
  CheckCircle2,
  ArrowRight,
  Monitor,
  BarChart3,
  Shield,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { FaChrome, FaEdge, FaOpera } from "react-icons/fa";
import { SiBrave, SiVivaldi } from "react-icons/si";

const DISMISSED_KEY = "app.progressTrackerBanner.dismissed";

const browsers = [
  { name: "Chrome", icon: "chrome" },
  { name: "Edge", icon: "edge" },
  { name: "Brave", icon: "brave" },
  { name: "Opera", icon: "opera" },
  { name: "Vivaldi", icon: "vivaldi" },
];

const features = [
  {
    Icon: BarChart3,
    title: "Auto-Track Progress",
    desc: "Automatically logs your course completions, time spent, and milestones.",
  },
  {
    Icon: Monitor,
    title: "Cross-Platform Sync",
    desc: "Seamlessly syncs progress across all your Chromium-based browsers.",
  },
  {
    Icon: Shield,
    title: "Privacy First",
    desc: "Your data stays private. We only track learning metrics, nothing else.",
  },
];

export default function ProgressTrackerBanner() {
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === "true"
  );
  const [isExpanded, setIsExpanded] = useState(false);

  // TODO: Replace with real extension link when available
  const EXTENSION_LINK = "https://chrome.google.com/webstore/detail/learnpath-ai-tracker/mock-extension-id";

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "true");
  };

  const handleInstallClick = () => {
    window.open(EXTENSION_LINK, "_blank", "noopener,noreferrer");
  };

  if (isDismissed) {
    return (
      <button
        onClick={() => {
          setIsDismissed(false);
          localStorage.removeItem(DISMISSED_KEY);
        }}
        className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-xl border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all text-sm font-medium"
        id="progress-tracker-reopen"
      >
        <Download className="w-4 h-4 group-hover:animate-bounce" />
        <span>Track Your Progress</span>
        <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
      </button>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-100 shadow-lg animate-fade-in" id="progress-tracker-banner">
      {/* ── Compact Banner ── */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-amber-400/10 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-indigo-400/15 rounded-full" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all z-20"
          title="Dismiss"
          id="progress-tracker-dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Icon */}
          <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20 shadow-xl">
            <Chrome className="w-8 h-8 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500 text-amber-950 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                <Download className="w-3 h-3" />
                New
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-1">
              Track Your Learning Progress
            </h3>
            <p className="text-blue-200 text-sm sm:text-base max-w-xl leading-relaxed">
              Install our browser extension to automatically track your course progress, 
              study time, and achievements — works with all Chromium browsers.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-3 flex-shrink-0 sm:min-w-[200px]">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 text-blue-950 font-bold rounded-xl shadow-xl hover:bg-amber-400 hover:shadow-2xl hover:-translate-y-0.5 transition-all text-sm"
              id="progress-tracker-install"
            >
              <Download className="w-4 h-4" />
              Install Extension
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all text-sm"
              id="progress-tracker-learn-more"
            >
              {isExpanded ? "Show Less" : "Learn More"}
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Expanded Details Panel ── */}
      <div
        className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="bg-gradient-to-b from-blue-50 to-white p-8">
            {/* Features */}
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            {features.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 mb-4 group-hover:scale-110 group-hover:bg-blue-700 group-hover:text-white transition-all duration-300 shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-gray-900 mb-2">
                  {title}
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Supported Browsers */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Supported Chromium Browsers
            </h4>
            <div className="flex flex-wrap gap-3">
              {browsers.map((browser) => (
                <div
                  key={browser.name}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 border border-gray-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all cursor-default"
                >
                  <BrowserIcon name={browser.icon} />
                  {browser.name}
                </div>
              ))}
            </div>

            {/* Install instructions */}
            <div className="mt-6 flex items-start gap-3 bg-amber-50 rounded-xl p-4 border border-amber-100">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  Quick Install
                </p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Click "Install Extension" above → Add to your browser → Sign in with your LearnPath AI account → Start tracking automatically!
                </p>
              </div>
            </div>

            {/* Direct link */}
            <div className="mt-4 text-center">
              <a
                href={EXTENSION_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                id="progress-tracker-direct-link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Or visit the Chrome Web Store directly
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );}

/* ── High-quality react-icons for browsers ── */
function BrowserIcon({ name }: { name: string }) {
  const sizeClass = "w-5 h-5";

  switch (name) {
    case "chrome":
      return <FaChrome className={`${sizeClass} text-blue-500`} />;
    case "edge":
      return <FaEdge className={`${sizeClass} text-blue-600`} />;
    case "brave":
      return <SiBrave className={`${sizeClass} text-orange-500`} />;
    case "opera":
      return <FaOpera className={`${sizeClass} text-red-500`} />;
    case "vivaldi":
      return <SiVivaldi className={`${sizeClass} text-red-600`} />;
    default:
      return <Chrome className={`${sizeClass} text-gray-500`} />;
  }
}

