import React from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  UserCheck,
  X
} from "lucide-react";

const MobileNavigation = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  if (!user || !isOpen) return null;

  const role = user.role;
  const currentPath = location.pathname + location.search;

  const isLinkActive = (to) => {
    if (to.includes("?")) {
      return currentPath === to;
    }
    return location.pathname === to && (!location.search || location.pathname !== "/admin/users");
  };

  const getNavItems = () => {
    if (role === "admin") {
      return {
        main: [
          { to: "/admin/dashboard", label: "Admin Dashboard", icon: LayoutDashboard },
          { to: "/admin/users", label: "All Users Directory", icon: Users },
          { to: "/admin/users?role=organizer", label: "Organizers", icon: UserCheck },
          { to: "/admin/users?role=judge", label: "Judges", icon: Gavel },
          { to: "/admin/users?role=participant", label: "Participants", icon: User },
          { to: "/manage/hackathons", label: "Challenges", icon: Calendar },
          { to: "/submissions", label: "Submissions", icon: FileCode },
          { to: "/manage/ai-evaluation", label: "AI Monitoring", icon: Sparkles },
          { to: "/manage/similarity", label: "Similarity Alerts", icon: ShieldAlert },
          { to: "/manage/evaluation-intelligence", label: "Evaluation Intelligence", icon: Brain },
          { to: "/manage/research-metrics", label: "Analytics & Metrics", icon: BarChart3 },
          { to: "/leaderboard", label: "Rankings & Leaderboard", icon: Trophy },
          { to: "/admin/activity", label: "Audit Logs", icon: Activity },
          { to: "/admin/settings", label: "Platform Settings", icon: Settings },
        ],
        account: [
          { to: "/notifications", label: "Notifications", icon: Bell },
          { to: "/profile", label: "Profile & Account", icon: User },
        ]
      };
    }

    if (role === "organizer") {
      return {
        main: [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/manage/hackathons", label: "Challenges", icon: Calendar },
          { to: "/manage/registrations", label: "Participants & Regs", icon: ClipboardCheck },
          { to: "/teams", label: "Teams", icon: Users },
          { to: "/submissions", label: "Submissions", icon: FileCode },
          { to: "/manage/ai-evaluation", label: "AI Evaluation", icon: Sparkles },
          { to: "/manage/similarity", label: "Similarity Alerts", icon: ShieldAlert },
          { to: "/manage/evaluation-intelligence", label: "Evaluation Intelligence", icon: Brain },
          { to: "/leaderboard", label: "Rankings", icon: Trophy },
          { to: "/manage/results", label: "Results & Reports", icon: Award },
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
          { to: "/judge/submissions", label: "Assigned Projects", icon: Gavel },
          { to: "/manage/evaluation-intelligence", label: "AI Evaluation Review", icon: Brain },
          { to: "/manage/similarity", label: "Similarity Alerts", icon: ShieldAlert },
          { to: "/judge/scores", label: "My Evaluations", icon: CheckSquare },
          { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
          { to: "/results", label: "Evaluation History", icon: Award },
          { to: "/manage/research-metrics", label: "Research & Analytics", icon: BarChart3 },
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
        { to: "/hackathons", label: "Challenges", icon: Calendar },
        { to: "/registrations", label: "My Registrations", icon: ClipboardCheck },
        { to: "/my-teams", label: "My Teams", icon: Users },
        { to: "/teams", label: "Browse Teams", icon: Users },
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
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="relative flex flex-col w-full max-w-xs bg-white text-slate-700 shadow-2xl h-full animate-in slide-in-from-left duration-200 border-r border-slate-200">
        {/* Brand & Close button */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-sm shadow-sm">
              IX
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 tracking-wide text-sm font-display">InnovateX</span>
              <span className="text-3xs text-blue-600 font-mono capitalize -mt-0.5">{role} Workspace</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 focus:outline-none"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
          <div>
            <p className="px-3 text-3xs font-semibold tracking-wider text-slate-400 uppercase font-mono mb-2">
              Navigation
            </p>
            <ul className="space-y-1">
              {navItems.main.map((item) => {
                const active = isLinkActive(item.to);
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                        active
                          ? "bg-blue-50 text-blue-700 font-bold border border-blue-100"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="px-3 text-3xs font-semibold tracking-wider text-slate-400 uppercase font-mono mb-2">
              Account & System
            </p>
            <ul className="space-y-1">
              {navItems.account.map((item) => {
                const active = isLinkActive(item.to);
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                        active
                          ? "bg-blue-50 text-blue-700 font-bold border border-blue-100"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition duration-150 text-left focus:outline-none"
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
