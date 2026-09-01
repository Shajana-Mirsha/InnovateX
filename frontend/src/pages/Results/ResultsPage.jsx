import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getHackathonResults } from "../../api/resultApi";
import { getAllHackathons } from "../../api/hackathonApi";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { Trophy, Award, Crown, CheckSquare, Calendar } from "lucide-react";

const ResultsPage = () => {
  const { user } = useAuth();

  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState("");
  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultsError, setResultsError] = useState("");

  useEffect(() => {
    const fetchHackathons = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAllHackathons();
        if (data.success) {
          setHackathons(data.hackathons || []);
          if (data.hackathons?.length > 0) {
            setSelectedHackathonId(data.hackathons[0]._id);
          }
        }
      } catch (err) {
        setError("Failed to load hackathons list.");
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, []);

  const fetchResults = async () => {
    if (!selectedHackathonId) return;
    setResultsLoading(true);
    setResultsError("");
    try {
      const data = await getHackathonResults(selectedHackathonId);
      if (data.success) {
        setResults(data.results || []);
      }
    } catch (err) {
      setResultsError("Failed to fetch declared winners for this challenge.");
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedHackathonId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const firstPlace = results.find((r) => r.position === 1);
  const secondPlace = results.find((r) => r.position === 2);
  const thirdPlace = results.find((r) => r.position === 3);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>Honors & Ceremonies</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Official Winners & Results
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Check official declared rankings, winning projects, and podium positions.
          </p>
        </div>

        {user && (user.role === "organizer" || user.role === "admin") && (
          <Link to="/manage/results">
            <Button variant="primary" size="md" icon={CheckSquare}>
              Declare Winners
            </Button>
          </Link>
        )}
      </div>

      {/* Select Hackathon Event */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <span className="text-xs font-bold text-slate-300 shrink-0">Select Hackathon Event:</span>
        <div className="w-full sm:w-80">
          {hackathons.length === 0 ? (
            <p className="text-xs text-rose-400 font-semibold">No hackathons listed</p>
          ) : (
            <select
              className="w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 focus:border-brand-500 focus:outline-none"
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
            >
              {hackathons.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Winners Podium View */}
      {resultsLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : resultsError ? (
        <ErrorMessage message={resultsError} retryAction={fetchResults} />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Winners Not Declared"
          message="The challenge organizers have not declared official winners for this event yet."
        />
      ) : (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Visual podium */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pt-8">
            {/* 2nd Place */}
            {secondPlace && (
              <div className="order-2 sm:order-1 p-6 glass-panel border border-slate-700 rounded-3xl text-center flex flex-col items-center sm:h-48 justify-center relative shadow-lg">
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-3xl">🥈</span>
                <h4 className="mt-2 text-3xs font-extrabold text-slate-400 uppercase tracking-widest">
                  Second Place
                </h4>
                <p className="mt-2 text-base font-bold text-white line-clamp-1">
                  {secondPlace.submission?.title}
                </p>
                <p className="text-3xs text-slate-400 mt-1 font-mono">
                  Team: {secondPlace.submission?.team?.name || "N/A"}
                </p>
              </div>
            )}

            {/* 1st Place */}
            {firstPlace && (
              <div className="order-1 sm:order-2 p-6 rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/50 shadow-2xl text-center flex flex-col items-center sm:h-56 justify-center relative ring-2 ring-amber-400/30">
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-4xl animate-bounce">👑</span>
                <span className="text-2xl mt-2">🥇</span>
                <h4 className="mt-2 text-3xs font-extrabold text-amber-400 uppercase tracking-widest font-mono">
                  First Place Winner
                </h4>
                <p className="mt-2 text-lg font-bold text-white line-clamp-1">
                  {firstPlace.submission?.title}
                </p>
                <p className="text-3xs text-amber-300 mt-1 font-mono font-semibold">
                  Team: {firstPlace.submission?.team?.name || "N/A"}
                </p>
              </div>
            )}

            {/* 3rd Place */}
            {thirdPlace && (
              <div className="order-3 p-6 glass-panel border border-orange-800/60 rounded-3xl text-center flex flex-col items-center sm:h-44 justify-center relative shadow-lg">
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-3xl">🥉</span>
                <h4 className="mt-2 text-3xs font-extrabold text-orange-400 uppercase tracking-widest">
                  Third Place
                </h4>
                <p className="mt-2 text-base font-bold text-white line-clamp-1">
                  {thirdPlace.submission?.title}
                </p>
                <p className="text-3xs text-slate-400 mt-1 font-mono">
                  Team: {thirdPlace.submission?.team?.name || "N/A"}
                </p>
              </div>
            )}
          </div>

          {/* List display */}
          <div className="glass-panel border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white">All Declared Rankings</h4>
            </div>
            <div className="divide-y divide-slate-800/60">
              {results.map((res) => (
                <div key={res._id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {res.position === 1 ? "🥇" : res.position === 2 ? "🥈" : res.position === 3 ? "🥉" : "🏆"}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {res.submission?.title}
                      </p>
                      <p className="text-3xs text-slate-400 mt-0.5 font-mono">
                        Team: {res.submission?.team?.name || "N/A"} • Position #{res.position}
                      </p>
                    </div>
                  </div>
                  <span className="text-4xs text-slate-500 font-mono">
                    Declared by: {res.declaredBy?.name || "Organizer"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
