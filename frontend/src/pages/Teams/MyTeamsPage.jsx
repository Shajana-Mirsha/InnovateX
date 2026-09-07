import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyTeams } from "../../api/teamApi";
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
      const data = await getMyTeams();
      if (data.success) {
        setMyTeams(data.teams || []);
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Participant Teams</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            My Teams Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
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
            const currentUserId = (user?._id || user?.id)?.toString();
            const leaderId = (team.leader?._id || team.leader)?.toString();
            const isLeader = leaderId && currentUserId && leaderId === currentUserId;
            const maxCapacity = team.hackathon?.maxTeamSize || 4;

            return (
              <div
                key={team._id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between shadow-sm"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-semibold text-slate-500">
                      Roster: {team.members?.length || 1} / {maxCapacity}
                    </span>
                    <StatusBadge status={team.status} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      {team.name}
                      {isLeader && (
                        <span className="text-2xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
                          Leader
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {team.description || "No description provided."}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Challenge: <strong className="text-slate-800">{team.hackathon?.title || "N/A"}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Leader: <strong className="text-slate-800">{team.leader?.name || "You"}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {team.members?.length || 1} active contributors
                  </span>
                  <Link
                    to={`/teams/${team._id}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition"
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
