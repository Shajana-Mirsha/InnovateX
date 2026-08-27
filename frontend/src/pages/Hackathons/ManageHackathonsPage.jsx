import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  createHackathon,
  updateHackathon,
  deleteHackathon,
  getAllHackathons,
} from "../../api/hackathonApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { formatDate } from "../../utils/helpers";
import { Plus, Edit2, Trash2, Calendar, MapPin, Globe } from "lucide-react";

const ManageHackathonsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // URL Query triggers
  const queryParams = new URLSearchParams(location.search);
  const showCreateForm = queryParams.get("create") === "true";
  const editId = queryParams.get("edit");

  // State
  const [myHackathons, setMyHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
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

  // Deletion modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetHackathon, setTargetHackathon] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMyEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllHackathons();
      if (data.success) {
        // Organizer sees only their events. Admin sees all events.
        const events = (data.hackathons || []).filter(
          (h) => user.role === "admin" || h.createdBy?._id === user.id
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

  // If in edit mode, load hackathon details into form
  useEffect(() => {
    if (editId && myHackathons.length > 0) {
      const target = myHackathons.find((h) => h._id === editId);
      if (target) {
        setTitle(target.title || "");
        setDescription(target.description || "");
        setDomain(target.domain || "");
        setMode(target.mode || "online");
        
        // Format ISO date strings for input fields (YYYY-MM-DD)
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
      // Clear forms for create mode
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
        setFormSuccess(
          editId
            ? "Hackathon updated successfully!"
            : "Hackathon hosted successfully!"
        );
        // Refresh
        await fetchMyEvents();
        // Redirect after short timeout
        setTimeout(() => {
          navigate("/manage/hackathons");
        }, 1500);
      } else {
        setFormError(response.message || "Failed to submit event details");
      }
    } catch (err) {
      console.error(err);
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
        setMyHackathons((prev) => prev.filter((h) => h._id !== targetHackathon._id));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete event.");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setTargetHackathon(null);
    }
  };

  // RENDER FORM (CREATE OR EDIT)
  if (showCreateForm || editId) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-200">
        <div>
          <button
            onClick={() => navigate("/manage/hackathons")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            &larr; Back to Dashboard list
          </button>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">
              {editId ? "Edit Hackathon Settings" : "Host a New Hackathon"}
            </h2>
            <p className="text-4xs text-slate-400 mt-1">
              Provide event details, schedules, sizes, and platforms.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-800 font-medium">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-800 font-medium">
                {formSuccess}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                  Hackathon Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. InnovateX Global Hackathon"
                  className="block w-full text-xs font-medium text-slate-850 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                  Domain / Category *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI / Web3 / Fintech"
                  className="block w-full text-xs font-medium text-slate-850 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                  Event Mode *
                </label>
                <select
                  required
                  className="block w-full text-xs font-medium text-slate-850 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                Description & Criteria Details *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Briefly describe the hackathon goals, problem statements, and scoring rules..."
                className="block w-full text-xs font-medium text-slate-850 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Timelines */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  className="block w-full text-xs font-medium text-slate-850 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  className="block w-full text-xs font-medium text-slate-850 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                  Registration Deadline *
                </label>
                <input
                  type="date"
                  required
                  className="block w-full text-xs font-medium text-slate-850 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                />
              </div>
            </div>

            {/* Team Size Requirements & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                  Min Team Size
                </label>
                <input
                  type="number"
                  min={1}
                  className="block w-full text-xs font-medium text-slate-850 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={minTeamSize}
                  onChange={(e) => setMinTeamSize(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                  Max Team Size *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  className="block w-full text-xs font-medium text-slate-850 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(e.target.value)}
                />
              </div>

              {editId && (
                <div>
                  <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                    Event Status
                  </label>
                  <select
                    className="block w-full text-xs font-medium text-slate-850 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
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

            {/* Offline location if not Online */}
            {mode !== "online" && (
              <div>
                <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                  Location Venue Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Innovation Hall, Block C, Bangalore"
                  className="block w-full text-xs font-medium text-slate-850 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-50">
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

  // RENDER HACKATHON DASHBOARD LIST
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Manage Hosted Hackathons"
        description="View, configure, edit status, or archive your hosted hackathons."
        action={
          <Link to="/manage/hackathons?create=true">
            <Button variant="primary" icon={Plus}>
              Host New Event
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
        </div>
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
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-3xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-150">
                  <th className="px-6 py-4">Title & Domain</th>
                  <th className="px-6 py-4">Timeline</th>
                  <th className="px-6 py-4">Mode</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myHackathons.map((hack) => (
                  <tr key={hack._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{hack.title}</p>
                      <p className="text-3xs text-slate-400 mt-1 capitalize">Domain: {hack.domain}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-650">
                      {formatDate(hack.startDate)} – {formatDate(hack.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {hack.mode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={hack.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link to={`/hackathons/${hack._id}`} title="View event details">
                          <button className="p-1.5 border border-slate-200 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 rounded transition">
                            View
                          </button>
                        </Link>
                        <Link to={`/manage/hackathons?edit=${hack._id}`} title="Edit settings">
                          <button className="p-1.5 border border-slate-200 text-sky-600 hover:text-sky-700 bg-white hover:bg-slate-50 rounded transition">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                        <button
                          onClick={() => triggerDelete(hack)}
                          className="p-1.5 border border-slate-200 text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 rounded transition"
                          title="Delete hackathon"
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Hackathon?"
        message={`Are you sure you want to delete "${targetHackathon?.title}"? All information about this hackathon will be deleted.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ManageHackathonsPage;
