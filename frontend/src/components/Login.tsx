import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface LoginProps {
  onSwitchToSignup: () => void;
  onBackToLanding?: () => void;
}

export default function Login({
  onSwitchToSignup,
  onBackToLanding,
}: LoginProps) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(formData);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel: Brand ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/15 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-blue-500/15 rounded-full" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/images/logo.png" alt="LearnPath AI" className="w-12 h-12 object-contain" />
          <span className="text-xl font-bold text-white">
            LearnPath <span className="text-amber-400">AI</span>
          </span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Welcome back to your learning journey
          </h2>
          <p className="text-blue-200 text-lg leading-relaxed">
            Pick up where you left off. Your personalised paths and progress are waiting for you.
          </p>
        </div>

        {/* Bottom decoration */}
        <div className="relative z-10 flex items-center gap-2 text-blue-300 text-sm">
          <div className="w-8 h-[2px] bg-amber-400 rounded-full" />
          Trusted by 50,000+ learners worldwide
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full">
          {/* Back Button */}
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-2 text-gray-400 hover:text-blue-700 mb-10 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          )}

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/images/logo.png" alt="LearnPath AI" className="w-10 h-10 object-contain" />
            <span className="text-lg font-bold text-gray-900">
              LearnPath <span className="text-amber-500">AI</span>
            </span>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Sign in</h2>
          <p className="text-gray-500 mb-8">Enter your credentials to access your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-700 text-white py-3.5 px-4 rounded-xl hover:bg-blue-800 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm"
            >
              {isLoading ? "Signing in..." : "Sign In"} {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500 text-sm">
            Don't have an account?{" "}
            <button onClick={onSwitchToSignup} className="text-blue-700 hover:text-blue-800 font-semibold">
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
