import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAdminUsers, updateUserRole, updateUserStatus, deleteAdminUser } from "../../api/adminApi";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { TableSkeleton } from "../../components/common/Skeleton";
import { formatDate } from "../../utils/helpers";
import {
  Users,
  UserCheck,
  UserX,
  Trash2,
  Edit3,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Unlock
} from "lucide-react";
import { toast } from "sonner";

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "all";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const roleParam = searchParams.get("role") || "all";
    setRoleFilter(roleParam);
  }, [searchParams]);

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
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Admin Governance · Access Control</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            User Directory & Role Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
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
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition border shadow-sm ${
              roleFilter === tab.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-600 font-semibold">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:border-blue-600 focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="participant">Participant</option>
              <option value="organizer">Organizer</option>
              <option value="judge">Judge</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:border-blue-600 focus:outline-none"
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
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4">User Name & Identity</th>
                  <th className="px-6 py-4">Role Privileges</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isCurrent = u._id === currentUser?.id;
                  const isSuspended = u.isActive === false;

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            {u.name}
                            {isCurrent && (
                              <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                                You
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-slate-500 font-mono block">{u.email}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {editingUserId === u._id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="px-2.5 py-1 text-xs bg-white border border-blue-500 rounded-lg text-slate-900 font-medium focus:outline-none"
                            >
                              <option value="participant">Participant</option>
                              <option value="organizer">Organizer</option>
                              <option value="judge">Judge</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleRoleChange(u._id, selectedRole)}
                              disabled={updatingRole}
                              className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="text-xs text-slate-500 hover:text-slate-800"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold capitalize border ${
                                u.role === "admin"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : u.role === "organizer"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : u.role === "judge"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {u.role}
                            </span>
                            <button
                              onClick={() => {
                                setEditingUserId(u._id);
                                setSelectedRole(u.role);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                              title="Modify Role Privileges"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                            isSuspended
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
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

                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
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
                                ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            }
                          >
                            {isSuspended ? "Activate" : "Suspend"}
                          </Button>

                          <button
                            disabled={isCurrent}
                            onClick={() => triggerDelete(u)}
                            className="p-1.5 border border-rose-200 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition disabled:opacity-40 disabled:pointer-events-none"
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
