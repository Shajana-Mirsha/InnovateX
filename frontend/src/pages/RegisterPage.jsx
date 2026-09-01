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
    <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Back Link */}
        <div className="p-6 pb-0">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>

        <div className="p-8 pt-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white font-extrabold text-2xl shadow-lg shadow-brand-600/30 mb-4">
              IX
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Create your account</h2>
            <p className="text-xs text-slate-400 mt-1.5">
              Join InnovateX to participate, judge, or host hackathons.
            </p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs leading-relaxed">
              <p className="font-semibold mb-1">Registration Successful! 🎉</p>
              <p className="mb-3 text-slate-300">Your account has been created. You can now log in.</p>
              <Link
                to="/login"
                className="inline-flex items-center font-bold text-emerald-400 hover:text-emerald-300 underline transition"
              >
                Go to Sign In Page &rarr;
              </Link>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="name"
                  required
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl placeholder-slate-500 text-white focus:outline-none focus:border-brand-500 transition"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl placeholder-slate-500 text-white focus:outline-none focus:border-brand-500 transition"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  id="password"
                  required
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl placeholder-slate-500 text-white focus:outline-none focus:border-brand-500 transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5"
              >
                Choose Account Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <UserCheck className="w-4 h-4" />
                </div>
                <select
                  id="role"
                  required
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500 transition"
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

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-brand-400 hover:text-brand-300 transition"
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
