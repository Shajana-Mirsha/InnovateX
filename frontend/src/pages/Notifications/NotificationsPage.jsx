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
        return <ClipboardCheck className="w-5 h-5 text-amber-600" />;
      case "team":
        return <Users className="w-5 h-5 text-blue-600" />;
      case "submission":
        return <FileCode className="w-5 h-5 text-indigo-600" />;
      case "result":
        return <Award className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case "registration":
        return "bg-amber-50 border-amber-200";
      case "team":
        return "bg-blue-50 border-blue-200";
      case "submission":
        return "bg-indigo-50 border-indigo-200";
      case "result":
        return "bg-emerald-50 border-emerald-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Bell className="w-3.5 h-3.5" />
            <span>Activity Feed</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Notifications Console
          </h1>
          <p className="text-sm text-slate-500 mt-1">
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
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
          {notifications.map((item) => (
            <div
              key={item._id}
              className={`p-5 flex gap-4 hover:bg-slate-50 transition duration-150 relative group ${
                !item.isRead ? "bg-blue-50/30" : ""
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 border ${getBgColor(
                  item.type
                )}`}
              >
                {getIcon(item.type)}
              </div>
              <div className="flex-grow pr-12 space-y-1">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-slate-900">
                    {item.title}
                  </p>
                  {!item.isRead && (
                    <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase border border-blue-200">
                      New
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.message}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {formatDistanceToNow(item.createdAt)}
                </p>
              </div>

              {/* Action buttons */}
              <div className="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {!item.isRead && (
                  <button
                    onClick={() => handleMarkRead(item._id)}
                    className="p-1.5 border border-slate-200 text-slate-600 hover:text-slate-900 bg-white rounded-lg hover:bg-slate-100 shadow-sm transition"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-1.5 border border-rose-200 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
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
