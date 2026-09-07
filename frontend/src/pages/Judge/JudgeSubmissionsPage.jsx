import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getSubmissions } from "../../api/submissionApi";
import { getScores, generateAiScore } from "../../api/scoreApi";
import JudgeScoreReviewModal from "./JudgeScoreReviewModal";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import { TableSkeleton } from "../../components/common/Skeleton";
import {
  Star,
  CheckCircle2,
  Clock,
  Gavel,
  Sparkles,
  ExternalLink,
  RefreshCw,
  FileCode,
  Play,
  FileText,
  AlertTriangle,
  Users,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";

const JudgeSubmissionsPage = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedScore, setSelectedScore] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(null);

  const fetchJudgeWorkspace = async () => {
    setLoading(true);
    setError("");
    try {
      const [subRes, scoreRes] = await Promise.all([
        getSubmissions(),
        getScores()
      ]);

      if (subRes.success) {
        setSubmissions(subRes.submissions || []);
      }
      if (scoreRes.success) {
        setScores(scoreRes.scores || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load judge submissions workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJudgeWorkspace();
  }, [user]);

  // Map scores by submission ID
  const scoresBySubId = new Map();
  const allScoresBySubId = new Map();

  scores.forEach((sc) => {
    const sId = (sc.submission?._id || sc.submission).toString();
    if (!allScoresBySubId.has(sId)) {
      allScoresBySubId.set(sId, []);
    }
    allScoresBySubId.get(sId).push(sc);

    // If human score by current judge, prioritize
    if ((sc.judge?._id || sc.judge) === user.id) {
      scoresBySubId.set(sId, sc);
    } else if (!scoresBySubId.has(sId)) {
      scoresBySubId.set(sId, sc);
    }
  });

  const handleOpenEvaluation = (sub) => {
    const sc = scoresBySubId.get(sub._id.toString()) || null;
    setSelectedSub(sub);
    setSelectedScore(sc);
    setModalOpen(true);
  };

  const handleGenerateAi = async (subId) => {
    setGeneratingAi(subId);
    toast.info("Generating real AI assessment with Anthropic Claude...");
    try {
      const res = await generateAiScore(subId);
      if (res.success) {
        toast.success("AI score and per-criterion rationales generated successfully");
        await fetchJudgeWorkspace();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate AI score");
    } finally {
      setGeneratingAi(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <Gavel className="w-3.5 h-3.5" />
            <span>Judge Workspace · Human-in-the-Loop Evaluation</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Submissions to Judge
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review real submission dossiers, inspect AI baseline rationales, grade rubric criteria, and record expert validations.
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          icon={RefreshCw}
          onClick={fetchJudgeWorkspace}
          loading={loading}
        >
          Refresh Submissions
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchJudgeWorkspace} />
      ) : submissions.length === 0 ? (
        <EmptyState
          title="No projects submitted"
          message="There are no project submissions available for evaluation yet."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-3.5">Project Title & Repository</th>
                  <th className="px-6 py-3.5">Hackathon Event</th>
                  <th className="px-6 py-3.5">Team</th>
                  <th className="px-6 py-3.5">Evaluation Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {submissions.map((sub) => {
                  const score = scoresBySubId.get(sub._id.toString());
                  const allSubScores = allScoresBySubId.get(sub._id.toString()) || [];
                  const humanScores = allSubScores.filter((s) => s.source === "human");
                  const isAiScored = score && score.source === "ai";
                  const isValidated = score && score.source === "human";
                  const hasSimilarityAlert = sub.similarityFlags && sub.similarityFlags.length > 0;

                  return (
                    <tr key={sub._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="text-sm font-bold text-slate-900 block">
                            {sub.title}
                          </span>
                          <p className="text-xs text-slate-600 line-clamp-1">
                            {sub.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                            {sub.githubLink && (
                              <a
                                href={sub.githubLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 font-medium"
                              >
                                <FileCode className="w-3.5 h-3.5" /> Code
                              </a>
                            )}
                            {sub.demoLink && (
                              <a
                                href={sub.demoLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 font-medium"
                              >
                                <Play className="w-3.5 h-3.5" /> Demo
                              </a>
                            )}
                            {hasSimilarityAlert && (
                              <span className="text-amber-700 font-semibold inline-flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {sub.similarityFlags.length} Similarity Alert(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                        {sub.hackathon?.title || "N/A"}
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {sub.team?.name || "N/A"}
                      </td>

                      <td className="px-6 py-4">
                        {isValidated ? (
                          <div className="space-y-0.5">
                            <StatusBadge status="human_validated" />
                            <p className="text-xs text-emerald-700 font-mono font-semibold">
                              My Score: <strong>{score.totalScore}</strong> / 40
                            </p>
                            {humanScores.length > 1 && (
                              <span className="text-xs text-slate-500 block font-mono">
                                ({humanScores.length} judges graded)
                              </span>
                            )}
                          </div>
                        ) : isAiScored ? (
                          <div className="space-y-0.5">
                            <StatusBadge status="ai_scored" />
                            <p className="text-xs text-sky-700 font-mono font-semibold">
                              AI Baseline: <strong>{score.totalScore}</strong> / 40
                            </p>
                          </div>
                        ) : (
                          <StatusBadge status="unscored" />
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant={isValidated ? "outline" : "primary"}
                            size="sm"
                            icon={Gavel}
                            onClick={() => handleOpenEvaluation(sub)}
                          >
                            {isValidated ? "Review / Edit Score" : score ? "Evaluate & Validate" : "Grade Project"}
                          </Button>

                          {!score && (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Sparkles}
                              loading={generatingAi === sub._id}
                              onClick={() => handleGenerateAi(sub._id)}
                            >
                              Run AI
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Score Review & Validation Modal */}
      {modalOpen && (
        <JudgeScoreReviewModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          submission={selectedSub}
          score={selectedScore}
          onValidated={() => fetchJudgeWorkspace()}
        />
      )}
    </div>
  );
};

export default JudgeSubmissionsPage;
