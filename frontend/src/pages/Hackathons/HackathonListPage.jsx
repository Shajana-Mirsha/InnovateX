import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllHackathons } from "../../api/hackathonApi";
import PageHeader from "../../components/common/PageHeader";
import SearchBar from "../../components/common/SearchBar";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { CardSkeleton } from "../../components/common/Skeleton";
import { formatDate } from "../../utils/helpers";
import { MapPin, Calendar, Globe, Layers, Settings, Plus, Sliders } from "lucide-react";

const HackathonListPage = () => {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");

  const fetchHackathons = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllHackathons();
      if (data.success) {
        setHackathons(data.hackathons || []);
      }
    } catch (err) {
      setError("Failed to fetch hackathons list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  const filteredHackathons = hackathons.filter((hack) => {
    const matchesSearch =
      hack.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hack.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hack.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || hack.status === statusFilter;

    const matchesMode =
      modeFilter === "all" || hack.mode === modeFilter;

    return matchesSearch && matchesStatus && matchesMode;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>National Challenges Directory</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Hackathons & Innovation Challenges
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Explore active competitions, view custom rubric dimensions, and submit solutions.
          </p>
        </div>

        {user && (user.role === "organizer" || user.role === "admin") && (
          <div className="flex items-center gap-3">
            <Link to="/manage/hackathons">
              <Button variant="outline" size="md" icon={Settings}>
                Manage Events
              </Button>
            </Link>
            <Link to="/manage/hackathons?create=true">
              <Button variant="primary" size="md" icon={Plus}>
                Host Event
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by challenge title, domain, description..."
        />
        <div className="flex gap-3 w-full md:w-auto shrink-0">
          <div className="flex-1 md:flex-initial">
            <select
              className="w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 focus:border-brand-500 focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="registration_open">Registration Open</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex-1 md:flex-initial">
            <select
              className="w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 focus:border-brand-500 focus:outline-none"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
            >
              <option value="all">All Modes</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>
      </div>

      {/* HACKATHON CARDS */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchHackathons} />
      ) : filteredHackathons.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Hackathons Found"
          message="No challenges match your search filters. Try adjusting your search query."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHackathons.map((hack) => (
            <div
              key={hack._id}
              className="glass-panel rounded-3xl border border-slate-800/80 hover:border-slate-700 transition flex flex-col h-full overflow-hidden justify-between group shadow-lg"
            >
              <div className="p-6 flex-grow flex flex-col space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 text-3xs font-mono font-bold rounded-full bg-slate-800 text-brand-300 border border-slate-700 uppercase">
                    {hack.mode}
                  </span>
                  <StatusBadge status={hack.status} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition tracking-tight">
                    {hack.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                    {hack.description}
                  </p>
                </div>

                <div className="space-y-2 border-t border-slate-800/60 pt-4 mt-auto text-3xs text-slate-400 font-mono">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Domain: <strong className="text-slate-300 font-sans">{hack.domain}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{formatDate(hack.startDate)} – {formatDate(hack.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-brand-400">
                    <Sliders className="w-3.5 h-3.5 shrink-0" />
                    <span>{hack.criteria?.length || 4} Rubric Criteria</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800/80">
                <Link to={`/hackathons/${hack._id}`} className="block w-full">
                  <Button variant="outline" size="sm" className="w-full">
                    View Challenge Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HackathonListPage;
