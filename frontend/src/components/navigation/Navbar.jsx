import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Menu, User, ChevronDown } from "lucide-react";
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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await getMyNotifications();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n) => !n.isRead).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside handlers
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

  if (!user) return null;

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-100 shadow-sm relative z-30">
      {/* Left: Mobile menu toggle + Header title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-1 text-slate-500 hover:text-slate-700 md:hidden hover:bg-slate-50 rounded-lg focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-semibold text-slate-800 hidden md:block">
          Welcome back, {user.name}
        </span>
        <span className="font-semibold text-slate-800 md:hidden">
          InnovateX
        </span>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center gap-4">
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
        <div className="h-6 w-px bg-slate-200"></div>

        {/* User profile dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition duration-150 focus:outline-none"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">
                {user.name}
              </p>
              <p className="text-4xs text-slate-400 font-medium capitalize mt-1">
                {user.role}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                <p className="text-4xs text-slate-400 truncate mt-0.5">{user.email}</p>
              </div>
              <a
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Profile Settings
              </a>
              <button
                onClick={logout}
                className="flex items-center gap-2 w-full px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition text-left"
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
