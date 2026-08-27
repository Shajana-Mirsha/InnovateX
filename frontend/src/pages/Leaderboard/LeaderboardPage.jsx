import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getLeaderboard } from "../../api/leaderboardApi";
import { getAllHackathons } from "../../api/hackathonApi";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import { Trophy, Award, Star, ListOrdered } from "lucide-react";

const LeaderboardPage = () => {
  const { user } = useAuth();
  
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [error, setError] = useState("");
  const [leaderboardError, setLeaderboardError] = useState("");

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

  const fetchLeaderboardData = async () => {
    if (!selectedHackathonId) return;
    setLeaderboardLoading(true);
    setLeaderboardError("");
    try {
      const data = await getLeaderboard(selectedHackathonId);
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error(err);
      setLeaderboardError(
        err.response?.data?.message || "Failed to generate leaderboard for this hackathon."
      );
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Leaderboard Rankings"
        description="Check dynamic participant team standings evaluated across innovation, presentation, and code quality."
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

      {/* Standings list */}
      {leaderboardLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : leaderboardError ? (
        <ErrorMessage
          message={leaderboardError}
          retryAction={fetchLeaderboardData}
        />
      ) : leaderboard.length === 0 ? (
        <EmptyState
          title="No Standings Yet"
          message="There are no project solutions submitted or evaluated for this hackathon yet."
        />
      ) : (
        <div className="space-y-6">
          {/* Top 3 Podium Mockup */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end max-w-3xl mx-auto pt-6 pb-2">
            {/* 2nd Place */}
            {leaderboard.length > 1 && (
              <div className="order-2 sm:order-1 p-5 bg-white border border-slate-100 rounded-xl shadow-sm text-center flex flex-col items-center sm:h-40 justify-center relative">
                <div className="absolute top-0 right-0 p-2.5 text-2xl">🥈</div>
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm mb-2 shrink-0">
                  2
                </div>
                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{leaderboard[1].projectTitle}</h4>
                <p className="text-4xs text-slate-450 mt-1 uppercase font-semibold">Team: {leaderboard[1].team?.name}</p>
                <p className="text-3xs font-extrabold text-sky-600 mt-2">{leaderboard[1].averageScore} pts</p>
              </div>
            )}

            {/* 1st Place */}
            {leaderboard.length > 0 && (
              <div className="order-1 sm:order-2 p-6 bg-white border border-amber-250 rounded-xl shadow-md text-center flex flex-col items-center sm:h-48 justify-center relative ring-1 ring-amber-100/50">
                <div className="absolute top-0 right-0 p-2.5 text-2xl">🥇</div>
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base mb-2 shrink-0 border border-amber-200">
                  1
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1">{leaderboard[0].projectTitle}</h4>
                <p className="text-4xs text-slate-450 mt-1 uppercase font-bold">Team: {leaderboard[0].team?.name}</p>
                <p className="text-xs font-black text-sky-600 mt-3">{leaderboard[0].averageScore} pts</p>
              </div>
            )}

            {/* 3rd Place */}
            {leaderboard.length > 2 && (
              <div className="order-3 p-5 bg-white border border-slate-100 rounded-xl shadow-sm text-center flex flex-col items-center sm:h-36 justify-center relative">
                <div className="absolute top-0 right-0 p-2.5 text-2xl">🥉</div>
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-850 flex items-center justify-center font-bold text-xs mb-2 shrink-0 border border-orange-100">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{leaderboard[2].projectTitle}</h4>
                <p className="text-4xs text-slate-450 mt-1 uppercase font-semibold">Team: {leaderboard[2].team?.name}</p>
                <p className="text-3xs font-extrabold text-sky-600 mt-2">{leaderboard[2].averageScore} pts</p>
              </div>
            )}
          </div>

          {/* Leaderboard Table list */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-3xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-150">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Project Title</th>
                    <th className="px-6 py-4">Team</th>
                    <th className="px-6 py-4 text-center">Scores Recorded</th>
                    <th className="px-6 py-4 text-right">Average Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.map((entry) => (
                    <tr
                      key={entry.submissionId}
                      className={`hover:bg-slate-50/50 transition ${
                        entry.rank <= 3 ? "bg-sky-50/5 font-semibold" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-xs font-extrabold">
                        {entry.rank === 1 ? (
                          <span className="inline-flex items-center gap-1">🥇 1</span>
                        ) : entry.rank === 2 ? (
                          <span className="inline-flex items-center gap-1">🥈 2</span>
                        ) : entry.rank === 3 ? (
                          <span className="inline-flex items-center gap-1">🥉 3</span>
                        ) : (
                          <span className="text-slate-400 pl-1">{entry.rank}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-800">{entry.projectTitle}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-650">
                        {entry.team?.name}
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-semibold text-slate-500">
                        {entry.scoreCount} reviews
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-black text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                          {entry.averageScore} / 40
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
