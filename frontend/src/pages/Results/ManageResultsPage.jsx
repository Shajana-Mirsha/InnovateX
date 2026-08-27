import React, { useState, useEffect } from "react";
import { getAllHackathons } from "../../api/hackathonApi";
import { getAllSubmissions } from "../../api/submissionApi";
import { declareResult, getHackathonResults, deleteResult } from "../../api/resultApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { Award, Trophy, Trash2, Plus, ArrowLeft, AlertCircle } from "lucide-react";

const ManageResultsPage = () => {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [declaredResults, setDeclaredResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");

  // Declaring form state
  const [submissionId, setSubmissionId] = useState("");
  const [position, setPosition] = useState(1);
  const [declaring, setDeclaring] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Deletion state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetResult, setTargetResult] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchHackathons = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAllHackathons();
        if (data.success) {
          setHackathons(data.hackathons || []);
          if (data.hackathons?.length > 0) {
            setSelectedHackathonId(data.hackathons[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load hackathons list.");
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, []);

  const fetchHackathonSubmissionsAndResults = async () => {
    if (!selectedHackathonId) return;
    setDataLoading(true);
    setFormError("");
    setFormSuccess("");
    try {
      const [subRes, resRes] = await Promise.all([
        getAllSubmissions(),
        getHackathonResults(selectedHackathonId),
      ]);

      if (subRes.success) {
        // Filter submissions for current hackathon
        const hackSubs = (subRes.submissions || []).filter(
          (s) => s.hackathon?._id === selectedHackathonId
        );
        setSubmissions(hackSubs);
        if (hackSubs.length > 0) {
          setSubmissionId(hackSubs[0]._id);
        } else {
          setSubmissionId("");
        }
      }

      if (resRes.success) {
        setDeclaredResults(resRes.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathonSubmissionsAndResults();
  }, [selectedHackathonId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!selectedHackathonId || !submissionId || !position) {
      setFormError("All fields are required.");
      return;
    }

    // Client-side validations
    const isPositionTaken = declaredResults.some(
      (r) => r.position === Number(position)
    );
    if (isPositionTaken) {
      setFormError(`Position ${position} has already been assigned.`);
      return;
    }

    const isSubmissionAssigned = declaredResults.some(
      (r) => r.submission?._id === submissionId
    );
    if (isSubmissionAssigned) {
      setFormError("This submission has already been declared a winner.");
      return;
    }

    setDeclaring(true);
    try {
      const res = await declareResult(
        selectedHackathonId,
        submissionId,
        Number(position)
      );

      if (res.success) {
        setFormSuccess(`Position ${position} declared successfully!`);
        // Reset position choice
        setPosition((prev) => prev + 1);
        // Refresh listings
        await fetchHackathonSubmissionsAndResults();
      }
    } catch (err) {
      console.error(err);
      setFormError(
        err.response?.data?.message || "Failed to declare result. Double check requirements."
      );
    } finally {
      setDeclaring(false);
    }
  };

  const triggerDelete = (res) => {
    setTargetResult(res);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetResult) return;
    setDeleting(true);
    try {
      const res = await deleteResult(targetResult._id);
      if (res.success) {
        setDeclaredResults((prev) => prev.filter((r) => r._id !== targetResult._id));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete winner assignment.");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setTargetResult(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Declare Results & Winners"
        description="Select a completed hackathon, review graded codes, and declare podium rankings."
      />

      {/* Select Hackathon */}
      <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <span className="text-xs font-bold text-slate-700 shrink-0">Select Hackathon Event:</span>
        <div className="w-full sm:w-80">
          {hackathons.length === 0 ? (
            <p className="text-xs text-rose-500 font-semibold">No hackathons listed</p>
          ) : (
            <select
              className="w-full text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
            >
              {hackathons.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form area */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm h-fit space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2.5 flex items-center gap-2">
            <Trophy className="w-4.5 h-4.5 text-sky-600" />
            Declare Winner
          </h3>

          {dataLoading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner size="sm" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex gap-2 p-3.5 bg-amber-50 border border-amber-100 text-amber-800 rounded-lg text-xs leading-normal">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>No submissions have been published for this event yet. Cannot declare results.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <p className="p-2.5 bg-rose-50 border border-rose-100 text-xs text-rose-800 font-medium rounded-lg">
                  {formError}
                </p>
              )}
              {formSuccess && (
                <p className="p-2.5 bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 font-medium rounded-lg">
                  {formSuccess}
                </p>
              )}

              <div>
                <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                  Podium Position (1 = 1st Place) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  className="block w-full text-xs font-medium text-slate-855 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={position}
                  onChange={(e) => setPosition(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                  Winning Project Submission *
                </label>
                <select
                  required
                  className="block w-full text-xs font-medium text-slate-855 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={submissionId}
                  onChange={(e) => setSubmissionId(e.target.value)}
                >
                  {submissions.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.title} (Team: {sub.team?.name})
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={declaring}
              >
                Declare Winner
              </Button>
            </form>
          )}
        </div>

        {/* Existing winners list */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2.5 flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-slate-400" />
            Declared Rankings ({declaredResults.length})
          </h3>

          {dataLoading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner size="md" />
            </div>
          ) : declaredResults.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No winners assigned for this hackathon yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {declaredResults.map((res) => (
                <div key={res._id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {res.position === 1 ? "🥇" : res.position === 2 ? "🥈" : res.position === 3 ? "🥉" : "🏆"}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {res.submission?.title}
                      </p>
                      <p className="text-3xs text-slate-400 font-semibold mt-0.5">
                        Team: {res.submission?.team?.name} • Position: {res.position}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => triggerDelete(res)}
                    className="p-1.5 border border-slate-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                    title="Delete results placement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Winners Assignment?"
        message={`Are you sure you want to delete position ${targetResult?.position} for "${targetResult?.submission?.title}"?`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ManageResultsPage;
