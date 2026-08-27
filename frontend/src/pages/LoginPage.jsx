import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import { Mail, Lock, AlertCircle, ArrowLeft } from "lucide-react";

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expiredMsg, setExpiredMsg] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Check if session expired
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("expired") === "true") {
      setExpiredMsg(true);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExpiredMsg(false);

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
        {/* Back Link */}
        <div className="p-6 pb-0">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-600 text-white font-extrabold text-2xl shadow-sm mb-4">
              IX
            </div>
            <h2 className="text-xl font-bold text-slate-900">Sign in to InnovateX</h2>
            <p className="text-xs text-slate-500 mt-1.5">
              Welcome back! Please enter your details.
            </p>
          </div>

          {/* Expired Message */}
          {expiredMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-100 text-amber-800 rounded-lg text-xs leading-relaxed animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs leading-relaxed animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  className="block w-full pl-10 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition duration-150"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  id="password"
                  required
                  className="block w-full pl-10 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition duration-150"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-sky-600 hover:text-sky-700 transition"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
