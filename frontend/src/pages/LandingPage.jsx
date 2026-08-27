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
} from "lucide-react";

const LandingPage = () => {
  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-40 border-b border-slate-100 py-4 px-6 md:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-600 text-white font-extrabold text-lg">
            IX
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-wide">InnovateX</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <Link to="/" className="hover:text-sky-600 transition">Home</Link>
          <Link to="/hackathons" className="hover:text-sky-600 transition">Hackathons</Link>
          <Link to="/login" className="hover:text-sky-600 transition">Login</Link>
        </div>
        <div>
          <Link
            to="/register"
            className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 text-xs font-semibold text-sky-700 bg-sky-50 rounded-full border border-sky-100">
          <Sparkles className="w-3.5 h-3.5" />
          The Ultimate Hackathon Management System
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight max-w-3xl leading-tight">
          Build. Collaborate. <span className="text-sky-600">Innovate.</span>
        </h1>
        <p className="mt-6 text-base md:text-lg text-slate-500 max-w-xl leading-relaxed">
          InnovateX brings participants, organizers, and judges together. Host, register, form teams, submit code, and evaluate entries—all on a single modern platform.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            to="/hackathons"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-md transition gap-2"
          >
            Explore Hackathons
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition"
          >
            Create an Account
          </Link>
        </div>

        {/* Visual Mockup placeholder */}
        <div className="mt-16 w-full max-w-4xl bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 md:p-4">
          <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video relative flex items-center justify-center text-slate-400">
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="z-10 flex flex-col items-center gap-3">
              <Code className="w-12 h-12 text-sky-500 animate-pulse" />
              <p className="text-sm font-semibold text-slate-200 tracking-wider uppercase">
                InnovateX Workspace Preview
              </p>
              <p className="text-xs text-slate-500">
                A streamlined dashboard designed for modern creators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Powerful Features for Teams and Hosts
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Everything you need to launch, participate in, and judge hackathons.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 border border-slate-100 rounded-2xl hover:shadow-md transition duration-200">
              <div className="w-10 h-10 flex items-center justify-center bg-sky-50 text-sky-600 rounded-lg mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Discover Hackathons</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Find ongoing and upcoming innovation hackathons across diverse domains and modes.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="p-6 border border-slate-100 rounded-2xl hover:shadow-md transition duration-200">
              <div className="w-10 h-10 flex items-center justify-center bg-sky-50 text-sky-600 rounded-lg mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Build Teams</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Create new teams, invite members, or join open teams to build collective solutions.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="p-6 border border-slate-100 rounded-2xl hover:shadow-md transition duration-200">
              <div className="w-10 h-10 flex items-center justify-center bg-sky-50 text-sky-600 rounded-lg mb-4">
                <Code className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Submit Projects</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Submit project repositories, document demos, and submit links for validation.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="p-6 border border-slate-100 rounded-2xl hover:shadow-md transition duration-200">
              <div className="w-10 h-10 flex items-center justify-center bg-sky-50 text-sky-600 rounded-lg mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Judge Projects</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Enables judges to rate submissions using structured criteria and feedback cards.
              </p>
            </div>
            {/* Feature 5 */}
            <div className="p-6 border border-slate-100 rounded-2xl hover:shadow-md transition duration-200">
              <div className="w-10 h-10 flex items-center justify-center bg-sky-50 text-sky-600 rounded-lg mb-4">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Track Leaderboard</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Admins and judges check dynamic rankings sorted by score statistics in real time.
              </p>
            </div>
            {/* Feature 6 */}
            <div className="p-6 border border-slate-100 rounded-2xl hover:shadow-md transition duration-200">
              <div className="w-10 h-10 flex items-center justify-center bg-sky-50 text-sky-600 rounded-lg mb-4">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Announce Winners</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Announce 1st, 2nd, and 3rd place winners with public notifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 max-w-7xl mx-auto px-6 md:px-12 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">How It Works</h2>
          <p className="mt-3 text-sm text-slate-500">
            A simple step-by-step roadmap from sign up to winning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-center">
          <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 flex items-center justify-center bg-sky-600 text-white rounded-full font-bold text-xs shadow">
              1
            </span>
            <h4 className="mt-4 text-sm font-semibold text-slate-800">Discover</h4>
            <p className="mt-2 text-3xs text-slate-500">Find the hackathon that fits your skills.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 flex items-center justify-center bg-sky-600 text-white rounded-full font-bold text-xs shadow">
              2
            </span>
            <h4 className="mt-4 text-sm font-semibold text-slate-800">Form Teams</h4>
            <p className="mt-2 text-3xs text-slate-500">Create a new team or join an open group.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 flex items-center justify-center bg-sky-600 text-white rounded-full font-bold text-xs shadow">
              3
            </span>
            <h4 className="mt-4 text-sm font-semibold text-slate-800">Build & Submit</h4>
            <p className="mt-2 text-3xs text-slate-500">Code your solution and submit before deadline.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 flex items-center justify-center bg-sky-600 text-white rounded-full font-bold text-xs shadow">
              4
            </span>
            <h4 className="mt-4 text-sm font-semibold text-slate-800">Get Evaluated</h4>
            <p className="mt-2 text-3xs text-slate-500">Judges review project criteria details.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 flex items-center justify-center bg-sky-600 text-white rounded-full font-bold text-xs shadow">
              5
            </span>
            <h4 className="mt-4 text-sm font-semibold text-slate-800">Win</h4>
            <p className="mt-2 text-3xs text-slate-500">View final winner declarations publicly.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-sky-900 text-white py-16 px-6 md:px-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="max-w-2xl mx-auto z-10 relative">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Ready to Build the Future?
          </h2>
          <p className="mt-4 text-sky-200 text-sm leading-relaxed">
            Create your account today. Build teams, compete in challenges, and push boundaries.
          </p>
          <div className="mt-8">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-sky-900 font-semibold px-6 py-3 rounded-lg shadow transition"
            >
              Sign Up Now
              <ArrowRight className="w-4 h-4 text-sky-900" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 md:px-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-sky-600 text-white font-extrabold text-sm">
              IX
            </div>
            <span className="font-bold text-white text-base tracking-wide">InnovateX</span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; 2026 InnovateX Hackathon Management. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs font-semibold text-slate-400">
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
