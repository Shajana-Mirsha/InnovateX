import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllTeams, joinTeam } from "../../api/teamApi";
import { getAllHackathons } from "../../api/hackathonApi";
import PageHeader from "../../components/common/PageHeader";
import SearchBar from "../../components/common/SearchBar";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { CardSkeleton } from "../../components/common/Skeleton";
import { Users, Calendar, User, ArrowRight, UserPlus } from "lucide-react";
import { toast } from "sonner";

const TeamsPage = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [hackathonFilter, setHackathonFilter] = useState("all");
  const [joiningTeamId, setJoiningTeamId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [teamsRes, hackRes] = await Promise.all([
        getAllTeams(),
        getAllHackathons(),
      ]);

      if (teamsRes.success) setTeams(teamsRes.teams || []);
      if (hackRes.success) setHackathons(hackRes.hackathons || []);
    } catch (err) {
      setError("Failed to fetch teams information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleJoinTeam = async (teamId) => {
    if (!user) {
      toast.error("Please login first.");
      return;
    }

    setJoiningTeamId(teamId);
    try {
      const res = await joinTeam(teamId);
      if (res.success) {
        setTeams((prevTeams) =>
          prevTeams.map((t) => {
            if (t._id === teamId) {
              const updatedMembers = [...t.members, { _id: user.id, name: user.name, email: user.email }];
              const isFull = updatedMembers.length >= (t.hackathon?.maxTeamSize || 4);
              return {
                ...t,
                members: updatedMembers,
                status: isFull ? "full" : t.status,
              };
            }
            return t;
          })
        );
        toast.success("Successfully joined the team!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join team.");
    } finally {
      setJoiningTeamId(null);
    }
  };

  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.leader?.name && t.leader.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesHackathon =
      hackathonFilter === "all" || (t.hackathon?._id || t.hackathon) === hackathonFilter;

    return matchesSearch && matchesHackathon;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Collaboration & Rosters</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Challenge Teams
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse collaborative builder teams or find an open group to join.
          </p>
        </div>

        {user && user.role === "participant" && (
          <Link to="/teams/create">
            <Button variant="primary" size="md" icon={UserPlus}>
              Create New Team
            </Button>
          </Link>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by team name, leader, description..."
        />
        <div className="w-full md:w-64 shrink-0">
          <select
            className="w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 focus:border-brand-500 focus:outline-none"
            value={hackathonFilter}
            onChange={(e) => setHackathonFilter(e.target.value)}
          >
            <option value="all">All Hackathons</option>
            {hackathons.map((h) => (
              <option key={h._id} value={h._id}>
                {h.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TEAMS GRID */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchData} />
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Teams Found"
          message="No teams match your search or filter settings."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => {
            const isMember = team.members?.some((m) => (m._id || m) === user?.id);
            const isLeader = (team.leader?._id || team.leader) === user?.id;
            const isFull = team.status === "full";
            const isClosed = team.status === "closed";
            const maxCapacity = team.hackathon?.maxTeamSize || 4;

            return (
              <div
                key={team._id}
                className="glass-panel rounded-3xl border border-slate-800/80 hover:border-slate-700 transition flex flex-col h-full overflow-hidden justify-between shadow-lg"
              >
                <div className="p-6 flex-grow flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-mono font-bold text-slate-400">
                      Roster: {team.members?.length || 1} / {maxCapacity}
                    </span>
                    <StatusBadge status={team.status} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight truncate">
                      {team.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                      {team.description || "No description provided."}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-slate-800/60 pt-4 mt-auto text-3xs text-slate-400 font-mono">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">Challenge: <strong className="text-slate-300 font-sans">{team.hackathon?.title || "N/A"}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Leader: <strong className="text-slate-300 font-sans">{team.leader?.name || "Member"}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-4">
                  <Link to={`/teams/${team._id}`} className="text-xs font-bold text-slate-300 hover:text-white inline-flex items-center gap-1">
                    Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {user && user.role === "participant" && (
                    <div>
                      {isLeader ? (
                        <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Leader
                        </span>
                      ) : isMember ? (
                        <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Joined
                        </span>
                      ) : isFull || isClosed ? (
                        <span className="text-3xs font-mono text-slate-500">
                          Closed
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={joiningTeamId === team._id}
                          onClick={() => handleJoinTeam(team._id)}
                        >
                          Join Team
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
