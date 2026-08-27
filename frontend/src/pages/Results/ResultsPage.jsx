import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getHackathonResults } from "../../api/resultApi";
import { getAllHackathons } from "../../api/hackathonApi";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import { Trophy, Award, Crown, CheckSquare } from "lucide-react";

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
        console.error(err);
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
      console.error(err);
      setResultsError("Failed to fetch declared winners for this hackathon.");
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
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Winners & Results"
        description="Check official declared winners for completed hackathons."
        action={
          user && (user.role === "organizer" || user.role === "admin") ? (
            <Link to="/manage/results">
              <button className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow transition">
                <CheckSquare className="w-4 h-4" />
                Declare Results
              </button>
            </Link>
          ) : null
        }
      />

      {/* Select Hackathon */}
      <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <span className="text-xs font-bold text-slate-700 shrink-0">Select Hackathon Event:</span>
        <div className="w-full sm:w-80">
          {hackathons.length === 0 ? (
            <p className="text-xs text-rose-500 font-semibold">No hackathons listed</p>
          ) : (
            <select
              className="w-full text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
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

      {/* Winners View */}
      {resultsLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : resultsError ? (
        <ErrorMessage message={resultsError} retryAction={fetchResults} />
      ) : results.length === 0 ? (
        <EmptyState
          title="Winners Not Declared"
          message="The organizers haven't declared official winners for this hackathon yet."
        />
      ) : (
        <div className="space-y-8">
          {/* Visual podium */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end max-w-3xl mx-auto pt-8">
            {/* 2nd Place */}
            {secondPlace && (
              <div className="order-2 sm:order-1 p-6 bg-white border border-slate-150 rounded-2xl shadow-sm text-center flex flex-col items-center sm:h-44 justify-center relative">
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-3xl">🥈</span>
                <h4 className="mt-2 text-2xs font-extrabold text-slate-400 uppercase tracking-widest">
                  Second Place
                </h4>
                <p className="mt-2 text-base font-extrabold text-slate-800 line-clamp-1">
                  {secondPlace.submission?.title}
                </p>
                <p className="text-3xs text-slate-500 mt-1 uppercase font-semibold">
                  Team: {secondPlace.submission?.team?.name || "N/A"}
                </p>
              </div>
            )}

            {/* 1st Place */}
            {firstPlace && (
              <div className="order-1 sm:order-2 p-6 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-250 rounded-2xl shadow-md text-center flex flex-col items-center sm:h-52 justify-center relative ring-2 ring-amber-400/20">
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-4xl animate-bounce">👑</span>
                <span className="text-2xl mt-2">🥇</span>
                <h4 className="mt-2 text-2xs font-extrabold text-amber-800 uppercase tracking-widest">
                  First Place Winner
                </h4>
                <p className="mt-2 text-lg font-black text-slate-800 line-clamp-1">
                  {firstPlace.submission?.title}
                </p>
                <p className="text-3xs text-slate-500 mt-1 uppercase font-bold">
                  Team: {firstPlace.submission?.team?.name || "N/A"}
                </p>
              </div>
            )}

            {/* 3rd Place */}
            {thirdPlace && (
              <div className="order-3 p-6 bg-white border border-slate-150 rounded-2xl shadow-sm text-center flex flex-col items-center sm:h-38 justify-center relative">
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-3xl">🥉</span>
                <h4 className="mt-2 text-2xs font-extrabold text-slate-400 uppercase tracking-widest">
                  Third Place
                </h4>
                <p className="mt-2 text-base font-extrabold text-slate-800 line-clamp-1">
                  {thirdPlace.submission?.title}
                </p>
                <p className="text-3xs text-slate-500 mt-1 uppercase font-semibold">
                  Team: {thirdPlace.submission?.team?.name || "N/A"}
                </p>
              </div>
            )}
          </div>

          {/* List display */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden max-w-3xl mx-auto">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-800">Declared Positions</h4>
            </div>
            <div className="divide-y divide-slate-100">
              {results.map((res) => (
                <div key={res._id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {res.position === 1 ? "🥇" : res.position === 2 ? "🥈" : res.position === 3 ? "🥉" : "🏆"}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {res.submission?.title}
                      </p>
                      <p className="text-3xs text-slate-500 mt-1">
                        Team: {res.submission?.team?.name || "N/A"} • Position: {res.position}
                      </p>
                    </div>
                  </div>
                  <span className="text-3xs text-slate-400 font-semibold uppercase">
                    Declared by: {res.declaredBy?.name}
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
