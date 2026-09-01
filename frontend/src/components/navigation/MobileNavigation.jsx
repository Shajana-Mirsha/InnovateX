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
  Settings,
  X
} from "lucide-react";

const MobileNavigation = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  if (!user || !isOpen) return null;

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
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="relative flex flex-col w-full max-w-xs bg-slate-900 text-slate-300 shadow-2xl h-full animate-in slide-in-from-left duration-200 border-r border-slate-800">
        {/* Brand & Close button */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-600 text-white font-extrabold text-sm">
              IX
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white tracking-wide text-sm font-display">InnovateX</span>
              <span className="text-3xs text-brand-400 font-mono capitalize -mt-0.5">{role} Workspace</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 focus:outline-none"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 px-4 py-5 space-y-6 overflow-y-auto">
          <div>
            <p className="px-3 text-4xs font-semibold tracking-wider text-slate-400 uppercase font-mono mb-2">
              Navigation
            </p>
            <ul className="space-y-1">
              {navItems.main.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                        isActive
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
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
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                        isActive
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition duration-150 text-left focus:outline-none"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileNavigation;
