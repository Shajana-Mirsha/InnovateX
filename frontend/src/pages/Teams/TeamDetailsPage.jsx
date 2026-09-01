import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getTeamById, joinTeam, leaveTeam } from "../../api/teamApi";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { CardSkeleton } from "../../components/common/Skeleton";
import { Users, Calendar, User, Mail, ArrowLeft, LogOut, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const TeamDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const fetchTeam = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getTeamById(id);
      if (res.success) {
        setTeam(res.team);
      }
    } catch (err) {
      setError("Failed to load team details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [id]);

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      const res = await joinTeam(id);
      if (res.success) {
        toast.success("Successfully joined the team!");
        fetchTeam();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join team.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      const res = await leaveTeam(id);
      if (res.success) {
        toast.success("Left the team successfully.");
        setLeaveModalOpen(false);
        navigate("/my-teams");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave team.");
    } finally {
      setActionLoading(false);
      setLeaveModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-8">
        <CardSkeleton count={2} />
      </div>
    );
  }

  if (error || !team) {
    return <ErrorMessage message={error || "Team not found"} />;
  }

  const isMember = team.members?.some((m) => (m._id || m) === user?.id);
  const isLeader = (team.leader?._id || team.leader) === user?.id;
  const isFull = team.status === "full";
  const isClosed = team.status === "closed";
  const maxCapacity = team.hackathon?.maxTeamSize || 4;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <Link
          to="/teams"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Teams
        </Link>
      </div>

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="space-y-3 flex-grow">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-3xs font-mono font-bold text-slate-400">
              Capacity: {team.members?.length || 1} / {maxCapacity}
            </span>
            <StatusBadge status={team.status} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{team.name}</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {team.description || "No description provided for this team."}
          </p>
        </div>

        {user && user.role === "participant" && (
          <div className="shrink-0 w-full md:w-auto">
            {isLeader ? (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 max-w-xs">
                <strong>Team Leader:</strong> You are managing this team.
              </div>
            ) : isMember ? (
              <Button
                variant="danger"
                size="md"
                icon={LogOut}
                onClick={() => setLeaveModalOpen(true)}
                className="w-full md:w-auto"
              >
                Leave Team
              </Button>
            ) : isFull || isClosed ? (
              <span className="text-xs font-mono text-slate-500">
                Team Full / Closed
              </span>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleJoin}
                loading={actionLoading}
                className="w-full md:w-auto"
              >
                Join this Team
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-400" />
              Team Roster ({team.members?.length || 1})
            </h3>

            <div className="divide-y divide-slate-800/60">
              {team.members?.map((member) => {
                const memberIsLeader = (member._id || member) === (team.leader?._id || team.leader);
                return (
                  <div key={member._id || member} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 flex items-center justify-center font-bold text-xs">
                        {member.name ? member.name.substring(0, 2).toUpperCase() : "M"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white flex items-center gap-2">
                          {member.name || "Team Member"}
                          {memberIsLeader && (
                            <span className="text-4xs font-mono font-bold bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                              Leader
                            </span>
                          )}
                        </p>
                        <p className="text-3xs text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="glass-panel rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2.5 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-brand-400" />
              Challenge Event
            </h3>

            <div>
              <p className="text-4xs text-slate-400 uppercase font-semibold">Hackathon</p>
              <Link
                to={`/hackathons/${team.hackathon?._id || team.hackathon}`}
                className="text-sm font-bold text-brand-400 hover:text-brand-300 mt-1 block transition"
              >
                {team.hackathon?.title || "Challenge Details"}
              </Link>
            </div>

            <div className="pt-2">
              <Link to={`/hackathons/${team.hackathon?._id || team.hackathon}`}>
                <Button size="sm" variant="outline" className="w-full">
                  View Challenge Page
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onConfirm={handleLeave}
        loading={actionLoading}
        title="Leave Team?"
        message={`Are you sure you want to leave team "${team.name}"?`}
        confirmText="Confirm Leave"
        cancelText="Cancel"
      />
    </div>
  );
};

export default TeamDetailsPage;
