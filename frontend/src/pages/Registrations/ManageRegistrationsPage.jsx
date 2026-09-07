import React, { useState, useEffect } from "react";
import { getAllRegistrations, updateRegistrationStatus } from "../../api/registrationApi";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { TableSkeleton } from "../../components/common/Skeleton";
import { Check, X, Users, ClipboardCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const ManageRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [targetReg, setTargetReg] = useState(null);
  const [targetStatus, setTargetStatus] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllRegistrations();
      if (data.success) {
        setRegistrations(data.registrations || []);
      }
    } catch (err) {
      setError("Failed to fetch registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const triggerStatusChange = (reg, status) => {
    setTargetReg(reg);
    setTargetStatus(status);
    setModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!targetReg || !targetStatus) return;
    setActionLoading(true);
    try {
      const res = await updateRegistrationStatus(targetReg._id, targetStatus);
      if (res.success) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r._id === targetReg._id ? { ...r, status: targetStatus } : r
          )
        );
        toast.success(`Registration marked as ${targetStatus}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update registration status.");
    } finally {
      setActionLoading(false);
      setModalOpen(false);
      setTargetReg(null);
      setTargetStatus("");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Organizer Operations</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Manage Team Registrations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review participant registrations, verify eligibility, and approve or reject submissions.
          </p>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchRegistrations} />
      ) : registrations.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No registrations found"
          message="No teams have submitted registrations for your hackathons yet."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-3.5">Hackathon</th>
                  <th className="px-6 py-3.5">Team Details</th>
                  <th className="px-6 py-3.5">Registered By</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {registrations.map((reg) => (
                  <tr key={reg._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{reg.hackathon?.title || "Challenge"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">{reg.team?.name || "Team"}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {reg.team?.members?.length || 1} Members
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {reg.registeredBy?.name || "Applicant"}
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{reg.registeredBy?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={reg.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {reg.status === "pending" ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => triggerStatusChange(reg, "approved")}
                            className="p-1.5 border border-emerald-200 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition shadow-sm"
                            title="Approve registration"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => triggerStatusChange(reg, "rejected")}
                            className="p-1.5 border border-rose-200 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition shadow-sm"
                            title="Reject registration"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium capitalize">{reg.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmStatusChange}
        loading={actionLoading}
        title={`${targetStatus === "approved" ? "Approve" : "Reject"} Registration?`}
        message={`Are you sure you want to set status to "${targetStatus}" for team "${targetReg?.team?.name}"?`}
        confirmText="Confirm Status"
        cancelText="Cancel"
        variant={targetStatus === "approved" ? "primary" : "danger"}
      />
    </div>
  );
};

export default ManageRegistrationsPage;
