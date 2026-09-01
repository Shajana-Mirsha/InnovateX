import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { getAdminUsers, updateUserRole, updateUserStatus, deleteAdminUser } from "../../api/adminApi";
import PageHeader from "../../components/common/PageHeader";
import SearchBar from "../../components/common/SearchBar";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { TableSkeleton } from "../../components/common/Skeleton";
import { formatDate } from "../../utils/helpers";
import {
  Users,
  ShieldAlert,
  UserCheck,
  UserX,
  Trash2,
  Edit3,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock
} from "lucide-react";
import { toast } from "sonner";

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Role edit state
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);

  // Status toggle state
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminUsers({
        role: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchTerm || undefined
      });
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      setError("Failed to load user directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter, statusFilter]);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRole(true);
    try {
      const res = await updateUserRole(userId, newRole);
      if (res.success) {
        toast.success(`User role updated to ${newRole}`);
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
        setEditingUserId(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleStatusToggle = async (targetUser) => {
    const nextStatus = targetUser.isActive === false;
    setUpdatingStatusId(targetUser._id);
    try {
      const res = await updateUserStatus(targetUser._id, nextStatus);
      if (res.success) {
        toast.success(`Account has been ${nextStatus ? "activated" : "suspended"} successfully`);
        setUsers((prev) =>
          prev.map((u) => (u._id === targetUser._id ? { ...u, isActive: nextStatus } : u))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update account status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const triggerDelete = (u) => {
    setUserToDelete(u);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteAdminUser(userToDelete._id);
      if (res.success) {
        toast.success("User account deleted successfully");
        setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Admin Governance · Access Control</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            User Directory & Role Governance
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Inspect registered platform accounts, assign evaluator/organizer privileges, and enforce account security.
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          icon={RefreshCw}
          onClick={fetchUsers}
          loading={loading}
        >
          Refresh Directory
        </Button>
      </div>

      {/* Role Pill Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All Accounts" },
          { key: "organizer", label: "Organizers" },
          { key: "judge", label: "Judges" },
          { key: "participant", label: "Participants" },
          { key: "admin", label: "Administrators" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRoleFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition border ${
              roleFilter === tab.key
                ? "bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-semibold">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="participant">Participant</option>
              <option value="organizer">Organizer</option>
              <option value="judge">Judge</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchUsers} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          message="No user accounts match your search or filter parameters."
        />
      ) : (
        <div className="glass-panel border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-4xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-4">User Name & Identity</th>
                  <th className="px-6 py-4">Role Privileges</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const isCurrent = u._id === currentUser?.id;
                  const isSuspended = u.isActive === false;

                  return (
                    <tr key={u._id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="text-sm font-bold text-white flex items-center gap-1.5">
                            {u.name}
                            {isCurrent && (
                              <span className="text-4xs font-mono font-bold bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full border border-brand-500/30">
                                You
                              </span>
                            )}
                          </span>
                          <span className="text-3xs text-slate-400 font-mono block">{u.email}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {editingUserId === u._id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="px-2.5 py-1 text-xs bg-slate-900 border border-brand-500 rounded-lg text-white font-medium focus:outline-none"
                            >
                              <option value="participant">Participant</option>
                              <option value="organizer">Organizer</option>
                              <option value="judge">Judge</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleRoleChange(u._id, selectedRole)}
                              disabled={updatingRole}
                              className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold capitalize border ${
                                u.role === "admin"
                                  ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                  : u.role === "organizer"
                                  ? "bg-brand-500/15 text-brand-300 border-brand-500/30"
                                  : u.role === "judge"
                                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                  : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              }`}
                            >
                              {u.role}
                            </span>
                            <button
                              onClick={() => {
                                setEditingUserId(u._id);
                                setSelectedRole(u.role);
                              }}
                              className="p-1 text-slate-500 hover:text-white rounded transition"
                              title="Modify Role Privileges"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-mono font-bold border ${
                            isSuspended
                              ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {isSuspended ? (
                            <>
                              <UserX className="w-3 h-3" /> Suspended
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" /> Active
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-slate-400">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={isSuspended ? Unlock : Lock}
                            loading={updatingStatusId === u._id}
                            disabled={isCurrent}
                            onClick={() => handleStatusToggle(u)}
                            className={
                              isSuspended
                                ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                            }
                          >
                            {isSuspended ? "Activate" : "Suspend"}
                          </Button>

                          <button
                            disabled={isCurrent}
                            onClick={() => triggerDelete(u)}
                            className="p-1.5 border border-rose-500/30 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition disabled:opacity-40 disabled:pointer-events-none"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && userToDelete && (
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setUserToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete User Account"
          message={`Are you sure you want to permanently delete user account "${userToDelete.name}" (${userToDelete.email})? This action cannot be undone.`}
          confirmText="Permanently Delete"
          confirmVariant="danger"
          loading={deleting}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
