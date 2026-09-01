import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardCheck,
  FileCode,
  Trophy,
  Award,
  Bell,
  User,
  LogOut,
  FolderLock,
  Gavel,
  CheckSquare,
  Sparkles,
  ShieldAlert,
  BarChart3,
  Brain,
  ShieldCheck,
  Activity,
  SearchCode,
  Settings
} from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const role = user.role;

  const getNavItems = () => {
    if (role === "admin") {
      return {
        main: [
          { to: "/admin/dashboard", label: "Admin Dashboard", icon: LayoutDashboard },
          { to: "/admin/users", label: "User Directory", icon: Users },
          { to: "/manage/hackathons", label: "Hackathons", icon: Calendar },
          { to: "/admin/activity", label: "System Activity", icon: Activity },
          { to: "/manage/evaluation-intelligence", label: "Evaluation Intelligence", icon: Brain },
          { to: "/manage/ai-evaluation", label: "Evaluation Monitoring", icon: Sparkles },
          { to: "/manage/similarity", label: "Similarity Review", icon: ShieldAlert },
          { to: "/manage/research-metrics", label: "Research & Analytics", icon: BarChart3 },
          { to: "/admin/settings", label: "Platform Settings", icon: Settings },
          { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
        ],
        account: [
          { to: "/notifications", label: "Notifications", icon: Bell },
          { to: "/profile", label: "Profile", icon: User },
        ]
      };
    }

    if (role === "organizer") {
      return {
        main: [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/hackathons", label: "Hackathons", icon: Calendar },
          { to: "/manage/hackathons", label: "Manage Hackathons", icon: FolderLock },
          { to: "/manage/evaluation-intelligence", label: "Evaluation Intelligence", icon: Brain },
          { to: "/manage/ai-evaluation", label: "AI Evaluation", icon: Sparkles },
          { to: "/manage/similarity", label: "Similarity Review", icon: ShieldAlert },
          { to: "/teams", label: "Teams", icon: Users },
          { to: "/manage/registrations", label: "Registrations", icon: ClipboardCheck },
          { to: "/submissions", label: "Submissions", icon: FileCode },
          { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
          { to: "/manage/results", label: "Results Management", icon: Award },
          { to: "/manage/research-metrics", label: "Research & Analytics", icon: BarChart3 },
        ],
        account: [
          { to: "/notifications", label: "Notifications", icon: Bell },
          { to: "/profile", label: "Profile", icon: User },
        ]
      };
    }

    if (role === "judge") {
      return {
        main: [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/hackathons", label: "Hackathons", icon: Calendar },
          { to: "/judge/submissions", label: "Submissions to Judge", icon: Gavel },
          { to: "/judge/scores", label: "My Scores", icon: CheckSquare },
          { to: "/manage/evaluation-intelligence", label: "Evaluation Intelligence", icon: Brain },
          { to: "/manage/similarity", label: "Similarity Review", icon: ShieldAlert },
          { to: "/manage/research-metrics", label: "Research & Analytics", icon: BarChart3 },
          { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
          { to: "/results", label: "Results & Winners", icon: Award },
        ],
        account: [
          { to: "/notifications", label: "Notifications", icon: Bell },
          { to: "/profile", label: "Profile", icon: User },
        ]
      };
    }

    // Default: Participant
    return {
      main: [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/hackathons", label: "Hackathons", icon: Calendar },
        { to: "/teams", label: "All Teams", icon: Users },
        { to: "/my-teams", label: "My Teams", icon: Users },
        { to: "/registrations", label: "My Registrations", icon: ClipboardCheck },
        { to: "/submissions", label: "My Submissions", icon: FileCode },
        { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { to: "/results", label: "Results & Winners", icon: Award },
      ],
      account: [
        { to: "/notifications", label: "Notifications", icon: Bell },
        { to: "/profile", label: "Profile", icon: User },
      ]
    };
  };

  const navItems = getNavItems();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 min-h-screen shrink-0">
      {/* Brand Header */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-600 text-white font-extrabold text-sm shadow-md shadow-brand-600/30">
          IX
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-white tracking-tight text-sm font-display truncate">InnovateX</span>
          <span className="text-3xs text-brand-400 font-mono capitalize -mt-0.5">{role} Workspace</span>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 px-3.5 py-5 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-4xs font-semibold tracking-wider text-slate-400 uppercase font-mono mb-2">
            Navigation
          </p>
          <ul className="space-y-1">
            {navItems.main.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                      isActive
                        ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="px-3 text-4xs font-semibold tracking-wider text-slate-400 uppercase font-mono mb-2">
            Account & System
          </p>
          <ul className="space-y-1">
            {navItems.account.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                      isActive
                        ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition duration-150 text-left focus:outline-none"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
