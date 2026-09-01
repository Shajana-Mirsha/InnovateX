import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getLeaderboard } from "../../api/leaderboardApi";
import { getHackathons } from "../../api/hackathonApi";
import ThreeArmComparisonModal from "./ThreeArmComparisonModal";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { TableSkeleton } from "../../components/common/Skeleton";
import {
  Trophy,
  Award,
  Star,
  GitFork,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Sliders
} from "lucide-react";
import { toast } from "sonner";

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [threeArmOpen, setThreeArmOpen] = useState(false);

  const { joinHackathonRoom, leaveHackathonRoom, subscribe } = useSocket();

  useEffect(() => {
    const fetchHackathonsList = async () => {
      setLoading(true);
      try {
        const data = await getHackathons();
        if (data.success) {
          const list = data.hackathons || [];
          setHackathons(list);
          if (list.length > 0) {
            setSelectedHackathonId((prev) => prev || list[0]._id);
          }
        }
      } catch (err) {
        toast.error("Failed to load hackathons list.");
      } finally {
        setLoading(false);
      }
    };
    fetchHackathonsList();
  }, []);

  const fetchLeaderboardData = async (hId, silent = false) => {
    const id = hId || selectedHackathonId;
    if (!id) return;
    if (!silent) setLeaderboardLoading(true);

    try {
      const data = await getLeaderboard(id);
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      if (!silent) toast.error(err.response?.data?.message || "Failed to load leaderboard.");
      setLeaderboard([]);
    } finally {
      if (!silent) setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      fetchLeaderboardData(selectedHackathonId);
      joinHackathonRoom(selectedHackathonId);

      const unsubScoreCreated = subscribe("score:created", () => {
        toast.info("Leaderboard updated with newly generated score");
        fetchLeaderboardData(selectedHackathonId, true);
      });

      const unsubScoreValidated = subscribe("score:validated", () => {
        toast.info("Leaderboard recalculated after human judge validation");
        fetchLeaderboardData(selectedHackathonId, true);
      });

      return () => {
        leaveHackathonRoom(selectedHackathonId);
        unsubScoreCreated();
        unsubScoreValidated();
      };
    }
  }, [selectedHackathonId]);

  const selectedHackathon = hackathons.find((h) => h._id === selectedHackathonId);

  const getTeamName = (team) => {
    if (!team) return "N/A";
    if (typeof team === "string") return team;
    return team.name || "N/A";
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>Research Module 6 · Real-Time Weighted Ranking</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Live Hackathon Standings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Dynamic weighted evaluation reflecting customized criteria weights and live human-validation priority.
          </p>
        </div>

        {/* Hackathon Selector & Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedHackathonId}
            onChange={(e) => setSelectedHackathonId(e.target.value)}
            className="px-3.5 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-brand-500 focus:outline-none"
          >
            {hackathons.map((h) => (
              <option key={h._id} value={h._id}>
                {h.title}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="md"
            icon={GitFork}
            onClick={() => setThreeArmOpen(true)}
            disabled={!selectedHackathonId || leaderboard.length === 0}
          >
            Three-Arm Matrix
          </Button>

          <Button
            variant="ghost"
            size="md"
            icon={RefreshCw}
            onClick={() => fetchLeaderboardData(selectedHackathonId)}
            loading={leaderboardLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Podium Top 3 */}
      {leaderboard.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end max-w-4xl mx-auto pt-4 pb-2">
          {/* 2nd Place */}
          {leaderboard.length > 1 && leaderboard[1] && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="order-2 sm:order-1 p-6 glass-panel border border-slate-800 rounded-3xl text-center flex flex-col items-center justify-center relative overflow-hidden"
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm mb-3">
                🥈 2
              </div>
              <h4 className="text-sm font-bold text-white line-clamp-1">{leaderboard[1].projectTitle}</h4>
              <p className="text-3xs text-slate-400 mt-1 uppercase font-mono">Team: {getTeamName(leaderboard[1].team)}</p>
              <div className="mt-3 flex items-baseline gap-1 font-mono">
                <span className="text-lg font-extrabold text-brand-400">{leaderboard[1].weightedScore}</span>
                <span className="text-4xs text-slate-500">weighted pts</span>
              </div>
            </motion.div>
          )}

          {/* 1st Place */}
          {leaderboard.length > 0 && leaderboard[0] && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="order-1 sm:order-2 p-8 glass-panel border border-amber-500/40 bg-slate-900/90 rounded-3xl text-center flex flex-col items-center justify-center relative overflow-hidden shadow-xl shadow-amber-500/5 ring-1 ring-amber-500/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 flex items-center justify-center font-bold text-base mb-3 animate-pulse-subtle">
                🥇 1
              </div>
              <h4 className="text-base font-bold text-white line-clamp-1">{leaderboard[0].projectTitle}</h4>
              <p className="text-3xs text-amber-300 mt-1 uppercase font-mono">Team: {getTeamName(leaderboard[0].team)}</p>
              <div className="mt-3 flex items-baseline gap-1 font-mono">
                <span className="text-2xl font-extrabold text-amber-400">{leaderboard[0].weightedScore}</span>
                <span className="text-4xs text-slate-500">weighted pts</span>
              </div>
            </motion.div>
          )}

          {/* 3rd Place */}
          {leaderboard.length > 2 && leaderboard[2] && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="order-3 p-6 glass-panel border border-slate-800 rounded-3xl text-center flex flex-col items-center justify-center relative overflow-hidden"
            >
              <div className="w-10 h-10 rounded-2xl bg-orange-950/40 border border-orange-700/50 text-orange-400 flex items-center justify-center font-bold text-sm mb-3">
                🥉 3
              </div>
              <h4 className="text-sm font-bold text-white line-clamp-1">{leaderboard[2].projectTitle}</h4>
              <p className="text-3xs text-slate-400 mt-1 uppercase font-mono">Team: {getTeamName(leaderboard[2].team)}</p>
              <div className="mt-3 flex items-baseline gap-1 font-mono">
                <span className="text-lg font-extrabold text-brand-400">{leaderboard[2].weightedScore}</span>
                <span className="text-4xs text-slate-500">weighted pts</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Standings Table with Animated Layout */}
      {leaderboardLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : leaderboard.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No Standings Calculated Yet"
          message="There are no evaluated submissions recorded for this competition yet."
        />
      ) : (
        <div className="glass-panel border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-4xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Project Title</th>
                  <th className="px-6 py-4">Team</th>
                  <th className="px-6 py-4">Score Type</th>
                  <th className="px-6 py-4">Similarity Flags</th>
                  <th className="px-6 py-4 text-right">Weighted Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <AnimatePresence>
                  {leaderboard.map((entry) => (
                    <motion.tr
                      key={entry.submissionId || entry.rank}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className={`hover:bg-slate-800/30 transition ${
                        entry.rank === 1
                          ? "bg-amber-500/5"
                          : entry.rank <= 3
                          ? "bg-slate-800/20"
                          : ""
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-sm text-white">
                          #{entry.rank}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-white block">
                          {entry.projectTitle}
                        </span>
                      </td>

                      {/* Team */}
                      <td className="px-6 py-4 text-xs font-medium text-slate-300">
                        {getTeamName(entry.team)}
                      </td>

                      {/* Score Type */}
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={entry.validated ? "human_validated" : entry.weightedScore > 0 ? "ai_scored" : "unscored"}
                        />
                      </td>

                      {/* Similarity Flags */}
                      <td className="px-6 py-4">
                        {entry.similarityFlags && entry.similarityFlags.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-3xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            {entry.similarityFlags.length} Overlap(s)
                          </span>
                        ) : (
                          <span className="text-3xs text-slate-600 font-mono">None</span>
                        )}
                      </td>

                      {/* Weighted Score */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-base font-bold font-mono text-brand-300">
                            {entry.weightedScore}
                          </span>
                          <span className="text-4xs text-slate-500 font-mono">
                            Raw: {entry.averageScore} pts
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Three-Arm Comparison Modal */}
      {threeArmOpen && (
        <ThreeArmComparisonModal
          isOpen={threeArmOpen}
          onClose={() => setThreeArmOpen(false)}
          hackathonId={selectedHackathonId}
          hackathonTitle={selectedHackathon?.title || "Hackathon Standings"}
        />
      )}
    </div>
  );
};

export default LeaderboardPage;
