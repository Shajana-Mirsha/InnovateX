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
      console.error(err);
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
      }
    } catch (error) {
      console.error("Failed to mark all read:", error);
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
        return <ClipboardCheck className="w-5 h-5 text-amber-500" />;
      case "team":
        return <Users className="w-5 h-5 text-sky-500" />;
      case "submission":
        return <FileCode className="w-5 h-5 text-indigo-500" />;
      case "result":
        return <Award className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Notifications Console"
        description="Receive updates on status registrations, team sign ups, grading evaluations, and winners announcement."
        action={
          unreadCount > 0 && (
            <Button
              variant="outline"
              icon={Check}
              loading={actionLoading}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchNotifications} />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="Inbox Empty"
          message="You have no notifications in your console right now."
        />
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100 max-w-4xl mx-auto">
          {notifications.map((item) => (
            <div
              key={item._id}
              className={`p-5 flex gap-4 hover:bg-slate-50/50 transition duration-150 relative group ${
                !item.isRead ? "bg-sky-50/10" : ""
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 border border-slate-100/50 ${getBgColor(
                  item.type
                )}`}
              >
                {getIcon(item.type)}
              </div>
              <div className="flex-grow pr-12 space-y-1">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-slate-800">
                    {item.title}
                  </p>
                  {!item.isRead && (
                    <span className="text-4xs font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded uppercase">
                      New
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.message}
                </p>
                <p className="text-4xs text-slate-400 font-semibold">
                  {formatDistanceToNow(item.createdAt)}
                </p>
              </div>

              {/* Action buttons */}
              <div className="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {!item.isRead && (
                  <button
                    onClick={() => handleMarkRead(item._id)}
                    className="p-1 border border-slate-200 text-slate-500 hover:text-slate-700 bg-white rounded hover:bg-slate-50 transition"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-1 border border-slate-200 text-rose-500 hover:text-rose-700 bg-white rounded hover:bg-rose-50 transition"
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
