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
import { formatDate } from "../../utils/helpers";
import { MapPin, Calendar, Globe, Layers, Settings } from "lucide-react";

const HackathonListPage = () => {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Search & Filter states
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
      console.error(err);
      setError("Failed to fetch hackathons list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  // Filter hackathons on client side
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

  // Get unique list of domains for visual filters if desired
  const uniqueDomains = [...new Set(hackathons.map((h) => h.domain))];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Hackathons"
        description="Discover challenges, build teams, and innovate in these events."
        action={
          user && (user.role === "organizer" || user.role === "admin") ? (
            <div className="flex gap-2">
              <Link to="/manage/hackathons">
                <button className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2 rounded-lg border border-slate-200 transition">
                  <Settings className="w-4 h-4" />
                  Manage My Events
                </button>
              </Link>
              <Link to="/manage/hackathons?create=true">
                <button className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow transition">
                  Host Hackathon
                </button>
              </Link>
            </div>
          ) : null
        }
      />

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by title, domain, description..."
        />
        <div className="flex gap-3 w-full md:w-auto shrink-0">
          <div className="flex-1 md:flex-initial">
            <select
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchHackathons} />
      ) : filteredHackathons.length === 0 ? (
        <EmptyState
          title="No Hackathons Found"
          message="Adjust your filters or search query and try again."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHackathons.map((hack) => (
            <div
              key={hack._id}
              className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition duration-200 flex flex-col h-full overflow-hidden group"
            >
              <div className="p-6 flex-grow flex flex-col">
                {/* badges header */}
                <div className="flex items-center justify-between mb-4 gap-2">
                  <span className="inline-flex items-center text-4xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100 capitalize">
                    {hack.mode}
                  </span>
                  <StatusBadge status={hack.status} />
                </div>

                <h3 className="text-base font-bold text-slate-800 group-hover:text-sky-600 transition mb-2">
                  {hack.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed flex-grow">
                  {hack.description}
                </p>

                {/* metadata */}
                <div className="space-y-2 border-t border-slate-50 pt-4 mt-auto">
                  <div className="flex items-center gap-2 text-3xs text-slate-500 font-medium">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Domain: <span className="font-semibold text-slate-700">{hack.domain}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-3xs text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {formatDate(hack.startDate)} – {formatDate(hack.endDate)}
                    </span>
                  </div>
                  {hack.mode !== "online" && hack.location && (
                    <div className="flex items-center gap-2 text-3xs text-slate-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{hack.location}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                <Link to={`/hackathons/${hack._id}`} className="block w-full">
                  <button className="w-full text-center border border-slate-200 hover:bg-sky-600 hover:text-white hover:border-transparent text-slate-700 font-bold text-xs py-2 rounded-lg transition duration-150">
                    View Details
                  </button>
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
