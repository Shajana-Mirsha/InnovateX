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
import { Users, Calendar, User, ArrowRight, UserPlus } from "lucide-react";

const TeamsPage = () => {
  const { user } = useAuth();
  
  const [teams, setTeams] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [hackathonFilter, setHackathonFilter] = useState("all");

  // Joining state
  const [joiningTeamId, setJoiningTeamId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [teamsRes, hackRes] = await Promise.all([
        getAllTeams(),
        getAllHackathons(),
      ]);

      if (teamsRes.success) {
        setTeams(teamsRes.teams || []);
      }
      if (hackRes.success) {
        setHackathons(hackRes.hackathons || []);
      }
    } catch (err) {
      console.error(err);
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
      alert("Please login first.");
      return;
    }

    setJoiningTeamId(teamId);
    try {
      const res = await joinTeam(teamId);
      if (res.success) {
        // Update local state to reflect membership
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
        alert("Successfully joined the team!");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to join team.");
    } finally {
      setJoiningTeamId(null);
    }
  };

  // Client-side filtering
  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.leader?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesHackathon =
      hackathonFilter === "all" || t.hackathon?._id === hackathonFilter;

    return matchesSearch && matchesHackathon;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="All Teams"
        description="Browse collaborative groups or find an open team to join."
        action={
          user && user.role === "participant" ? (
            <Link to="/teams/create">
              <Button variant="primary" icon={UserPlus}>
                Create Team
              </Button>
            </Link>
          ) : null
        }
      />

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by team name, leader, description..."
        />
        <div className="w-full md:w-64 shrink-0">
          <select
            className="w-full text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchData} />
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          title="No Teams Found"
          message="Adjust search query or filter settings and try again."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => {
            const isMember = team.members?.some((m) => m._id === user?.id);
            const isLeader = team.leader?._id === user?.id;
            const isFull = team.status === "full";
            const isClosed = team.status === "closed";
            const maxCapacity = team.hackathon?.maxTeamSize || 4;

            return (
              <div
                key={team._id}
                className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md hover:border-slate-250 transition duration-200 flex flex-col h-full overflow-hidden"
              >
                <div className="p-6 flex-grow flex flex-col">
                  {/* Status and capacity badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xs font-semibold text-slate-400">
                      Capacity: {team.members?.length} / {maxCapacity}
                    </span>
                    <StatusBadge status={team.status} />
                  </div>

                  <h3 className="text-base font-bold text-slate-800 mb-2 truncate">
                    {team.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed flex-grow">
                    {team.description || "No description provided."}
                  </p>

                  {/* Metadata */}
                  <div className="space-y-2 border-t border-slate-50 pt-4 mt-auto">
                    <div className="flex items-center gap-2 text-3xs text-slate-500 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Hackathon: {team.hackathon?.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-3xs text-slate-500 font-semibold">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Leader: {team.leader?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-4">
                  <Link to={`/teams/${team._id}`} className="text-xs font-bold text-slate-600 hover:text-slate-800 inline-flex items-center gap-1">
                    Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {user && user.role === "participant" && (
                    <div>
                      {isLeader ? (
                        <span className="text-3xs font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded">
                          You Lead
                        </span>
                      ) : isMember ? (
                        <span className="text-3xs font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                          Member
                        </span>
                      ) : isFull || isClosed ? (
                        <button
                          disabled
                          className="px-3.5 py-1.5 bg-slate-200 text-slate-400 font-bold text-3xs rounded-lg cursor-not-allowed"
                        >
                          Closed
                        </button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white text-sky-600 border-sky-200 hover:bg-sky-50"
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
