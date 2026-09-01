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
import { CardSkeleton } from "../../components/common/Skeleton";
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
  Sliders,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

const HackathonDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [myTeams, setMyTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [myRegs, setMyRegs] = useState([]);
  const [registering, setRegistering] = useState(false);
  const [regSuccess, setRegSuccess] = useState("");
  const [regError, setRegError] = useState("");

  const [results, setResults] = useState([]);
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

      try {
        const resultsRes = await getHackathonResults(id);
        if (resultsRes.success) {
          setResults(resultsRes.results || []);
        }
      } catch (err) {
        // No results declared yet
      }

      if (user) {
        const teamsRes = await getAllTeams();
        if (teamsRes.success) {
          const eligibleTeams = (teamsRes.teams || []).filter(
            (t) =>
              (t.leader?._id || t.leader) === user.id &&
              (t.hackathon?._id || t.hackathon) === id
          );
          setMyTeams(eligibleTeams);
          if (eligibleTeams.length > 0) {
            setSelectedTeamId(eligibleTeams[0]._id);
          }
        }

        const myRegsRes = await getMyRegistrations();
        if (myRegsRes.success) {
          const hackRegs = (myRegsRes.registrations || []).filter(
            (r) => (r.hackathon?._id || r.hackathon) === id
          );
          setMyRegs(hackRegs);
        }
      }
    } catch (err) {
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
        toast.success("Team registered successfully! Awaiting organizer approval.");
        const myRegsRes = await getMyRegistrations();
        if (myRegsRes.success) {
          setMyRegs((myRegsRes.registrations || []).filter((r) => (r.hackathon?._id || r.hackathon) === id));
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
        toast.success("Hackathon deleted successfully");
        navigate("/hackathons");
      }
    } catch (err) {
      toast.error("Failed to delete hackathon");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-8">
        <CardSkeleton count={2} />
      </div>
    );
  }

  if (error || !hackathon) {
    return <ErrorMessage message={error || "Hackathon not found"} />;
  }

  const alreadyRegistered = myRegs.length > 0;
  const deadlinePassed = new Date(hackathon.registrationDeadline) < new Date();
  const hackathonCompleted = hackathon.status === "completed";

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <Link
          to="/hackathons"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hackathons
        </Link>
      </div>

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="capitalize px-3 py-1 text-xs font-mono font-bold rounded-full bg-slate-800 text-brand-300 border border-slate-700">
              {hackathon.mode}
            </span>
            <StatusBadge status={hackathon.status} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{hackathon.title}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>Domain: <strong className="text-slate-200">{hackathon.domain}</strong></span>
          </div>
        </div>

        {user &&
          (user.role === "admin" ||
            (user.role === "organizer" &&
              (hackathon.createdBy?._id || hackathon.createdBy) === user.id)) && (
            <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0">
              <Link to={`/manage/hackathons?edit=${hackathon._id}`} className="flex-1 md:flex-initial">
                <Button variant="outline" size="sm" className="w-full">
                  Edit Event
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
                className="flex-1 md:flex-initial"
              >
                Delete Event
              </Button>
            </div>
          )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description, Rubric & Winners */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              About the Hackathon Challenge
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {hackathon.description}
            </p>
          </div>

          {/* Rubric Criteria Breakdown */}
          {hackathon.criteria && hackathon.criteria.length > 0 && (
            <div className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sliders className="w-4.5 h-4.5 text-brand-400" />
                Evaluation Rubric & Grading Dimensions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hackathon.criteria.map((c) => (
                  <div
                    key={c.name}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono capitalize">
                        {c.name.replace(/([A-Z])/g, " $1")}
                      </span>
                      <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/30">
                        Weight: {(c.weight * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-3xs text-slate-400 leading-relaxed">{c.description}</p>
                    <p className="text-4xs text-slate-500 font-mono">Max Score: {c.maxScore} pts</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Declared Winners section */}
          {results.length > 0 && (
            <div className="glass-panel rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-slate-900/60 p-6 sm:p-8 shadow-xl space-y-6">
              <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Official Challenge Winners
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {results.find((r) => r.position === 1) && (
                  <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/40 text-center flex flex-col items-center">
                    <span className="text-2xl">🥇</span>
                    <h4 className="mt-2 text-3xs font-bold text-amber-400 uppercase tracking-wider">
                      First Place
                    </h4>
                    <p className="mt-1 text-sm font-bold text-white line-clamp-1">
                      {results.find((r) => r.position === 1).submission?.title}
                    </p>
                    <p className="text-3xs text-slate-400 mt-1 font-mono">
                      Team: {results.find((r) => r.position === 1).submission?.team?.name || "N/A"}
                    </p>
                  </div>
                )}

                {results.find((r) => r.position === 2) && (
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 text-center flex flex-col items-center">
                    <span className="text-2xl">🥈</span>
                    <h4 className="mt-2 text-3xs font-bold text-slate-300 uppercase tracking-wider">
                      Second Place
                    </h4>
                    <p className="mt-1 text-sm font-bold text-white line-clamp-1">
                      {results.find((r) => r.position === 2).submission?.title}
                    </p>
                    <p className="text-3xs text-slate-400 mt-1 font-mono">
                      Team: {results.find((r) => r.position === 2).submission?.team?.name || "N/A"}
                    </p>
                  </div>
                )}

                {results.find((r) => r.position === 3) && (
                  <div className="p-5 rounded-2xl bg-slate-900 border border-orange-800/60 text-center flex flex-col items-center">
                    <span className="text-2xl">🥉</span>
                    <h4 className="mt-2 text-3xs font-bold text-orange-400 uppercase tracking-wider">
                      Third Place
                    </h4>
                    <p className="mt-1 text-sm font-bold text-white line-clamp-1">
                      {results.find((r) => r.position === 3).submission?.title}
                    </p>
                    <p className="text-3xs text-slate-400 mt-1 font-mono">
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
          <div className="glass-panel rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2.5">
              Event Logistics
            </h3>

            <div className="space-y-3.5">
              <div className="flex gap-3 text-xs">
                <Calendar className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-400">Timeline</p>
                  <p className="mt-0.5 text-white font-mono">
                    {formatDate(hackathon.startDate)} – {formatDate(hackathon.endDate)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <Clock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-400">Registration Deadline</p>
                  <p className="mt-0.5 text-white font-mono">
                    {formatDate(hackathon.registrationDeadline)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <Users className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-400">Team Size</p>
                  <p className="mt-0.5 text-white font-mono">
                    Min: {hackathon.minTeamSize || 1} • Max: {hackathon.maxTeamSize} members
                  </p>
                </div>
              </div>

              {hackathon.mode !== "online" && (
                <div className="flex gap-3 text-xs">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-400">Venue</p>
                    <p className="mt-0.5 text-white">{hackathon.location || "Offline Location"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Registration Section for Participant */}
          {user && user.role === "participant" && !hackathonCompleted && (
            <div className="glass-panel rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2.5">
                Register Your Team
              </h3>

              {alreadyRegistered ? (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                    <p className="text-4xs text-slate-400 uppercase font-semibold">Registered Team</p>
                    <p className="text-sm font-bold text-white">{myRegs[0].team?.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Approval Status</span>
                      <StatusBadge status={myRegs[0].status} />
                    </div>
                  </div>

                  {myRegs[0].status === "approved" && (
                    <Link to="/submissions/create" className="w-full block pt-1">
                      <Button variant="primary" size="md" className="w-full">
                        Submit Project Solution
                      </Button>
                    </Link>
                  )}
                </div>
              ) : deadlinePassed ? (
                <div className="flex gap-2 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Registrations are closed for this challenge.</span>
                </div>
              ) : myTeams.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You must lead a team created for this hackathon to register.
                  </p>
                  <Link to="/teams/create" className="block w-full">
                    <Button variant="outline" size="sm" icon={PlusCircle} className="w-full">
                      Create Team for Challenge
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleRegisterTeam} className="space-y-4">
                  <div>
                    <label className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5">
                      Select Leading Team
                    </label>
                    <select
                      className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500"
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

                  {regError && <p className="text-xs text-rose-400">{regError}</p>}
                  {regSuccess && <p className="text-xs text-emerald-400">{regSuccess}</p>}

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full"
                    loading={registering}
                  >
                    Submit Team Registration
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteHackathon}
        loading={deleting}
        title="Delete Hackathon?"
        message={`Are you sure you want to delete "${hackathon.title}"?`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default HackathonDetailsPage;
