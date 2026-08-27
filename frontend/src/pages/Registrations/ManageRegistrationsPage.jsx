import React, { useState, useEffect } from "react";
import { getAllRegistrations, updateRegistrationStatus } from "../../api/registrationApi";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { Check, X, Users, AlertTriangle } from "lucide-react";

const ManageRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Approvals/Rejections state
  const [modalOpen, setModalOpen] = useState(false);
  const [targetReg, setTargetReg] = useState(null);
  const [targetStatus, setTargetStatus] = useState(""); // "approved" or "rejected"
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
      console.error(err);
      setError("Failed to fetch all registrations. Check connection.");
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
        // Update local state
        setRegistrations((prev) =>
          prev.map((r) =>
            r._id === targetReg._id ? { ...r, status: targetStatus } : r
          )
        );
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update registration status.");
    } finally {
      setActionLoading(false);
      setModalOpen(false);
      setTargetReg(null);
      setTargetStatus("");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Manage Team Registrations"
        description="Review and approve/reject team registrations for hosted hackathons."
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchRegistrations} />
      ) : registrations.length === 0 ? (
        <EmptyState
          title="No registrations found"
          message="No teams have registered for any hackathons yet."
        />
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-3xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-150">
                  <th className="px-6 py-4">Hackathon</th>
                  <th className="px-6 py-4">Team Details</th>
                  <th className="px-6 py-4">Registered By</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((reg) => (
                  <tr key={reg._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{reg.hackathon?.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-slate-700">{reg.team?.name}</p>
                      <p className="text-4xs text-slate-400 mt-1 uppercase flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {reg.team?.members?.length || 0} Members
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-650">
                      {reg.registeredBy?.name}
                      <p className="text-4xs text-slate-400 mt-0.5">{reg.registeredBy?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={reg.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {reg.status === "pending" ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => triggerStatusChange(reg, "approved")}
                            className="p-1.5 border border-slate-200 text-emerald-600 hover:text-emerald-700 bg-white hover:bg-emerald-50 rounded transition"
                            title="Approve registration"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerStatusChange(reg, "rejected")}
                            className="p-1.5 border border-slate-200 text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 rounded transition"
                            title="Reject registration"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-3xs text-slate-400 font-semibold uppercase">Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmStatusChange}
        loading={actionLoading}
        title={`${targetStatus === "approved" ? "Approve" : "Reject"} Registration?`}
        message={`Are you sure you want to set status to "${targetStatus}" for team "${targetReg?.team?.name}"?`}
        confirmText="Confirm Status"
        cancelText="Cancel"
        variant={targetStatus === "approved" ? "success" : "danger"}
      />
    </div>
  );
};

export default ManageRegistrationsPage;
