import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../api/notificationApi";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { formatDistanceToNow } from "../../utils/helpers";
import {
  Users,
  ClipboardCheck,
  Award,
  FileCode,
  Bell,
  Check,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const NotificationsPage = () => {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyNotifications();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleMarkRead = async (id) => {
    try {
      const data = await markAsRead(id);
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error("Failed to mark read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      const data = await markAllAsRead();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      toast.error("Failed to mark all as read");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const data = await deleteNotification(id);
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "registration":
        return <ClipboardCheck className="w-5 h-5 text-amber-400" />;
      case "team":
        return <Users className="w-5 h-5 text-sky-400" />;
      case "submission":
        return <FileCode className="w-5 h-5 text-indigo-400" />;
      case "result":
        return <Award className="w-5 h-5 text-emerald-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case "registration":
        return "bg-amber-500/10 border-amber-500/30";
      case "team":
        return "bg-sky-500/10 border-sky-500/30";
      case "submission":
        return "bg-indigo-500/10 border-indigo-500/30";
      case "result":
        return "bg-emerald-500/10 border-emerald-500/30";
      default:
        return "bg-slate-800 border-slate-700";
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <Bell className="w-3.5 h-3.5" />
            <span>Activity Feed</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Notifications Console
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Receive real-time alerts on registrations, team signups, AI grading runs, and declared results.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="md"
            icon={Check}
            loading={actionLoading}
            onClick={handleMarkAllRead}
          >
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchNotifications} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Inbox Empty"
          message="You have no notifications in your console right now."
        />
      ) : (
        <div className="glass-panel border border-slate-800 rounded-3xl shadow-xl overflow-hidden divide-y divide-slate-800/60 max-w-4xl mx-auto">
          {notifications.map((item) => (
            <div
              key={item._id}
              className={`p-5 flex gap-4 hover:bg-slate-800/30 transition duration-150 relative group ${
                !item.isRead ? "bg-brand-500/5" : ""
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-2xl shrink-0 border ${getBgColor(
                  item.type
                )}`}
              >
                {getIcon(item.type)}
              </div>
              <div className="flex-grow pr-12 space-y-1">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-white">
                    {item.title}
                  </p>
                  {!item.isRead && (
                    <span className="text-4xs font-mono font-bold text-brand-300 bg-brand-500/20 px-2 py-0.5 rounded-full uppercase border border-brand-500/30">
                      New
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.message}
                </p>
                <p className="text-4xs text-slate-500 font-mono">
                  {formatDistanceToNow(item.createdAt)}
                </p>
              </div>

              {/* Action buttons */}
              <div className="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {!item.isRead && (
                  <button
                    onClick={() => handleMarkRead(item._id)}
                    className="p-1.5 border border-slate-700 text-slate-300 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-1.5 border border-rose-500/30 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition"
                  title="Delete notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
