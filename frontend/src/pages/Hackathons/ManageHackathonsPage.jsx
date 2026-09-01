import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  createHackathon,
  updateHackathon,
  deleteHackathon,
  getHackathons
} from "../../api/hackathonApi";
import HackathonCriteriaModal from "./HackathonCriteriaModal";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { TableSkeleton } from "../../components/common/Skeleton";
import { formatDate } from "../../utils/helpers";
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  Globe,
  Sliders,
  Sparkles,
  ShieldAlert,
  BarChart3,
  Brain,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

const ManageHackathonsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const showCreateForm = queryParams.get("create") === "true";
  const editId = queryParams.get("edit");

  const [myHackathons, setMyHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Criteria Modal State
  const [criteriaHackathon, setCriteriaHackathon] = useState(null);
  const [criteriaModalOpen, setCriteriaModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [mode, setMode] = useState("online");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [eventLocation, setEventLocation] = useState("");
  const [status, setStatus] = useState("upcoming");

  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Deletion state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetHackathon, setTargetHackathon] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMyEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getHackathons();
      if (data.success) {
        const events = (data.hackathons || []).filter(
          (h) => user.role === "admin" || (h.createdBy?._id || h.createdBy) === user.id
        );
        setMyHackathons(events);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load hosted events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, [user]);

  useEffect(() => {
    if (editId && myHackathons.length > 0) {
      const target = myHackathons.find((h) => h._id === editId);
      if (target) {
        setTitle(target.title || "");
        setDescription(target.description || "");
        setDomain(target.domain || "");
        setMode(target.mode || "online");

        const formatInputDate = (dString) => {
          if (!dString) return "";
          return dString.substring(0, 10);
        };

        setStartDate(formatInputDate(target.startDate));
        setEndDate(formatInputDate(target.endDate));
        setRegistrationDeadline(formatInputDate(target.registrationDeadline));
        setMinTeamSize(target.minTeamSize || 1);
        setMaxTeamSize(target.maxTeamSize || 4);
        setEventLocation(target.location || "");
        setStatus(target.status || "upcoming");
      }
    } else {
      setTitle("");
      setDescription("");
      setDomain("");
      setMode("online");
      setStartDate("");
      setEndDate("");
      setRegistrationDeadline("");
      setMinTeamSize(1);
      setMaxTeamSize(4);
      setEventLocation("");
      setStatus("upcoming");
    }
  }, [editId, showCreateForm, myHackathons]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (
      !title ||
      !description ||
      !domain ||
      !startDate ||
      !endDate ||
      !registrationDeadline ||
      !maxTeamSize
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setFormError("End date must be after the start date.");
      return;
    }

    if (new Date(registrationDeadline) > new Date(startDate)) {
      setFormError("Registration deadline must be before or on the start date.");
      return;
    }

    setFormSubmitLoading(true);

    const hackathonData = {
      title,
      description,
      domain,
      mode,
      startDate,
      endDate,
      registrationDeadline,
      minTeamSize: Number(minTeamSize),
      maxTeamSize: Number(maxTeamSize),
      location: eventLocation,
      status,
    };

    try {
      let response;
      if (editId) {
        response = await updateHackathon(editId, hackathonData);
      } else {
        response = await createHackathon(hackathonData);
      }

      if (response.success) {
        toast.success(
          editId
            ? "Hackathon updated successfully!"
            : "Hackathon hosted successfully!"
        );
        await fetchMyEvents();
        setTimeout(() => {
          navigate("/manage/hackathons");
        }, 1200);
      } else {
        setFormError(response.message || "Failed to submit event details");
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Operation failed.");
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const triggerDelete = (hack) => {
    setTargetHackathon(hack);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetHackathon) return;
    setDeleting(true);
    try {
      const res = await deleteHackathon(targetHackathon._id);
      if (res.success) {
        toast.success("Hackathon deleted successfully");
        setMyHackathons((prev) => prev.filter((h) => h._id !== targetHackathon._id));
      }
    } catch (err) {
      toast.error("Failed to delete event.");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setTargetHackathon(null);
    }
  };

  const handleOpenCriteria = (hack) => {
    setCriteriaHackathon(hack);
    setCriteriaModalOpen(true);
  };

  if (showCreateForm || editId) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto pb-12">
        <div>
          <button
            onClick={() => navigate("/manage/hackathons")}
            className="text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            &larr; Back to Hosted Hackathons
          </button>
        </div>

        <div className="glass-panel border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-6 py-5 bg-slate-900/90 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white">
              {editId ? "Edit Hackathon Settings" : "Host a New National Hackathon"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure event scope, timelines, team thresholds, and venues.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium">
                {formSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5">
                  Hackathon Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National AI Innovation Challenge 2026"
                  className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5">
                  Domain / Category *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence"
                  className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5">
                  Event Mode *
                </label>
                <select
                  required
                  className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5">
                Description & Problem Statement *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe competition goals, problem statements, and scoring rules..."
                className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500 resize-none leading-relaxed"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5">
                  Registration Deadline *
                </label>
                <input
                  type="date"
                  required
                  className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5">
                  Min Team Size
                </label>
                <input
                  type="number"
                  min={1}
                  className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500"
                  value={minTeamSize}
                  onChange={(e) => setMinTeamSize(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5">
                  Max Team Size *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500"
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(e.target.value)}
                />
              </div>

              {editId && (
                <div>
                  <label className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5">
                    Event Status
                  </label>
                  <select
                    className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="registration_open">Registration Open</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate("/manage/hackathons")}
                disabled={formSubmitLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={formSubmitLoading}
              >
                {editId ? "Save Changes" : "Create Hackathon"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Manage Hosted Hackathons
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure evaluation rubrics, run AI batch scoring, review similarity, and inspect research calibration.
          </p>
        </div>

        <Link to="/manage/hackathons?create=true">
          <Button variant="primary" size="md" icon={Plus}>
            Host New Event
          </Button>
        </Link>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchMyEvents} />
      ) : myHackathons.length === 0 ? (
        <EmptyState
          title="No Hackathons Hosted"
          message="You have not hosted any hackathons yet. Click 'Host New Event' to get started."
          actionButton={
            <Link to="/manage/hackathons?create=true">
              <Button variant="primary" icon={Plus}>
                Host Your First Event
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-4xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-4">Title & Domain</th>
                  <th className="px-6 py-4">Timeline</th>
                  <th className="px-6 py-4">Rubric Dimensions</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Research & Management Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {myHackathons.map((hack) => (
                  <tr key={hack._id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{hack.title}</p>
                      <p className="text-3xs text-brand-400 mt-0.5 capitalize font-mono">Domain: {hack.domain}</p>
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-slate-300 font-mono">
                      {formatDate(hack.startDate)} – {formatDate(hack.endDate)}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOpenCriteria(hack)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-300 hover:bg-brand-500/20 transition"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        {hack.criteria?.length || 4} Criteria Configured
                      </button>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={hack.status} />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end items-center flex-wrap">
                        {/* Evaluation Intelligence Pipeline */}
                        <Link
                          to={`/manage/evaluation-intelligence/${hack._id}`}
                          title="Evaluation Intelligence & Pipeline State"
                        >
                          <button className="px-2.5 py-1 text-xs font-medium bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-300 rounded-lg transition inline-flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            Intelligence
                          </button>
                        </Link>

                        {/* AI Batch Runner */}
                        <Link
                          to={`/manage/ai-evaluation/${hack._id}`}
                          title="Run Automated AI Evaluation"
                        >
                          <button className="px-2.5 py-1 text-xs font-medium bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 rounded-lg transition inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI Run
                          </button>
                        </Link>

                        {/* Similarity Review */}
                        <Link
                          to={`/manage/similarity/${hack._id}`}
                          title="Semantic Similarity Review"
                        >
                          <button className="px-2.5 py-1 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg transition inline-flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            Similarity
                          </button>
                        </Link>

                        {/* Research Metrics */}
                        <Link
                          to={`/manage/research-metrics/${hack._id}`}
                          title="Calibration & Research Metrics"
                        >
                          <button className="px-2.5 py-1 text-xs font-medium bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-300 rounded-lg transition inline-flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            Metrics
                          </button>
                        </Link>

                        <Link to={`/manage/hackathons?edit=${hack._id}`} title="Edit Settings">
                          <button className="p-1.5 border border-slate-700 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </Link>

                        <button
                          onClick={() => triggerDelete(hack)}
                          className="p-1.5 border border-rose-500/30 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition"
                          title="Delete Hackathon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Criteria Configuration Modal */}
      {criteriaModalOpen && (
        <HackathonCriteriaModal
          isOpen={criteriaModalOpen}
          onClose={() => setCriteriaModalOpen(false)}
          hackathon={criteriaHackathon}
          onUpdated={() => fetchMyEvents()}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Hackathon?"
        message={`Are you sure you want to delete "${targetHackathon?.title}"? All associated teams, submissions, and scores will be deleted.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ManageHackathonsPage;
