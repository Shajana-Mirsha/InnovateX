import React from "react";
import { Link } from "react-router-dom";
import {
  Code,
  Users,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles,
  Trophy,
  CheckCircle,
  Scale,
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react";

const LandingPage = () => {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full bg-slate-900/80 backdrop-blur-md z-40 border-b border-slate-800 py-4 px-6 md:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-600 text-white font-extrabold text-lg shadow-md shadow-brand-600/30">
            IX
          </div>
          <span className="font-bold text-white text-lg tracking-tight font-display">InnovateX</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
          <Link to="/" className="hover:text-brand-400 transition">Home</Link>
          <Link to="/hackathons" className="hover:text-brand-400 transition">Hackathons</Link>
          <Link to="/login" className="hover:text-brand-400 transition">Sign In</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden sm:inline-flex px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-600/20 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 text-xs font-semibold text-brand-300 bg-brand-500/10 rounded-full border border-brand-500/30 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>IEEE Research · Adaptive Human-in-the-Loop Evaluation</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight max-w-4xl leading-tight font-display">
          National Innovation Challenges & <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-sky-400">AI-Calibrated Evaluation</span>
        </h1>

        <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
          InnovateX unites participants, organizers, and expert judges. Discover challenges, form teams, submit verified codebases, and evaluate submissions with explainable LLMs and adaptive human validation.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            to="/hackathons"
            className="inline-flex items-center justify-center px-6 py-3 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/30 transition gap-2"
          >
            Explore Active Challenges
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-6 py-3 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-600 hover:text-white rounded-xl transition"
          >
            Create Your Account
          </Link>
        </div>

        {/* Closed-Loop Visual Pipeline Preview */}
        <div className="mt-16 w-full max-w-5xl glass-panel border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 text-left">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Scale className="w-5 h-5 text-brand-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                7-Step Adaptive Evaluation Workflow
              </h3>
            </div>
            <span className="text-3xs font-mono px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
              Live Closed-Loop Architecture
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center text-3xs font-medium">
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-brand-400 font-bold block mb-1">1. Submission</span>
              <span className="text-slate-400">GitHub Code & Docs</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-sky-400 font-bold block mb-1">2. Rubric AI</span>
              <span className="text-slate-400">Dynamic Criterion LLM</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-amber-400 font-bold block mb-1">3. Similarity</span>
              <span className="text-slate-400">Vector Embeddings</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-1">4. Validation</span>
              <span className="text-slate-400">Human Judge Review</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-indigo-400 font-bold block mb-1">5. Deltas</span>
              <span className="text-slate-400">Audit & Sample Pairs</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-brand-400 font-bold block mb-1">6. Calibration</span>
              <span className="text-slate-400">Linear Regression Fit</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-1">7. Standings</span>
              <span className="text-slate-400">Weighted Rankings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-900/60 py-20 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              End-to-End Hackathon Engineering Platform
            </h2>
            <p className="mt-2 text-xs md:text-sm text-slate-400">
              Complete toolset for participants, university organizers, and technical review judges.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 glass-card border border-slate-800 rounded-3xl space-y-3">
              <div className="w-10 h-10 flex items-center justify-center bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-2xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Dynamic Criteria Rubrics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organizers define custom multi-criteria rubrics (0–100% weights) that dynamically feed into LLM scoring prompts.
              </p>
            </div>

            <div className="p-6 glass-card border border-slate-800 rounded-3xl space-y-3">
              <div className="w-10 h-10 flex items-center justify-center bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-2xl">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Team Collaboration</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Form project teams, manage roster capacities, register for competitions, and track member approvals.
              </p>
            </div>

            <div className="p-6 glass-card border border-slate-800 rounded-3xl space-y-3">
              <div className="w-10 h-10 flex items-center justify-center bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Semantic Similarity Defense</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pairwise vector distance checks flag code plagiarism and duplicate project repositories automatically.
              </p>
            </div>

            <div className="p-6 glass-card border border-slate-800 rounded-3xl space-y-3">
              <div className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Human-in-the-Loop Validation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Judges inspect AI rationales, adjust criterion scores, and log deltas that continuously calibrate future scoring.
              </p>
            </div>

            <div className="p-6 glass-card border border-slate-800 rounded-3xl space-y-3">
              <div className="w-10 h-10 flex items-center justify-center bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-2xl">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Live Multi-Arm Leaderboard</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compare AI-only, Human-only, and Hybrid rankings in real time via live WebSocket event streams.
              </p>
            </div>

            <div className="p-6 glass-card border border-slate-800 rounded-3xl space-y-3">
              <div className="w-10 h-10 flex items-center justify-center bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Official Podium Declarations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Declare 1st, 2nd, and 3rd place winners with public honors, transparent feedback, and audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-brand-950 via-slate-900 to-slate-900 py-16 px-6 md:px-12 text-center border-b border-slate-800 relative">
        <div className="max-w-2xl mx-auto z-10 relative space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ready to Build and Evaluate the Future?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Create your account today to participate in national hackathons or organize your institution's premier innovation challenge.
          </p>
          <div className="pt-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-6 py-3 rounded-xl shadow-lg shadow-brand-600/30 transition"
            >
              Sign Up Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-10 px-6 md:px-12 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-600 text-white font-extrabold text-xs">
              IX
            </div>
            <span className="font-bold text-white text-sm">InnovateX</span>
          </div>
          <p className="text-slate-500 text-3xs">
            &copy; 2026 InnovateX Automated Evaluation Platform · IEEE Research Implementation.
          </p>
          <div className="flex gap-6 font-medium text-slate-400">
            <Link to="/hackathons" className="hover:text-white transition">Hackathons</Link>
            <Link to="/login" className="hover:text-white transition">Sign In</Link>
            <Link to="/register" className="hover:text-white transition">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
