import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  ShieldAlert,
  Users,
  CheckCircle2,
  Scale,
  BarChart3,
  Trophy,
  ArrowRight,
  RefreshCw,
  Sliders,
  ExternalLink,
  Layers,
  Clock,
  AlertTriangle,
  FileCode,
  Download,
  Info,
  ShieldCheck,
  Check,
  X
} from "lucide-react";
import { getHackathons } from "../../api/hackathonApi";
import { getPipelineIntelligence, exportResearchMetrics } from "../../api/metricsApi";
import { useSocket } from "../../context/SocketContext";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { CardSkeleton } from "../../components/common/Skeleton";
import { toast } from "sonner";

const EvaluationIntelligencePage = () => {
  const { hackathonId } = useParams();
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState(hackathonId || "");
  const [pipelineData, setPipelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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

  const { joinHackathonRoom, leaveHackathonRoom, subscribe } = useSocket();

  // Load Pipeline Intelligence Data
  const loadIntelligence = async (id, silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    try {
      const res = await getPipelineIntelligence(id);
      if (res.success) {
        setPipelineData(res.data);
      }
    } catch (err) {
      if (!silent) toast.error("Failed to load evaluation pipeline intelligence");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      loadIntelligence(selectedHackathonId);
      joinHackathonRoom(selectedHackathonId);

      const unsubScoreCreated = subscribe("score:created", () => {
        loadIntelligence(selectedHackathonId, true);
      });

      const unsubScoreValidated = subscribe("score:validated", () => {
        loadIntelligence(selectedHackathonId, true);
      });

      const unsubSimilarity = subscribe("similarity:detected", () => {
        loadIntelligence(selectedHackathonId, true);
      });

      const unsubCalibration = subscribe("calibration:report-ready", () => {
        loadIntelligence(selectedHackathonId, true);
      });

      return () => {
        leaveHackathonRoom(selectedHackathonId);
        unsubScoreCreated();
        unsubScoreValidated();
        unsubSimilarity();
        unsubCalibration();
      };
    }
  }, [selectedHackathonId]);

  const handleExportJson = async () => {
    if (!selectedHackathonId) return;
    setExporting(true);
    try {
      const res = await exportResearchMetrics(selectedHackathonId);
      if (res.success) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], {
          type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `innovatex_evaluation_intelligence_${selectedHackathonId}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Research intelligence export downloaded successfully");
      }
    } catch (err) {
      toast.error("Failed to export research metrics");
    } finally {
      setExporting(false);
    }
  };

  const p = pipelineData?.pipeline;
  const h = pipelineData?.hackathon;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <Brain className="w-3.5 h-3.5" />
            <span>Organizer Control Center · Evaluation Intelligence</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Evaluation Intelligence & Pipeline State
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry across all 8 evaluation stages, AI model transparency, and multi-judge consensus.
          </p>
        </div>

        {/* Hackathon Selector & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedHackathonId}
            onChange={(e) => setSelectedHackathonId(e.target.value)}
            className="px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none shadow-sm"
          >
            {hackathons.map((hack) => (
              <option key={hack._id} value={hack._id}>
                {hack.title}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="md"
            icon={Download}
            onClick={handleExportJson}
            loading={exporting}
            disabled={!selectedHackathonId}
          >
            Export Pipeline JSON
          </Button>

          <Button
            variant="ghost"
            size="md"
            icon={RefreshCw}
            onClick={() => loadIntelligence(selectedHackathonId)}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading || !pipelineData ? (
        <CardSkeleton count={4} />
      ) : (
        <>
          {/* AI MODEL TRANSPARENCY & REPRODUCIBILITY BANNER */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  AI Model Transparency & Reproducibility Standard
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                IEEE Empirical Integrity
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block uppercase font-medium">Model Provider</span>
                <strong className="text-slate-900 text-sm font-semibold capitalize">{h.modelTransparency.provider}</strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block uppercase font-medium">LLM Engine</span>
                <strong className="text-sky-700 text-sm font-semibold truncate block">{h.modelTransparency.model}</strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block uppercase font-medium">Prompt Version</span>
                <strong className="text-emerald-700 text-sm font-semibold">v{h.modelTransparency.promptVersion}</strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block uppercase font-medium">Similarity Embedder</span>
                <strong className="text-amber-700 text-sm font-semibold">Voyage-3 Cosine</strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block uppercase font-medium">Rubric Criteria</span>
                <strong className="text-slate-900 text-sm font-semibold">{h.criteriaCount} Dimensions</strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block uppercase font-medium">Scoring Policy</span>
                <strong className="text-brand-700 text-sm font-semibold">Weighted Backend</strong>
              </div>
            </div>

            <p className="text-xs text-slate-500 italic">
              * The backend strictly executes weighted scoring without manual frontend overrides. All human adjustments generate immutable calibration delta records.
            </p>
          </div>

          {/* 8-STAGE EVALUATION PIPELINE STATE CARDS */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-600" />
              Complete 8-Stage Evaluation Lifecycle Status
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stage 1: Submissions */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-600 uppercase">Stage 1</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                    {p.stage1_submissions.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Project Submissions</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Submitted (Ready):</span>
                    <strong className="text-slate-900 font-semibold">{p.stage1_submissions.submitted}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Drafts:</span>
                    <strong className="text-slate-500 font-semibold">{p.stage1_submissions.draft}</strong>
                  </div>
                </div>
                <Link
                  to="/submissions"
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 pt-1"
                >
                  View Submissions <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Stage 2: AI Evaluation */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-600 uppercase">Stage 2</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      p.stage2_aiEvaluation.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-sky-50 text-sky-700 border border-sky-200"
                    }`}
                  >
                    {p.stage2_aiEvaluation.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">AI Evaluation Run</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Scored by LLM:</span>
                    <strong className="text-sky-700 font-semibold">{p.stage2_aiEvaluation.completed}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Pending Run:</span>
                    <strong className="text-amber-700 font-semibold">{p.stage2_aiEvaluation.pending}</strong>
                  </div>
                  {p.stage2_aiEvaluation.averageConfidence && (
                    <div className="flex justify-between text-slate-600">
                      <span>Avg Confidence:</span>
                      <strong className="text-slate-900 font-semibold">
                        {(p.stage2_aiEvaluation.averageConfidence * 100).toFixed(0)}%
                      </strong>
                    </div>
                  )}
                </div>
                <Link
                  to={`/manage/ai-evaluation/${selectedHackathonId}`}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 pt-1"
                >
                  Launch Batch Runner <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Stage 3: Similarity Screening */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 uppercase">Stage 3</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      p.stage3_similarityScreening.unresolvedFlagsCount === 0
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {p.stage3_similarityScreening.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Similarity Screening</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Flagged Pairs:</span>
                    <strong className="text-amber-700 font-semibold">{p.stage3_similarityScreening.flaggedPairsCount}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Annotated Labels:</span>
                    <strong className="text-slate-900 font-semibold">{p.stage3_similarityScreening.reviewedLabelsCount}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Confirmed Duplicates:</span>
                    <strong className="text-rose-600 font-semibold">{p.stage3_similarityScreening.confirmedDuplicateCount}</strong>
                  </div>
                </div>
                <Link
                  to={`/manage/similarity/${selectedHackathonId}`}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 pt-1"
                >
                  Review Similarity Pairs <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Stage 4: Judge Validation */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 uppercase">Stage 4</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {p.stage4_judgeValidation.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Judge Human Validation</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Validated Projects:</span>
                    <strong className="text-emerald-700 font-semibold">{p.stage4_judgeValidation.completed}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Accepted Unchanged:</span>
                    <strong className="text-slate-900 font-semibold">{p.stage4_judgeValidation.actions.acceptedUnchanged}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Human Modified:</span>
                    <strong className="text-brand-700 font-semibold">{p.stage4_judgeValidation.actions.modified}</strong>
                  </div>
                </div>
                <Link
                  to="/judge/submissions"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 pt-1"
                >
                  Judge Workspace <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Second Row: Stages 5 to 7 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Stage 5: Expert Reference & Consensus */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 uppercase">Stage 5</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      p.stage5_expertReferenceAndAgreement.highDisagreementCount > 0
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    }`}
                  >
                    {p.stage5_expertReferenceAndAgreement.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Judge Consensus & Agreement</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Multi-Judge Submissions:</span>
                    <strong className="text-slate-900 font-semibold">{p.stage5_expertReferenceAndAgreement.multiJudgeEvaluatedCount}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Concordant (σ ≤ 2.0):</span>
                    <strong className="text-emerald-700 font-semibold">{p.stage5_expertReferenceAndAgreement.concordantCount}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>High Disagreement (σ &gt; 2.0):</span>
                    <strong
                      className={
                        p.stage5_expertReferenceAndAgreement.highDisagreementCount > 0
                          ? "text-rose-600 font-bold"
                          : "text-slate-500"
                      }
                    >
                      {p.stage5_expertReferenceAndAgreement.highDisagreementCount}
                    </strong>
                  </div>
                </div>
                <Link
                  to="/leaderboard"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 pt-1"
                >
                  View Multi-Arm Matrix <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Stage 6: Calibration Samples */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-600 uppercase">Stage 6</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      p.stage6_calibration.isSufficient
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {p.stage6_calibration.isSufficient ? "Sufficient (N≥3)" : "N < 3"}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Recalibration Dataset</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Calibration Samples (N):</span>
                    <strong className="text-slate-900 font-semibold">{p.stage6_calibration.sampleCount}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Mean Correction Delta:</span>
                    <strong className="text-brand-700 font-semibold">{p.stage6_calibration.meanDelta} pts</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Held-Out Split:</span>
                    <strong className="text-emerald-700 font-semibold">70 / 30 Partition</strong>
                  </div>
                </div>
                <Link
                  to={`/manage/research-metrics/${selectedHackathonId}`}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 pt-1"
                >
                  Calibration Analytics <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Stage 7: Final Standings */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 uppercase">Stage 7</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      p.stage7_finalRanking.isCompleted
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {p.stage7_finalRanking.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Standings & Winners</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Declared Podium Placements:</span>
                    <strong className="text-emerald-700 font-semibold">{p.stage7_finalRanking.declaredResultsCount}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Official Standings:</span>
                    <strong className="text-slate-900 font-semibold">Weighted Rankings</strong>
                  </div>
                </div>
                <Link
                  to="/manage/results"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 pt-1"
                >
                  Manage Results & Winners <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* DISAGREEMENT REVIEW CALLOUT (IF DETECTED) */}
          {p.stage5_expertReferenceAndAgreement.disagreementAlerts.length > 0 && (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-amber-800">
                  Evaluator Disagreement Review Queue (Organizer Attention Required)
                </h3>
              </div>
              <p className="text-xs text-amber-700">
                The following submissions exhibited significant scoring divergence among independent judges (σ &gt; 2.0 or Range ≥ 4.0).
                Judges' original scores remain unaltered; please inspect the individual scorecards before declaring official winners.
              </p>

              <div className="space-y-3">
                {p.stage5_expertReferenceAndAgreement.disagreementAlerts.map((alert) => (
                  <div
                    key={alert.submissionId}
                    className="p-4 rounded-xl bg-white border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-sm"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900">{alert.title}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Judges: {alert.judgeCount} • Standard Deviation (σ): <strong className="text-amber-700 font-semibold">{alert.stdDev}</strong> • Range: {alert.scoreRange} pts
                      </p>
                    </div>

                    <Link to={`/submissions/${alert.submissionId}`}>
                      <Button variant="outline" size="sm">
                        Inspect Scorecards
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EvaluationIntelligencePage;
