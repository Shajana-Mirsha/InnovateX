import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Menu, ChevronDown, ChevronRight, ShieldCheck, User, Bell, Home } from "lucide-react";
import NotificationBell from "./NotificationBell";
import NotificationDropdown from "./NotificationDropdown";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../api/notificationApi";

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await getMyNotifications();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount((data.notifications || []).filter((n) => !n.isRead).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      const data = await markAsRead(id);
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const data = await markAllAsRead();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all read:", error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const data = await deleteNotification(id);
      if (data.success) {
        const wasUnread = !notifications.find((n) => n._id === id)?.isRead;
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  // Generate breadcrumbs from pathname
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const getBreadcrumbLabel = (segment) => {
    const map = {
      admin: "Admin",
      dashboard: "Dashboard",
      users: "Users",
      hackathons: "Challenges",
      manage: "Management",
      teams: "Teams",
      registrations: "Registrations",
      submissions: "Submissions",
      judge: "Judge",
      scores: "Scores",
      leaderboard: "Leaderboard",
      results: "Results",
      similarity: "Similarity",
      "ai-evaluation": "AI Evaluation",
      "evaluation-intelligence": "Evaluation Intelligence",
      "research-metrics": "Research Metrics",
      activity: "Audit Logs",
      settings: "Settings",
      profile: "Profile",
      notifications: "Notifications",
      create: "New"
    };
    return map[segment] || (segment.length === 24 ? "Details" : segment.charAt(0).toUpperCase() + segment.slice(1));
  };

  if (!user) return null;

  const roleColors = {
    admin: "bg-purple-50 text-purple-700 border-purple-200",
    organizer: "bg-blue-50 text-blue-700 border-blue-200",
    judge: "bg-amber-50 text-amber-700 border-amber-200",
    participant: "bg-emerald-50 text-emerald-700 border-emerald-200"
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 shadow-sm relative z-30">
      {/* Left: Mobile menu toggle + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-1.5 text-slate-500 hover:text-slate-800 md:hidden hover:bg-slate-100 rounded-xl focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Trail */}
        <nav className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium truncate">
          <Link to="/dashboard" className="hover:text-slate-800 transition flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          {pathSegments.map((seg, idx) => {
            const isLast = idx === pathSegments.length - 1;
            const routeTo = "/" + pathSegments.slice(0, idx + 1).join("/");
            return (
              <React.Fragment key={routeTo}>
                <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                {isLast ? (
                  <span className="text-slate-800 font-semibold truncate">
                    {getBreadcrumbLabel(seg)}
                  </span>
                ) : (
                  <Link to={routeTo} className="hover:text-slate-800 transition truncate">
                    {getBreadcrumbLabel(seg)}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Mobile Header Title */}
        <span className="font-bold text-slate-900 sm:hidden font-display text-sm truncate">
          InnovateX
        </span>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center gap-3.5 shrink-0">
        {/* Role Pill */}
        <span className={`hidden md:inline-flex items-center text-xs font-mono font-bold uppercase px-3 py-1 rounded-full border ${roleColors[user.role] || roleColors.participant}`}>
          {user.role}
        </span>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <NotificationBell
            unreadCount={unreadCount}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          />
          {dropdownOpen && (
            <NotificationDropdown
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
              onDelete={handleDeleteNotification}
              onClose={() => setDropdownOpen(false)}
            />
          )}
        </div>

        {/* Vertical divider */}
        <div className="h-5 w-px bg-slate-200"></div>

        {/* User profile dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition duration-150 focus:outline-none border border-transparent hover:border-slate-200"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs font-mono shadow-sm">
              {user.name ? user.name.substring(0, 2).toUpperCase() : "U"}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">
                {user.name}
              </p>
              <p className="text-xs text-slate-500 font-mono capitalize mt-1">
                {user.role}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5 font-mono">{user.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                Profile & Privileges
              </Link>
              {user.role === "admin" && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Dashboard
                </Link>
              )}
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  logout();
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition text-left"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
