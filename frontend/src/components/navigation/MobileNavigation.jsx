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
  X,
} from "lucide-react";

const MobileNavigation = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  if (!user || !isOpen) return null;

  const role = user.role;

  const getNavItems = () => {
    const commonItems = [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/hackathons", label: "Hackathons", icon: Calendar },
      { to: "/teams", label: "All Teams", icon: Users },
    ];

    const participantItems = [
      { to: "/my-teams", label: "My Teams", icon: Users },
      { to: "/registrations", label: "My Registrations", icon: ClipboardCheck },
      { to: "/submissions", label: "My Submissions", icon: FileCode },
      { to: "/results", label: "Results & Winners", icon: Award },
    ];

    const organizerItems = [
      { to: "/manage/hackathons", label: "Manage Hackathons", icon: FolderLock },
      { to: "/manage/registrations", label: "Manage Registrations", icon: ClipboardCheck },
      { to: "/submissions", label: "Submissions", icon: FileCode },
      { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { to: "/manage/results", label: "Manage Results", icon: CheckSquare },
    ];

    const judgeItems = [
      { to: "/judge/submissions", label: "Submissions to Judge", icon: Gavel },
      { to: "/judge/scores", label: "My Scores", icon: Trophy },
      { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { to: "/results", label: "Results & Winners", icon: Award },
    ];

    const adminItems = [
      { to: "/manage/hackathons", label: "Manage Hackathons", icon: FolderLock },
      { to: "/manage/registrations", label: "Manage Registrations", icon: ClipboardCheck },
      { to: "/submissions", label: "Submissions", icon: FileCode },
      { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { to: "/manage/results", label: "Manage Results", icon: CheckSquare },
    ];

    let roleItems = [];
    if (role === "participant") roleItems = participantItems;
    else if (role === "organizer") roleItems = organizerItems;
    else if (role === "judge") roleItems = judgeItems;
    else if (role === "admin") roleItems = adminItems;

    const accountItems = [
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/profile", label: "Profile", icon: User },
    ];

    return {
      main: [...commonItems, ...roleItems],
      account: accountItems,
    };
  };

  const navItems = getNavItems();

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/55 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="relative flex flex-col w-full max-w-xs bg-slate-900 text-slate-300 shadow-2xl h-full animate-in slide-in-from-left duration-200">
        {/* Brand & Close button */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500 text-white font-extrabold text-lg">
              IX
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white tracking-wide text-sm">InnovateX</span>
              <span className="text-4xs text-slate-400 capitalize -mt-0.5">{role} Panel</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 focus:outline-none"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 px-4 py-6 space-y-7 overflow-y-auto">
          <div>
            <p className="px-3 text-4xs font-semibold tracking-wider text-slate-500 uppercase">
              Navigation
            </p>
            <ul className="mt-3 space-y-1">
              {navItems.main.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                        isActive
                          ? "bg-sky-600 text-white shadow-sm"
                          : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="px-3 text-4xs font-semibold tracking-wider text-slate-500 uppercase">
              Account & System
            </p>
            <ul className="mt-3 space-y-1">
              {navItems.account.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                        isActive
                          ? "bg-sky-600 text-white shadow-sm"
                          : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
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
            className="flex items-center gap-3 w-full px-3 py-2.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition duration-150 text-left focus:outline-none"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileNavigation;
