import React from "react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import { User, Mail, ShieldAlert, Award, ShieldCheck, CheckCircle2 } from "lucide-react";

const ProfilePage = () => {
  const { user } = useAuth();
  if (!user) return null;

  const roleCapabilities = {
    participant: [
      "Discover national hackathon challenges and rubric dimensions",
      "Form collaborative project teams as a leader or team member",
      "Register teams for verified competitions",
      "Publish project codebase repositories and architecture summaries",
      "Receive AI evaluation feedback and calibrated score breakdowns",
      "Review live transparent leaderboards and declared podium standings",
    ],
    organizer: [
      "Host new hackathons with custom multi-criteria rubrics (0-100% weights)",
      "Review registrations and approve/reject team applicants",
      "Run Batch AI Evaluations via real-time WebSocket progress streams",
      "Audit semantic plagiarism and flag duplicate repositories",
      "Declare official 1st, 2nd, and 3rd place podium winners",
      "Monitor calibration reports and research metrics (MSE, Kappa, RMSE)",
    ],
    judge: [
      "Access the Judge Evaluation Workspace for assigned hackathon challenges",
      "Conduct Human-in-the-Loop score validations with staggered AI reveals",
      "Review criterion-by-criterion deltas between AI baseline and human grades",
      "Record correction logs to continuously train adaptive calibration models",
      "Check dynamic multi-arm rankings on the live leaderboard",
    ],
    admin: [
      "Complete system administration and governance authority",
      "Manage user directory, adjust role privileges, and supervise security",
      "Inspect real-time system metrics, aggregate evaluations, and active challenges",
      "Audit live Human-in-the-Loop validation events and correction trails",
      "Full access to research analytics, bias regression models, and paper charts",
    ],
  };

  const capabilities = roleCapabilities[user.role] || [];

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          <User className="w-3.5 h-3.5" />
          <span>Account & Permissions</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          User Profile & Role Privileges
        </h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Profile header visual */}
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 relative">
          <div className="absolute -bottom-10 left-8">
            <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md border border-slate-200">
              <div className="w-full h-full rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-2xl font-mono">
                {user.name ? user.name.substring(0, 2).toUpperCase() : "U"}
              </div>
            </div>
          </div>
        </div>

        {/* Profile info fields */}
        <div className="pt-14 p-8 space-y-6">
          <div className="border-b border-slate-200 pb-5">
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-xs text-slate-500 capitalize font-mono mt-1">
              Account Privilege: <strong className="text-blue-600 font-bold">{user.role}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-slate-500 uppercase tracking-wider">Email Address</p>
              <div className="flex items-center gap-2 mt-1.5 text-slate-900 font-mono font-medium text-sm">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>{user.email}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-semibold text-slate-500 uppercase tracking-wider">System Authorization</p>
              <div className="flex items-center gap-2 mt-1.5 text-slate-900 font-medium text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="capitalize">{user.role} Active Authorization</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-based permissions info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
          <Award className="w-4.5 h-4.5 text-blue-600" />
          Authorized Platform Capabilities
        </h3>

        <ul className="space-y-3 text-sm text-slate-600">
          {capabilities.map((cap, idx) => (
            <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{cap}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProfilePage;
