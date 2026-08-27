import React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ClipboardCheck,
  Award,
  FileCode,
  Bell,
  Check,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "../../utils/helpers";

const NotificationDropdown = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onClose,
}) => {
  const getIcon = (type) => {
    switch (type) {
      case "registration":
        return <ClipboardCheck className="w-4 h-4 text-amber-500" />;
      case "team":
        return <Users className="w-4 h-4 text-sky-500" />;
      case "submission":
        return <FileCode className="w-4 h-4 text-indigo-500" />;
      case "result":
        return <Award className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case "registration":
        return "bg-amber-50";
      case "team":
        return "bg-sky-50";
      case "submission":
        return "bg-indigo-50";
      case "result":
        return "bg-emerald-50";
      default:
        return "bg-slate-50";
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
        <h4 className="text-sm font-semibold text-slate-800">Notifications</h4>
        {notifications.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs font-medium text-sky-600 hover:text-sky-700 focus:outline-none flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">
            No notifications yet
          </div>
        ) : (
          notifications.slice(0, 5).map((item) => (
            <div
              key={item._id}
              className={`p-4 flex gap-3 hover:bg-slate-50 transition duration-150 relative group ${
                !item.isRead ? "bg-sky-50/20" : ""
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${getBgColor(
                  item.type
                )}`}
              >
                {getIcon(item.type)}
              </div>
              <div className="flex-grow pr-6">
                <p className="text-xs font-semibold text-slate-800">
                  {item.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  {item.message}
                </p>
                <p className="text-4xs text-slate-400 mt-1 font-medium">
                  {formatDistanceToNow(item.createdAt)}
                </p>
              </div>
              
              <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {!item.isRead && (
                  <button
                    onClick={() => onMarkRead(item._id)}
                    className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded transition"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onDelete(item._id)}
                  className="p-0.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
        <Link
          to="/notifications"
          onClick={onClose}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
};

export default NotificationDropdown;
