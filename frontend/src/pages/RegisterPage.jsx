import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { register as registerApi } from "../api/authApi";
import Button from "../components/common/Button";
import { Mail, Lock, User, UserCheck, AlertCircle, ArrowLeft } from "lucide-react";

const RegisterPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("participant");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name || !email || !password || !role) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const data = await registerApi(name, email, password, role);
      setLoading(false);
      if (data.success) {
        setSuccess(true);
        // Clear fields
        setName("");
        setEmail("");
        setPassword("");
        setRole("participant");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
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
            <h2 className="text-xl font-bold text-slate-900">Create your account</h2>
            <p className="text-xs text-slate-500 mt-1.5">
              Build and collaborate. Join InnovateX today.
            </p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="mb-5 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs leading-relaxed animate-in fade-in duration-200">
              <p className="font-semibold mb-1">Registration Successful! 🎉</p>
              <p className="mb-3">Your account has been created. You can now log in.</p>
              <Link
                to="/login"
                className="inline-flex items-center font-bold text-emerald-700 hover:text-emerald-800 underline transition"
              >
                Go to Sign In Page
              </Link>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs leading-relaxed animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-slate-700 mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="name"
                  required
                  className="block w-full pl-10 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition duration-150"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

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
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 mb-2"
              >
                Password
              </label>
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

            <div>
              <label
                htmlFor="role"
                className="block text-xs font-semibold text-slate-700 mb-2"
              >
                Choose Account Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <select
                  id="role"
                  required
                  className="block w-full pl-10 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-850 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition duration-150"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="participant">Participant</option>
                  <option value="organizer">Organizer</option>
                  <option value="judge">Judge</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4"
              loading={loading}
              disabled={success}
            >
              Sign Up
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-sky-600 hover:text-sky-700 transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
