import { useState, useEffect, useRef } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const AUTH_API = "http://localhost:5001";

export default function EmailVerification({ token }: { token: string }) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    hasFetched.current = true;

    (async () => {
      try {
        const res = await fetch(`${AUTH_API}/api/auth/verify-email/${token}`);
        const data = await res.json();
        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified successfully!");
          // Auto-close the tab after 3 seconds
          setTimeout(() => {
            window.close();
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying your email…</h2>
            <p className="text-sm text-gray-500">Please wait while we confirm your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-sm text-gray-500 mb-2">{message}</p>
            <p className="text-xs text-gray-400 mb-6">This tab will close automatically…</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors"
            >
              Go Back
            </a>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              Go back
            </a>
          </>
        )}
      </div>
    </div>
  );
}
