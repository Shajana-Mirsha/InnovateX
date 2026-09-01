import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllTeams } from "../../api/teamApi";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import { CardSkeleton } from "../../components/common/Skeleton";
import { Users, Calendar, ArrowRight, UserCheck, PlusCircle } from "lucide-react";

const MyTeamsPage = () => {
  const { user } = useAuth();
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMyTeams = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllTeams();
      if (data.success) {
        const filtered = (data.teams || []).filter(
          (t) =>
            (t.leader?._id || t.leader) === user.id ||
            t.members?.some((m) => (m._id || m) === user.id)
        );
        setMyTeams(filtered);
      }
    } catch (err) {
      setError("Failed to load your teams. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTeams();
  }, [user]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Participant Teams</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            My Teams Workspace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your project squads, view team members, and register for competitions.
          </p>
        </div>

        {user && user.role === "participant" && (
          <Link to="/teams/create">
            <Button variant="primary" size="md" icon={PlusCircle}>
              Create New Team
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchMyTeams} />
      ) : myTeams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Not in any teams"
          message="You are not leading or participating in any teams yet. Create a team or join an open roster!"
          actionButton={
            <Link to="/teams/create">
              <Button variant="primary" size="sm">Create Your First Team</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myTeams.map((team) => {
            const isLeader = (team.leader?._id || team.leader) === user?.id;
            const maxCapacity = team.hackathon?.maxTeamSize || 4;

            return (
              <div
                key={team._id}
                className="glass-panel rounded-3xl border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between shadow-lg"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-mono font-bold text-slate-400">
                      Roster: {team.members?.length || 1} / {maxCapacity}
                    </span>
                    <StatusBadge status={team.status} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {team.name}
                      {isLeader && (
                        <span className="text-4xs font-mono font-bold bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                          Leader
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {team.description || "No description provided."}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-slate-800/60 text-3xs text-slate-400 font-mono">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Challenge: <strong className="text-slate-300 font-sans">{team.hackathon?.title || "N/A"}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Leader: <strong className="text-slate-300 font-sans">{team.leader?.name || "You"}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-3xs text-slate-500 font-mono">
                    {team.members?.length || 1} active contributors
                  </span>
                  <Link
                    to={`/teams/${team._id}`}
                    className="text-xs font-bold text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
                  >
                    View Team Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTeamsPage;
