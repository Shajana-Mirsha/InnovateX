import React from "react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import { User, Mail, ShieldAlert, Award } from "lucide-react";

const ProfilePage = () => {
  const { user } = useAuth();
  if (!user) return null;

  const roleCapabilities = {
    participant: [
      "Discover hackathon events on the platform",
      "Form collaborate project teams as a leader",
      "Join open team channels to contribute",
      "Register teams for challenges",
      "Publish project codebase repositories",
      "Receive notifications on status approvals and declared winners",
    ],
    organizer: [
      "Host new hackathons with schedules and deadlines",
      "Review registrations and approve/reject teams",
      "Browse submitted code solutions",
      "Declare 1st, 2nd, and 3rd place winners",
      "Delete and configure hosted hackathons",
    ],
    judge: [
      "Review project submissions made by teams",
      "Grade submissions across innovation, impact, presentation and implementation",
      "Add constructive codebase review comments",
      "Check dynamic rankings on the leaderboard",
    ],
    admin: [
      "Complete system administration rights",
      "Manage all hosted events, registration teams, and project solutions",
      "Override or configure standings, winners, and user privileges",
    ],
  };

  const capabilities = roleCapabilities[user.role] || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-200">
      <PageHeader
        title="User Profile"
        description="Manage your profile information and review role-based capabilities."
      />

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        {/* Profile header visual */}
        <div className="h-32 bg-gradient-to-r from-sky-500 to-sky-600 relative">
          <div className="absolute -bottom-10 left-8">
            <div className="w-20 h-20 rounded-full bg-white p-1 shadow">
              <div className="w-full h-full rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-2xl border border-sky-200">
                {user.name ? user.name.substring(0, 2).toUpperCase() : "U"}
              </div>
            </div>
          </div>
        </div>

        {/* Profile info fields */}
        <div className="pt-14 p-8 space-y-6">
          <div className="border-b border-slate-50 pb-5">
            <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
            <p className="text-xs text-slate-400 capitalize font-medium mt-1">
              Account Role: {user.role}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-slate-450 uppercase tracking-wider">Email Address</p>
              <div className="flex items-center gap-2 mt-1.5 text-slate-700 font-medium">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{user.email}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-semibold text-slate-450 uppercase tracking-wider">Account Privilege</p>
              <div className="flex items-center gap-2 mt-1.5 text-slate-700 font-medium">
                <ShieldAlert className="w-4 h-4 text-slate-400" />
                <span className="capitalize">{user.role} Access Status</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-based permissions info */}
      <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-850 border-b border-slate-50 pb-2.5 mb-4 flex items-center gap-2">
          <Award className="w-4.5 h-4.5 text-sky-600" />
          Your Authorized Privileges
        </h3>

        <ul className="space-y-3 text-xs text-slate-600">
          {capabilities.map((cap, idx) => (
            <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
              <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-2 shrink-0"></span>
              <span>{cap}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProfilePage;
