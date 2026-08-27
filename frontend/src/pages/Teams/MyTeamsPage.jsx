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
import { Users, Calendar, ArrowRight, UserCheck } from "lucide-react";

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
        // Filter teams where user is leader or member
        const filtered = (data.teams || []).filter(
          (t) =>
            t.leader?._id === user.id ||
            t.members?.some((m) => m._id === user.id)
        );
        setMyTeams(filtered);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load your teams. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTeams();
  }, [user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="My Teams"
        description="View and manage the teams you are currently leading or participating in."
        action={
          user && user.role === "participant" ? (
            <Link to="/teams/create">
              <Button variant="primary">Create Team</Button>
            </Link>
          ) : null
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchMyTeams} />
      ) : myTeams.length === 0 ? (
        <EmptyState
          title="Not in any teams"
          message="You are not leading or participating in any teams. Join an open team or create one!"
          actionButton={
            <Link to="/teams">
              <Button variant="primary">Browse All Teams</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myTeams.map((team) => {
            const isLeader = team.leader?._id === user?.id;
            const maxCapacity = team.hackathon?.maxTeamSize || 4;

            return (
              <div
                key={team._id}
                className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-semibold text-slate-400">
                      Members: {team.members?.length} / {maxCapacity}
                    </span>
                    <StatusBadge status={team.status} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      {team.name}
                      {isLeader && (
                        <span className="text-4xs font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100">
                          Leader
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {team.description || "No description provided."}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-50 text-3xs text-slate-500 font-semibold">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Hackathon: {team.hackathon?.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Leader: {team.leader?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 text-right">
                  <Link
                    to={`/teams/${team._id}`}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
                  >
                    View Workspace Details
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
