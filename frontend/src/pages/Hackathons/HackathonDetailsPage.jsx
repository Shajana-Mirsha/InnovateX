import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getHackathonById, deleteHackathon } from "../../api/hackathonApi";
import { getAllTeams } from "../../api/teamApi";
import { registerTeam, getMyRegistrations } from "../../api/registrationApi";
import { getHackathonResults } from "../../api/resultApi";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { formatDate } from "../../utils/helpers";
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  Layers,
  ArrowLeft,
  Trophy,
  PlusCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const HackathonDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Registration data
  const [myTeams, setMyTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [myRegs, setMyRegs] = useState([]);
  const [registering, setRegistering] = useState(false);
  const [regSuccess, setRegSuccess] = useState("");
  const [regError, setRegError] = useState("");

  // Results data
  const [results, setResults] = useState([]);

  // Modal deletion state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchHackathonData = async () => {
    setLoading(true);
    setError("");
    try {
      const hackRes = await getHackathonById(id);
      if (hackRes.success) {
        setHackathon(hackRes.hackathon);
      }

      // Fetch results
      try {
        const resultsRes = await getHackathonResults(id);
        if (resultsRes.success) {
          setResults(resultsRes.results || []);
        }
      } catch (err) {
        console.warn("Could not fetch results (might not be declared yet):", err);
      }

      // Fetch user specific data if logged in
      if (user) {
        // Fetch teams led by user that belong to this hackathon
        const teamsRes = await getAllTeams();
        if (teamsRes.success) {
          const eligibleTeams = (teamsRes.teams || []).filter(
            (t) =>
              t.leader?._id === user.id &&
              t.hackathon?._id === id
          );
          setMyTeams(eligibleTeams);
          if (eligibleTeams.length > 0) {
            setSelectedTeamId(eligibleTeams[0]._id);
          }
        }

        // Fetch my registrations
        const myRegsRes = await getMyRegistrations();
        if (myRegsRes.success) {
          const hackRegs = (myRegsRes.registrations || []).filter(
            (r) => r.hackathon?._id === id
          );
          setMyRegs(hackRegs);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch hackathon details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathonData();
  }, [id, user]);

  const handleRegisterTeam = async (e) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setRegError("Please select a team to register");
      return;
    }

    setRegistering(true);
    setRegError("");
    setRegSuccess("");
    try {
      const res = await registerTeam(id, selectedTeamId);
      if (res.success) {
        setRegSuccess("Team registered successfully! Awaiting organizer approval.");
        
        // Refresh registrations list
        const myRegsRes = await getMyRegistrations();
        if (myRegsRes.success) {
          setMyRegs((myRegsRes.registrations || []).filter((r) => r.hackathon?._id === id));
        }
      } else {
        setRegError(res.message || "Registration failed");
      }
    } catch (err) {
      setRegError(err.response?.data?.message || "Registration failed. Already registered?");
    } finally {
      setRegistering(false);
    }
  };

  const handleDeleteHackathon = async () => {
    setDeleting(true);
    try {
      const res = await deleteHackathon(id);
      if (res.success) {
        navigate("/hackathons");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete hackathon");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !hackathon) {
    return <ErrorMessage message={error || "Hackathon not found"} />;
  }

  // Check if any of user's teams are already registered
  const registeredTeamIds = myRegs.map((r) => r.team?._id);
  const alreadyRegistered = myRegs.length > 0;

  // Check if registration deadline has passed
  const deadlinePassed = new Date(hackathon.registrationDeadline) < new Date();
  const hackathonCompleted = hackathon.status === "completed";

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Back button */}
      <div>
        <Link
          to="/hackathons"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hackathons
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="capitalize bg-sky-50 text-sky-600 border border-sky-100 font-bold text-xs px-2.5 py-0.5 rounded-full">
              {hackathon.mode}
            </span>
            <StatusBadge status={hackathon.status} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{hackathon.title}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Domain: <span className="text-slate-700">{hackathon.domain}</span></span>
          </div>
        </div>

        {/* Organizer actions */}
        {user &&
          (user.role === "admin" ||
            (user.role === "organizer" &&
              hackathon.createdBy?._id === user.id)) && (
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Link to={`/manage/hackathons?edit=${hackathon._id}`} className="flex-1 md:flex-initial">
                <Button variant="outline" className="w-full">
                  Edit Event
                </Button>
              </Link>
              <Button
                variant="danger"
                onClick={() => setDeleteModalOpen(true)}
                className="flex-1 md:flex-initial"
              >
                Delete Event
              </Button>
            </div>
          )}
      </div>

      {/* MAIN CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description & Winners */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3 mb-4">
              About the Hackathon
            </h2>
            <p className="text-sm text-slate-650 leading-relaxed whitespace-pre-wrap">
              {hackathon.description}
            </p>
          </div>

          {/* Declared Winners section */}
          {results.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/20 rounded-xl border border-amber-100 p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-amber-900 flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-amber-600" />
                Winners Declared!
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1st Place */}
                {results.find((r) => r.position === 1) && (
                  <div className="p-4 bg-white border border-amber-200 rounded-lg text-center shadow-xs flex flex-col items-center">
                    <span className="text-2xl">🥇</span>
                    <h4 className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      First Place
                    </h4>
                    <p className="mt-1.5 text-sm font-bold text-slate-800">
                      {results.find((r) => r.position === 1).submission?.title}
                    </p>
                    <p className="text-2xs text-slate-500 mt-1">
                      Team: {results.find((r) => r.position === 1).submission?.team?.name || "N/A"}
                    </p>
                  </div>
                )}

                {/* 2nd Place */}
                {results.find((r) => r.position === 2) && (
                  <div className="p-4 bg-white border border-slate-200 rounded-lg text-center shadow-xs flex flex-col items-center">
                    <span className="text-2xl">🥈</span>
                    <h4 className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Second Place
                    </h4>
                    <p className="mt-1.5 text-sm font-bold text-slate-800">
                      {results.find((r) => r.position === 2).submission?.title}
                    </p>
                    <p className="text-2xs text-slate-500 mt-1">
                      Team: {results.find((r) => r.position === 2).submission?.team?.name || "N/A"}
                    </p>
                  </div>
                )}

                {/* 3rd Place */}
                {results.find((r) => r.position === 3) && (
                  <div className="p-4 bg-white border border-orange-200 rounded-lg text-center shadow-xs flex flex-col items-center">
                    <span className="text-2xl">🥉</span>
                    <h4 className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Third Place
                    </h4>
                    <p className="mt-1.5 text-sm font-bold text-slate-800">
                      {results.find((r) => r.position === 3).submission?.title}
                    </p>
                    <p className="text-2xs text-slate-500 mt-1">
                      Team: {results.find((r) => r.position === 3).submission?.team?.name || "N/A"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Timelines & Registration Form */}
        <div className="space-y-6">
          {/* Key details */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2.5">
              Event Details
            </h3>

            <div className="space-y-3.5">
              <div className="flex gap-3 text-xs">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-500">Event Timeline</p>
                  <p className="mt-0.5 text-slate-700 font-medium">
                    {formatDate(hackathon.startDate)} – {formatDate(hackathon.endDate)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-500">Registration Deadline</p>
                  <p className="mt-0.5 text-slate-700 font-medium">
                    {formatDate(hackathon.registrationDeadline)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-500">Team Size Requirements</p>
                  <p className="mt-0.5 text-slate-700 font-medium">
                    Min: {hackathon.minTeamSize || 1} • Max: {hackathon.maxTeamSize} members
                  </p>
                </div>
              </div>

              {hackathon.mode !== "online" && (
                <div className="flex gap-3 text-xs">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-500">Location</p>
                    <p className="mt-0.5 text-slate-700 font-medium">
                      {hackathon.location || "Offline Event"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Registration Section for Participant */}
          {user && user.role === "participant" && !hackathonCompleted && (
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2.5">
                Register Your Team
              </h3>

              {alreadyRegistered ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <p className="text-3xs text-slate-400 uppercase font-semibold">Registered Team</p>
                    <p className="text-xs font-bold text-slate-850 mt-1">{myRegs[0].team?.name}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-3xs text-slate-500">Status</span>
                      <StatusBadge status={myRegs[0].status} />
                    </div>
                  </div>

                  {myRegs[0].status === "approved" && (
                    <div className="pt-2">
                      <Link to="/submissions/create" className="w-full block">
                        <Button variant="primary" className="w-full">
                          Submit Project Solution
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : deadlinePassed ? (
                <div className="flex gap-2 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs leading-normal">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Registrations are closed. The deadline has passed.</span>
                </div>
              ) : myTeams.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    You must lead a team formed for this hackathon to register.
                  </p>
                  <Link to="/teams/create" className="block w-full">
                    <Button variant="outline" icon={PlusCircle} className="w-full text-sky-600 border-sky-200">
                      Create a Team
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleRegisterTeam} className="space-y-4">
                  <div>
                    <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                      Select Team
                    </label>
                    <select
                      className="block w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                    >
                      {myTeams.map((team) => (
                        <option key={team._id} value={team._id}>
                          {team.name} ({team.members?.length} Members)
                        </option>
                      ))}
                    </select>
                  </div>

                  {regError && <p className="text-xs text-rose-600">{regError}</p>}
                  {regSuccess && <p className="text-xs text-emerald-600">{regSuccess}</p>}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    loading={registering}
                  >
                    Submit Registration
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteHackathon}
        loading={deleting}
        title="Delete Hackathon?"
        message={`Are you sure you want to delete "${hackathon.title}"? This will permanently delete the hackathon event.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default HackathonDetailsPage;
