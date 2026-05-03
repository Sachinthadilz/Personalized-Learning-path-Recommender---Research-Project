import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

interface SignupProps {
  onSwitchToLogin: () => void;
  onBackToLanding?: () => void;
}

export default function Signup({
  onSwitchToLogin,
  onBackToLanding,
}: SignupProps) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (formData.lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
        formData.password,
      )
    ) {
      newErrors.password =
        "Password must contain uppercase, lowercase, number, and special character";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      // Show success modal with email
      setSuccessEmail(formData.email);
      setShowSuccessModal(true);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        err.response.data.errors.forEach((error: any) => {
          backendErrors[error.field] = error.message;
        });
        setErrors(backendErrors);
      } else {
        setErrors({
          general:
            err.response?.data?.message ||
            "Registration failed. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToLogin = () => {
    setShowSuccessModal(false);
    onSwitchToLogin();
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${
      errors[field] ? "border-red-400" : "border-gray-200"
    }`;

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel: Brand ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative shapes */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full -translate-y-1/3 -translate-x-1/4" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full translate-y-1/3 translate-x-1/3" />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-blue-400/15 rounded-full" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/images/logo.png"
            alt="LearnPath AI"
            className="w-12 h-12 object-contain"
          />
          <span className="text-xl font-bold text-white">
            LearnPath <span className="text-amber-400">AI</span>
          </span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Start your learning journey today
          </h2>
          <p className="text-blue-200 text-lg leading-relaxed">
            Create your free account and get instant access to AI-powered course
            recommendations and personalised learning paths.
          </p>
        </div>

        {/* Bottom decoration */}
        <div className="relative z-10 flex items-center gap-2 text-blue-300 text-sm">
          <div className="w-8 h-[2px] bg-amber-400 rounded-full" />
          Free to join • No credit card required
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <div className="max-w-md w-full py-4">
          {/* Back Button */}
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-2 text-gray-400 hover:text-blue-700 mb-8 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          )}

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <img
              src="/images/logo.png"
              alt="LearnPath AI"
              className="w-10 h-10 object-contain"
            />
            <span className="text-lg font-bold text-gray-900">
              LearnPath <span className="text-amber-500">AI</span>
            </span>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Create account
          </h2>
          <p className="text-gray-500 mb-8">
            Fill in your details to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {errors.general}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className={inputClass("firstName")}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className={inputClass("lastName")}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={inputClass("email")}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className={inputClass("password")}
                placeholder="Min. 8 characters"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClass("confirmPassword")}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="text-xs text-gray-400 bg-gray-100 rounded-lg px-4 py-3">
              Password requires: uppercase • lowercase • number • special
              character (@$!%*?&)
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-700 text-white py-3.5 px-4 rounded-xl hover:bg-blue-800 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm"
            >
              {isLoading ? "Creating account..." : "Create Account"}{" "}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500 text-sm">
            Already have an account?{" "}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-700 hover:text-blue-800 font-semibold"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Account Created Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Your account has been created. Please sign in with your email to
              access LearnPath AI.
            </p>

            {/* Email Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-gray-600">Registered Email</p>
              <p className="text-lg font-semibold text-gray-900">
                {successEmail}
              </p>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleContinueToLogin}
              className="w-full flex items-center justify-center gap-2 bg-blue-700 text-white py-3 px-4 rounded-xl hover:bg-blue-800 focus:ring-4 focus:ring-blue-200 transition-all font-semibold text-sm"
            >
              Continue to Login <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
