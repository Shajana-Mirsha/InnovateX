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
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-40 border-b border-slate-200 py-4 px-6 md:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold text-lg shadow-md shadow-blue-500/20">
            IX
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight font-display">InnovateX</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <Link to="/" className="hover:text-blue-600 transition">Home</Link>
          <Link to="/hackathons" className="hover:text-blue-600 transition">Hackathons</Link>
          <Link to="/login" className="hover:text-blue-600 transition">Sign In</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/20 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Research Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full border border-blue-200 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>IEEE Research · Adaptive Human-in-the-Loop Evaluation</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl leading-tight">
          National Innovation Challenges &{" "}
          <span className="text-blue-600">AI-Calibrated Evaluation</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          InnovateX unites participants, organizers, and expert judges. Discover challenges, form teams, submit verified codebases, and evaluate submissions with explainable LLMs and adaptive human validation.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            to="/hackathons"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition gap-2"
          >
            Explore Active Challenges
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 rounded-xl shadow-sm transition"
          >
            Create Your Account
          </Link>
        </div>

        {/* Closed-Loop Visual Pipeline Preview */}
        <div className="mt-16 w-full max-w-5xl bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <Scale className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                7-Step Adaptive Evaluation Workflow
              </h3>
            </div>
            <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Live Closed-Loop Architecture
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center text-xs font-medium">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-blue-600 font-bold block mb-1">1. Submission</span>
              <span className="text-slate-500 text-xs">GitHub Code & Docs</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-sky-600 font-bold block mb-1">2. Rubric AI</span>
              <span className="text-slate-500 text-xs">Dynamic LLM</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-amber-600 font-bold block mb-1">3. Similarity</span>
              <span className="text-slate-500 text-xs">Vector Embeddings</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-emerald-600 font-bold block mb-1">4. Validation</span>
              <span className="text-slate-500 text-xs">Human Judge</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-indigo-600 font-bold block mb-1">5. Deltas</span>
              <span className="text-slate-500 text-xs">Audit & Pairs</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-purple-600 font-bold block mb-1">6. Calibration</span>
              <span className="text-slate-500 text-xs">Regression Fit</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-emerald-600 font-bold block mb-1">7. Standings</span>
              <span className="text-slate-500 text-xs">Weighted Ranks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              End-to-End Hackathon Engineering Platform
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Complete toolset for participants, university organizers, and technical review judges.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-200 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Dynamic Criteria Rubrics</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Organizers define custom multi-criteria rubrics (0–100% weights) that dynamically feed into LLM scoring prompts.
              </p>
            </div>

            <div className="p-6 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 flex items-center justify-center bg-sky-50 text-sky-600 border border-sky-200 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Team Collaboration</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Form project teams, manage roster capacities, register for competitions, and track member approvals.
              </p>
            </div>

            <div className="p-6 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-200 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Semantic Similarity Defense</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pairwise vector distance checks flag code plagiarism and duplicate project repositories automatically.
              </p>
            </div>

            <div className="p-6 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Human-in-the-Loop Validation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Judges inspect AI rationales, adjust criterion scores, and log deltas that continuously calibrate future scoring.
              </p>
            </div>

            <div className="p-6 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 flex items-center justify-center bg-purple-50 text-purple-600 border border-purple-200 rounded-xl">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Live Multi-Arm Leaderboard</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Compare AI-only, Human-only, and Hybrid rankings in real time via live WebSocket event streams.
              </p>
            </div>

            <div className="p-6 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-200 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Official Podium Declarations</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Declare 1st, 2nd, and 3rd place winners with public honors, transparent feedback, and audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 text-white py-16 px-6 md:px-12 text-center relative">
        <div className="max-w-2xl mx-auto z-10 relative space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to Build and Evaluate the Future?
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Create your account today to participate in national hackathons or organize your institution's premier innovation challenge.
          </p>
          <div className="pt-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition"
            >
              Sign Up Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-slate-500 py-10 px-6 md:px-12 text-xs border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold text-xs">
              IX
            </div>
            <span className="font-bold text-slate-900 text-sm">InnovateX</span>
          </div>
          <p className="text-slate-500 text-xs">
            &copy; 2026 InnovateX Automated Evaluation Platform · IEEE Research Implementation.
          </p>
          <div className="flex gap-6 font-medium text-slate-600">
            <Link to="/hackathons" className="hover:text-blue-600 transition">Hackathons</Link>
            <Link to="/login" className="hover:text-blue-600 transition">Sign In</Link>
            <Link to="/register" className="hover:text-blue-600 transition">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
