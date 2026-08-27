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
import { Users, Calendar, User, Mail, ArrowLeft, LogOut, CheckCircle } from "lucide-react";

const TeamDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Join/Leave loader triggers
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
      console.error(err);
      setError("Failed to load team details. The team might not exist.");
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
        setTeam(res.team);
        fetchTeam(); // reload details to populate members list
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to join team.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      const res = await leaveTeam(id);
      if (res.success) {
        setLeaveModalOpen(false);
        navigate("/my-teams");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to leave team.");
    } finally {
      setActionLoading(false);
      setLeaveModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !team) {
    return <ErrorMessage message={error || "Team not found"} />;
  }

  const isMember = team.members?.some((m) => m._id === user?.id);
  const isLeader = team.leader?._id === user?.id;
  const isFull = team.status === "full";
  const isClosed = team.status === "closed";
  const maxCapacity = team.hackathon?.maxTeamSize || 4;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <Link
          to="/teams"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Teams
        </Link>
      </div>

      {/* Header Info */}
      <div className="bg-white border border-slate-100 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="space-y-3 flex-grow">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-3xs font-semibold text-slate-400">
              Capacity: {team.members?.length} / {maxCapacity}
            </span>
            <StatusBadge status={team.status} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{team.name}</h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            {team.description || "No description provided for this team."}
          </p>
        </div>

        {/* Dynamic button actions */}
        {user && user.role === "participant" && (
          <div className="shrink-0 w-full md:w-auto">
            {isLeader ? (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-3xs text-amber-800 leading-normal max-w-xs">
                <strong>Team Leader:</strong> You cannot leave the team. Transfer leadership or contact organizer.
              </div>
            ) : isMember ? (
              <Button
                variant="danger"
                icon={LogOut}
                onClick={() => setLeaveModalOpen(true)}
                className="w-full md:w-auto"
              >
                Leave Team
              </Button>
            ) : isFull || isClosed ? (
              <Button disabled className="w-full md:w-auto cursor-not-allowed">
                Closed / Full
              </Button>
            ) : (
              <Button
                variant="primary"
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

      {/* TEAM INFORMATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Members list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              Team Members ({team.members?.length})
            </h3>

            <div className="divide-y divide-slate-100">
              {team.members?.map((member) => {
                const memberIsLeader = member._id === team.leader?._id;
                return (
                  <div key={member._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-650">
                        {member.name ? member.name.substring(0, 2).toUpperCase() : "M"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-850 flex items-center gap-2">
                          {member.name}
                          {memberIsLeader && (
                            <span className="text-4xs font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100">
                              Leader
                            </span>
                          )}
                        </p>
                        <p className="text-3xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
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

        {/* Right column: Associated Hackathon */}
        <div>
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2.5 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-slate-400" />
              Event Info
            </h3>

            <div>
              <p className="text-3xs text-slate-400 uppercase font-semibold">Hackathon Title</p>
              <Link
                to={`/hackathons/${team.hackathon?._id}`}
                className="text-sm font-bold text-slate-800 mt-1 hover:text-sky-600 block transition underline"
              >
                {team.hackathon?.title}
              </Link>
            </div>
            
            <div className="pt-2">
              <Link to={`/hackathons/${team.hackathon?._id}`}>
                <Button size="sm" variant="outline" className="w-full">
                  View Hackathon Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Leave team confirmation modal */}
      <ConfirmationModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onConfirm={handleLeave}
        loading={actionLoading}
        title="Leave Team?"
        message={`Are you sure you want to leave team "${team.name}"? You will lose access to team solutions.`}
        confirmText="Confirm Leave"
        cancelText="Cancel"
      />
    </div>
  );
};

export default TeamDetailsPage;
