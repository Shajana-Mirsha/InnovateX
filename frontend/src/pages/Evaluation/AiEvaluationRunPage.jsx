import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  RefreshCw,
  Sliders,
  ChevronRight,
  Database,
  ShieldAlert
} from "lucide-react";
import { getHackathons, getHackathonById, batchAiEvaluate } from "../../api/hackathonApi";
import { getSubmissions } from "../../api/submissionApi";
import { getScores } from "../../api/scoreApi";
import { useSocket } from "../../context/SocketContext";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { TableSkeleton } from "../../components/common/Skeleton";
import { toast } from "sonner";

const AiEvaluationRunPage = () => {
  const { hackathonId } = useParams();
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState(hackathonId || "");
  const [hackathon, setHackathon] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningBatch, setRunningBatch] = useState(false);
  const [progressFeed, setProgressFeed] = useState({}); // { [submissionId]: { status: 'scoring'|'scored'|'failed', score } }
  const [forceReevaluate, setForceReevaluate] = useState(false);

  const { joinHackathonRoom, leaveHackathonRoom, subscribe } = useSocket();

  // Load Hackathons
  useEffect(() => {
    const fetchHackathonList = async () => {
      try {
        const res = await getHackathons();
        if (res.success) {
          setHackathons(res.hackathons || []);
          if (!selectedHackathonId && res.hackathons?.length > 0) {
            setSelectedHackathonId(res.hackathons[0]._id);
          }
        }
      } catch (err) {
        toast.error("Failed to load hackathons list");
      }
    };
    fetchHackathonList();
  }, []);

  // Load Hackathon Submissions & Scores
  const loadHackathonData = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const [hRes, subRes, scRes] = await Promise.all([
        getHackathonById(id),
        getSubmissions(),
        getScores()
      ]);

      if (hRes.success) setHackathon(hRes.hackathon);

      const allSubs = subRes.submissions || [];
      const hackSubs = allSubs.filter(
        (s) => s.hackathon?._id === id || s.hackathon === id
      );
      setSubmissions(hackSubs);

      const allScores = scRes.scores || [];
      const subIds = new Set(hackSubs.map((s) => s._id.toString()));
      const hackScores = allScores.filter((sc) =>
        sc.submission && subIds.has((sc.submission._id || sc.submission).toString())
      );
      setScores(hackScores);
    } catch (err) {
      toast.error("Failed to load hackathon submission data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      loadHackathonData(selectedHackathonId);
      joinHackathonRoom(selectedHackathonId);

      // Subscribe to real WebSocket progress events
      const unsubProgress = subscribe("ai-evaluate:progress", (payload) => {
        if (payload.hackathonId === selectedHackathonId) {
          setProgressFeed((prev) => ({
            ...prev,
            [payload.submissionId]: {
              status: payload.status,
              score: payload.score,
              error: payload.error
            }
          }));

          if (payload.status === "scored") {
            toast.success(`Scored: "${payload.title.substring(0, 30)}..."`);
          } else if (payload.status === "failed") {
            toast.error(`Evaluation error: ${payload.error || "Model failure"}`);
          }
        }
      });

      const unsubScore = subscribe("score:created", () => {
        loadHackathonData(selectedHackathonId);
      });

      return () => {
        leaveHackathonRoom(selectedHackathonId);
        unsubProgress();
        unsubScore();
      };
    }
  }, [selectedHackathonId]);

  const handleStartBatch = async () => {
    if (!selectedHackathonId) return;
    setRunningBatch(true);
    setProgressFeed({});

    toast.info("Triggered real-time batch AI assessment pipeline...");

    try {
      const res = await batchAiEvaluate(selectedHackathonId, {
        force: forceReevaluate,
        rateLimitDelayMs: 600
      });

      if (res.success) {
        toast.success(res.message);
        await loadHackathonData(selectedHackathonId);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      toast.error(`Batch AI run failed: ${errorMsg}`);
    } finally {
      setRunningBatch(false);
    }
  };

  // Map scores for quick lookup
  const scoresBySubId = new Map();
  scores.forEach((sc) => {
    const sId = (sc.submission?._id || sc.submission).toString();
    scoresBySubId.set(sId, sc);
  });

  const aiScoredCount = submissions.filter((s) => {
    const sc = scoresBySubId.get(s._id.toString());
    return sc && sc.source === "ai";
  }).length;

  const validatedCount = submissions.filter((s) => {
    const sc = scoresBySubId.get(s._id.toString());
    return sc && sc.source === "human";
  }).length;

  const unscoredCount = submissions.length - (aiScoredCount + validatedCount);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Research Module 3 · Automated Evaluation</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Batch AI Assessment Runner
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Executes multi-criteria evaluation with live README extraction and strict schema verification.
          </p>
        </div>

        {/* Hackathon Selector */}
        <div className="flex items-center gap-3">
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
            icon={RefreshCw}
            onClick={() => loadHackathonData(selectedHackathonId)}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Submissions</p>
            <p className="text-2xl font-bold text-white mt-1 font-mono">{submissions.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-sky-400 font-medium">AI Baseline Evaluated</p>
            <p className="text-2xl font-bold text-sky-300 mt-1 font-mono">{aiScoredCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-400 font-medium">Human Validated</p>
            <p className="text-2xl font-bold text-emerald-300 mt-1 font-mono">{validatedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-400 font-medium">Pending Assessment</p>
            <p className="text-2xl font-bold text-amber-300 mt-1 font-mono">{unscoredCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Trigger & Controls Card */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Batch Assessment Control</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Processes queued submissions sequentially with live rate-limit throttling and socket updates.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={forceReevaluate}
                onChange={(e) => setForceReevaluate(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-brand-500 focus:ring-brand-500"
              />
              <span>Force Re-evaluate Scored</span>
            </label>

            <Button
              variant="primary"
              size="md"
              icon={Play}
              loading={runningBatch}
              onClick={handleStartBatch}
              disabled={submissions.length === 0}
            >
              {runningBatch ? "Evaluating Submissions..." : "Run Batch AI Evaluation"}
            </Button>
          </div>
        </div>
      </div>

      {/* Live Submission Progress Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Submissions & Live Assessment Feed
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {submissions.length} total entries
          </span>
        </div>

        {loading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : submissions.length === 0 ? (
          <EmptyState
            title="No submissions found"
            message="There are currently no submissions registered for this hackathon to evaluate."
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {submissions.map((sub, idx) => {
                const liveStatus = progressFeed[sub._id.toString()]?.status;
                const liveScore = progressFeed[sub._id.toString()]?.score;
                const dbScore = scoresBySubId.get(sub._id.toString());
                const effectiveScore = liveScore || dbScore;

                return (
                  <motion.div
                    key={sub._id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`p-5 rounded-2xl glass-panel border transition-all ${
                      liveStatus === "scoring"
                        ? "border-brand-500/80 shadow-lg shadow-brand-500/10 bg-slate-900/90"
                        : "border-slate-800/80 hover:border-slate-700/80 bg-slate-900/60"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                          <h3 className="text-base font-bold text-white tracking-tight">
                            {sub.title}
                          </h3>
                          {liveStatus === "scoring" && (
                            <span className="px-2.5 py-0.5 text-3xs font-semibold rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/40 animate-pulse">
                              Scoring in progress...
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {sub.description}
                        </p>
                        <div className="flex items-center gap-4 text-3xs text-slate-400 pt-1">
                          <span>Team: <strong className="text-slate-300">{sub.team?.name || "N/A"}</strong></span>
                          {sub.githubLink && (
                            <a
                              href={sub.githubLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                            >
                              GitHub README <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right: Scores & Status */}
                      <div className="flex items-center gap-4 shrink-0">
                        {effectiveScore ? (
                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <StatusBadge
                                status={
                                  effectiveScore.source === "human"
                                    ? "human_validated"
                                    : "ai_scored"
                                }
                              />
                            </div>
                            <div className="mt-1.5 flex items-baseline gap-1 justify-end font-mono">
                              <span className="text-xl font-bold text-white">
                                {effectiveScore.totalScore}
                              </span>
                              <span className="text-xs text-slate-500">/ 40 pts</span>
                            </div>
                            {effectiveScore.confidence && (
                              <p className="text-4xs text-slate-400 mt-0.5">
                                Conf: {(effectiveScore.confidence * 100).toFixed(0)}%
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-right">
                            <StatusBadge status="unscored" />
                            <p className="text-3xs text-slate-500 mt-1 font-mono">Pending run</p>
                          </div>
                        )}

                        <Link
                          to={`/submissions/${sub._id}`}
                          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                          title="View Submission Details"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiEvaluationRunPage;
