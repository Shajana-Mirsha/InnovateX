import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  GitCompare,
  Sliders,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  FileText,
  Tag
} from "lucide-react";
import { getHackathons, getHackathonById, detectHackathonSimilarity } from "../../api/hackathonApi";
import { getSimilarityLabels, createSimilarityLabel } from "../../api/similarityApi";
import { useSocket } from "../../context/SocketContext";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { CardSkeleton } from "../../components/common/Skeleton";
import { toast } from "sonner";

const SimilarityReviewPage = () => {
  const { hackathonId } = useParams();
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState(hackathonId || "");
  const [hackathon, setHackathon] = useState(null);
  const [threshold, setThreshold] = useState(0.8);
  const [flaggedPairs, setFlaggedPairs] = useState([]);
  const [groundTruthLabels, setGroundTruthLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [submittingLabel, setSubmittingLabel] = useState(null); // pair key being labeled

  const { joinHackathonRoom, leaveHackathonRoom, subscribe } = useSocket();

  // Load Hackathon List
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

  // Load Data
  const loadSimilarityData = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const [hRes, labelsRes] = await Promise.all([
        getHackathonById(id),
        getSimilarityLabels(id)
      ]);

      if (hRes.success) setHackathon(hRes.hackathon);
      if (labelsRes.success) setGroundTruthLabels(labelsRes.labels || []);

      // Extract currently flagged pairs from hackathon submissions if already computed
      const pairs = [];
      const seen = new Set();

      (hRes.hackathon?.submissions || []).forEach((sub) => {
        (sub.similarityFlags || []).forEach((flag) => {
          if (flag.score >= threshold) {
            const idA = sub._id.toString();
            const idB = (flag.submission?._id || flag.submission).toString();
            const key = idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;

            if (!seen.has(key)) {
              seen.add(key);
              pairs.push({
                submissionA: sub,
                submissionB: flag.submission,
                similarityScore: flag.score,
                model: flag.model
              });
            }
          }
        });
      });

      setFlaggedPairs(pairs);
    } catch (err) {
      toast.error("Failed to load similarity data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      loadSimilarityData(selectedHackathonId);
      joinHackathonRoom(selectedHackathonId);

      const unsubSim = subscribe("similarity:detected", (payload) => {
        if (payload.hackathonId === selectedHackathonId) {
          setFlaggedPairs(payload.result.flaggedPairs || []);
          toast.success(`Similarity detection completed: ${payload.result.flaggedPairs?.length || 0} flagged pairs`);
        }
      });

      return () => {
        leaveHackathonRoom(selectedHackathonId);
        unsubSim();
      };
    }
  }, [selectedHackathonId]);

  const handleRunDetection = async () => {
    if (!selectedHackathonId) return;
    setDetecting(true);
    toast.info("Computing semantic embeddings and cosine similarity matrix...");

    try {
      const res = await detectHackathonSimilarity(selectedHackathonId, threshold);
      if (res.success) {
        setFlaggedPairs(res.flaggedPairs || []);
        toast.success(`Detected ${res.count} pair(s) with similarity >= ${(threshold * 100).toFixed(0)}%`);
        await loadSimilarityData(selectedHackathonId);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      toast.error(`Similarity run failed: ${errorMsg}`);
    } finally {
      setDetecting(false);
    }
  };

  const handleRecordLabel = async (pair, isDuplicate) => {
    const idA = (pair.submissionA?._id || pair.submissionA).toString();
    const idB = (pair.submissionB?._id || pair.submissionB).toString();
    const pairKey = idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;

    setSubmittingLabel(pairKey);
    try {
      const payload = {
        hackathonId: selectedHackathonId,
        submissionA: idA,
        submissionB: idB,
        similarityScore: pair.similarityScore,
        isDuplicate,
        notes: `Labeled via Similarity Review Dashboard on ${new Date().toLocaleDateString()}`
      };

      const res = await createSimilarityLabel(payload);
      if (res.success) {
        toast.success(
          isDuplicate
            ? "Marked as Confirmed Duplicate in Ground Truth dataset"
            : "Marked as Disjoint/Not Duplicate in Ground Truth dataset"
        );
        const updatedLabels = await getSimilarityLabels(selectedHackathonId);
        if (updatedLabels.success) setGroundTruthLabels(updatedLabels.labels || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save ground truth label");
    } finally {
      setSubmittingLabel(null);
    }
  };

  // Build ground truth lookup map
  const labelMap = new Map();
  groundTruthLabels.forEach((l) => {
    const idA = (l.submissionA?._id || l.submissionA).toString();
    const idB = (l.submissionB?._id || l.submissionB).toString();
    const key = idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
    labelMap.set(key, l);
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Research Module 4 · Duplicate & Semantic Overlap</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Semantic Similarity & Plagiarism Review
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pairwise vector cosine similarity over Voyage-3/OpenAI embeddings for collusion and duplicate detection.
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
            onClick={() => loadSimilarityData(selectedHackathonId)}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Detection Controls Panel */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1 flex-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-400" />
              Similarity Threshold Configuration
            </h3>
            <p className="text-xs text-slate-400">
              Flags any submission pair exceeding the cosine threshold for manual judge inspection and paper evaluation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-3 w-full sm:w-64">
              <span className="text-xs font-mono text-slate-400">0.50</span>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/30">
                {(threshold * 100).toFixed(0)}%
              </span>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={GitCompare}
              loading={detecting}
              onClick={handleRunDetection}
            >
              Run Similarity Detection
            </Button>
          </div>
        </div>
      </div>

      {/* Flagged Pairs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Flagged High-Overlap Pairs
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {flaggedPairs.length} flagged
            </span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {groundTruthLabels.length} ground-truth annotated
          </span>
        </div>

        {loading ? (
          <CardSkeleton count={2} />
        ) : flaggedPairs.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No high-overlap duplicates detected"
            message={`No submission pairs exceeded the ${(threshold * 100).toFixed(0)}% cosine similarity threshold.`}
            actionButton={
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunDetection}
                icon={GitCompare}
              >
                Scan Submissions Now
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {flaggedPairs.map((pair, idx) => {
                const subA = pair.submissionA;
                const subB = pair.submissionB;
                const idA = (subA?._id || subA).toString();
                const idB = (subB?._id || subB).toString();
                const pairKey = idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
                const label = labelMap.get(pairKey);

                return (
                  <motion.div
                    key={pairKey}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 rounded-2xl glass-panel border border-amber-500/30 bg-slate-900/70 shadow-lg shadow-amber-500/5 space-y-6"
                  >
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          Pair #{idx + 1}
                        </span>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold animate-pulse-subtle">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Cosine Similarity: {(pair.similarityScore * 100).toFixed(1)}%
                        </div>
                        {pair.model && (
                          <span className="text-4xs font-mono text-slate-500">
                            Model: {pair.model}
                          </span>
                        )}
                      </div>

                      {/* Ground Truth Status */}
                      <div className="flex items-center gap-2">
                        {label ? (
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                              label.isDuplicate
                                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            }`}
                          >
                            Ground Truth: {label.isDuplicate ? "Confirmed Duplicate" : "Distinct / Not Duplicate"}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            Unlabeled Pair
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Side-by-Side Comparison Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Submission A */}
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-3xs font-semibold text-sky-400 uppercase tracking-wider">
                            Submission A
                          </span>
                          <span className="text-3xs text-slate-400">
                            Team: <strong className="text-slate-300">{subA.team?.name || subA.team || "N/A"}</strong>
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white tracking-tight">{subA.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed">
                          {subA.description}
                        </p>
                        {subA.githubLink && (
                          <a
                            href={subA.githubLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-3xs text-sky-400 hover:text-sky-300 pt-1"
                          >
                            View Repository <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Submission B */}
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-3xs font-semibold text-indigo-400 uppercase tracking-wider">
                            Submission B
                          </span>
                          <span className="text-3xs text-slate-400">
                            Team: <strong className="text-slate-300">{subB.team?.name || subB.team || "N/A"}</strong>
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white tracking-tight">{subB.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed">
                          {subB.description}
                        </p>
                        {subB.githubLink && (
                          <a
                            href={subB.githubLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-3xs text-indigo-400 hover:text-indigo-300 pt-1"
                          >
                            View Repository <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Human Ground Truth Action Bar */}
                    <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-brand-400" />
                        Label ground-truth for research validation dataset:
                      </p>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="danger"
                          size="sm"
                          icon={CheckCircle2}
                          loading={submittingLabel === pairKey}
                          onClick={() => handleRecordLabel(pair, true)}
                        >
                          Confirm Duplicate
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          icon={XCircle}
                          loading={submittingLabel === pairKey}
                          onClick={() => handleRecordLabel(pair, false)}
                        >
                          Mark Distinct
                        </Button>
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

export default SimilarityReviewPage;
