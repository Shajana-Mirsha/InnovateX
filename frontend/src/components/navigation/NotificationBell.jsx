import React from "react";
import { Bell } from "lucide-react";

const NotificationBell = ({ unreadCount, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative p-1.5 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500"
      aria-label="View notifications"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-2xs font-bold leading-none text-white transform translate-x-1/3 -translate-y-1/3 bg-rose-500 rounded-full min-w-4 h-4 border border-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
