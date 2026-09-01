import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  Edit3,
  XCircle,
  Eye,
  Sparkles,
  UserCheck,
  Scale,
  MessageSquare,
  History,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  FileCode,
  Play,
  FileText,
  Sliders,
  Users,
  ShieldAlert,
  HelpCircle,
  Clock,
  Layers,
  Award
} from "lucide-react";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import { validateScore, createScore, getExpertReferenceScore } from "../../api/scoreApi";
import { toast } from "sonner";

const JudgeScoreReviewModal = ({ isOpen, onClose, submission, score, onValidated }) => {
  const [editedCriteria, setEditedCriteria] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [notes, setNotes] = useState("");
  const [technicalObservations, setTechnicalObservations] = useState("");
  const [overallComments, setOverallComments] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [similarityDecision, setSimilarityDecision] = useState("none");
  const [isEditing, setIsEditing] = useState(false);
  const [isIndependentScoring, setIsIndependentScoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviewStartTime] = useState(new Date().toISOString());

  // Multi-judge expert reference state
  const [expertRefData, setExpertRefData] = useState(null);
  const [expertRefLoading, setExpertRefLoading] = useState(false);

  // Active rubric from hackathon
  const hackathonCriteria =
    submission?.hackathon?.criteria && submission.hackathon.criteria.length > 0
      ? submission.hackathon.criteria
      : [
          { name: "innovation", description: "Originality, novelty, and creative problem-solving approach.", weight: 1, maxScore: 10 },
          { name: "technicalImplementation", description: "Architecture soundness, engineering complexity, repository feasibility, and technical execution.", weight: 1, maxScore: 10 },
          { name: "impact", description: "Real-world value, scalability, market applicability, and practical problem resolution.", weight: 1, maxScore: 10 },
          { name: "presentation", description: "Documentation clarity, pitch coherence, and communication of the project value.", weight: 1, maxScore: 10 }
        ];

  useEffect(() => {
    if (isOpen && submission) {
      // Fetch expert reference and multi-judge stats
      const fetchExpertRef = async () => {
        setExpertRefLoading(true);
        try {
          const res = await getExpertReferenceScore(submission._id);
          if (res.success) {
            setExpertRefData(res);
          }
        } catch (err) {
          console.warn("Could not fetch expert reference data:", err);
        } finally {
          setExpertRefLoading(false);
        }
      };
      fetchExpertRef();

      if (score) {
        // Initialize from existing score (AI or prior human)
        const criteriaList = score.criterionScores && score.criterionScores.length > 0
          ? score.criterionScores.map((c) => ({
              criterion: c.criterion,
              score: c.score,
              rationale: c.rationale || ""
            }))
          : hackathonCriteria.map((hc) => ({
              criterion: hc.name,
              score: score[hc.name] || 8,
              rationale: score.criterionRationale?.[hc.name] || ""
            }));

        setEditedCriteria(criteriaList);
        setFeedback(score.feedback || "");
        setOverallComments(score.overallComments || score.feedback || "");
        setTechnicalObservations(score.technicalObservations || "");
        setStrengths(Array.isArray(score.strengths) ? score.strengths.join(", ") : score.strengths || "");
        setWeaknesses(Array.isArray(score.weaknesses) ? score.weaknesses.join(", ") : score.weaknesses || "");
        setSuggestions(Array.isArray(score.suggestions) ? score.suggestions.join(", ") : score.suggestions || "");
        setSimilarityDecision(score.similarityDecision || "none");
        setNotes("");
        setIsEditing(false);
        setIsIndependentScoring(false);

        // Quietly log view action for audit trail
        validateScore(score._id, { action: "view", notes: "Judge opened submission evaluation workspace" }).catch(() => {});
      } else {
        // No score exists yet: independent scoring mode
        const defaultList = hackathonCriteria.map((hc) => ({
          criterion: hc.name,
          score: 8,
          rationale: ""
        }));
        setEditedCriteria(defaultList);
        setFeedback("");
        setOverallComments("");
        setTechnicalObservations("");
        setStrengths("");
        setWeaknesses("");
        setSuggestions("");
        setSimilarityDecision("none");
        setIsEditing(true);
        setIsIndependentScoring(true);
      }
    }
  }, [score, submission, isOpen]);

  if (!isOpen || !submission) return null;

  // Compute live edited total
  const liveTotal = Math.round(
    editedCriteria.reduce((sum, item) => sum + (Number(item.score) || 0), 0) * 100
  ) / 100;

  // Compute backend weighted score using organizer weights
  const criteriaWeightMap = new Map();
  hackathonCriteria.forEach((c) => criteriaWeightMap.set(c.name, c.weight || 1));

  let liveWeightedScore = 0;
  editedCriteria.forEach((item) => {
    const w = criteriaWeightMap.get(item.criterion) || 1;
    liveWeightedScore += (Number(item.score) || 0) * w;
  });
  liveWeightedScore = Math.round(liveWeightedScore * 100) / 100;

  // Compute delta between original AI and live edit
  const originalAiTotal = score?.previousAiScore?.totalScore || (score?.source === "ai" ? score.totalScore : null);
  const totalDelta = originalAiTotal !== null ? Math.round((liveTotal - originalAiTotal) * 100) / 100 : null;

  // Handle Accept Unchanged
  const handleAcceptUnchanged = async () => {
    if (!score) return;
    setLoading(true);
    try {
      const res = await validateScore(score._id, {
        action: "accept_unchanged",
        notes: notes || "Judge accepted AI evaluation without adjustments",
        judgeReviewStartedAt: reviewStartTime,
        technicalObservations,
        overallComments: overallComments || feedback,
        strengths: strengths ? strengths.split(",").map((s) => s.trim()).filter(Boolean) : [],
        weaknesses: weaknesses ? weaknesses.split(",").map((s) => s.trim()).filter(Boolean) : [],
        suggestions: suggestions ? suggestions.split(",").map((s) => s.trim()).filter(Boolean) : [],
        similarityDecision
      });

      if (res.success) {
        toast.success("AI score accepted and validated without changes");
        if (onValidated) onValidated(res.score);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to validate score");
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Edit / Independent Scoring
  const handleSaveEvaluation = async () => {
    setLoading(true);
    try {
      const payload = {
        criterionScores: editedCriteria.map((c) => ({
          criterion: c.criterion,
          score: Number(c.score),
          rationale: c.rationale
        })),
        feedback: overallComments || feedback,
        notes: notes || "Judge submitted expert evaluation",
        technicalObservations,
        overallComments: overallComments || feedback,
        strengths: strengths ? strengths.split(",").map((s) => s.trim()).filter(Boolean) : [],
        weaknesses: weaknesses ? weaknesses.split(",").map((s) => s.trim()).filter(Boolean) : [],
        suggestions: suggestions ? suggestions.split(",").map((s) => s.trim()).filter(Boolean) : [],
        similarityDecision,
        judgeReviewStartedAt: reviewStartTime
      };

      let res;
      if (score) {
        payload.action = "edit";
        res = await validateScore(score._id, payload);
      } else {
        payload.submissionId = submission._id;
        res = await createScore(payload);
      }

      if (res.success) {
        toast.success(
          score
            ? "Human-validated score and calibration deltas saved successfully"
            : "Independent judge evaluation submitted successfully"
        );
        if (onValidated) onValidated(res.score);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save evaluation");
    } finally {
      setLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!score) return;
    if (!window.confirm("Are you sure you want to mark this score as rejected?")) return;
    setLoading(true);
    try {
      const res = await validateScore(score._id, {
        action: "reject",
        notes: notes || "Score rejected by human judge"
      });

      if (res.success) {
        toast.warning("Score marked as rejected");
        if (onValidated) onValidated(null);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject score");
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (idx, newScore) => {
    const updated = [...editedCriteria];
    updated[idx] = { ...updated[idx], score: parseFloat(newScore) || 0 };
    setEditedCriteria(updated);
  };

  const handleRationaleChange = (idx, newRat) => {
    const updated = [...editedCriteria];
    updated[idx] = { ...updated[idx], rationale: newRat };
    setEditedCriteria(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="w-full max-w-5xl glass-panel bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/90">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {score ? (
                <StatusBadge
                  status={score.source === "human" ? "human_validated" : "ai_scored"}
                />
              ) : (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Independent Grading Mode
                </span>
              )}
              {score?.model && (
                <span className="text-3xs font-mono text-slate-400">
                  AI Model: {score.model} (v{score.promptVersion || "1.0.0"})
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{submission.title}</h2>
            <p className="text-xs text-slate-400">
              Team: <strong className="text-slate-300">{submission.team?.name || "N/A"}</strong> • Event:{" "}
              <strong className="text-slate-300">{submission.hackathon?.title || "Hackathon"}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Judge & Disagreement Banner */}
        {expertRefData && expertRefData.expertReferenceScore && expertRefData.expertReferenceScore.sampleCount > 0 && (
          <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-4">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-400" />
                Judges Graded: <strong>{expertRefData.expertReferenceScore.sampleCount}</strong>
              </span>
              <span className="text-slate-400">
                Expert Ref Mean: <strong className="text-emerald-400">{expertRefData.expertReferenceScore.meanTotal}</strong> pts
              </span>
              <span className="text-slate-400">
                Std Dev (σ): <strong>{expertRefData.expertReferenceScore.stdDev}</strong>
              </span>
            </div>

            {expertRefData.disagreement?.hasDisagreement && (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>HIGH EVALUATOR DISAGREEMENT (σ &gt; 2.0)</span>
              </div>
            )}
          </div>
        )}

        {/* Score Comparison & Actions Banner */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {originalAiTotal !== null && (
              <div>
                <p className="text-4xs uppercase tracking-wider text-sky-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Baseline AI Total
                </p>
                <p className="text-xl font-bold text-sky-400 font-mono">
                  {originalAiTotal} <span className="text-xs text-slate-500 font-sans font-normal">pts</span>
                </p>
              </div>
            )}

            {(isEditing || isIndependentScoring) && (
              <>
                {originalAiTotal !== null && <span className="text-slate-600 text-lg font-bold">→</span>}
                <div>
                  <p className="text-4xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Validated Judge Total
                  </p>
                  <p className="text-xl font-bold text-emerald-400 font-mono">
                    {liveTotal} <span className="text-xs text-slate-500 font-sans font-normal">pts</span>
                  </p>
                </div>

                <div>
                  <p className="text-4xs uppercase tracking-wider text-brand-400 font-semibold flex items-center gap-1">
                    <Scale className="w-3 h-3" /> Weighted Score
                  </p>
                  <p className="text-xl font-bold text-brand-300 font-mono">
                    {liveWeightedScore} <span className="text-xs text-slate-500 font-sans font-normal">pts</span>
                  </p>
                </div>

                {totalDelta !== null && totalDelta !== 0 && (
                  <div
                    className={`px-3 py-1 rounded-full font-mono text-xs font-bold border ${
                      totalDelta > 0
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                    }`}
                  >
                    Δ {totalDelta > 0 ? `+${totalDelta}` : totalDelta} pts
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && score && (
              <Button
                variant="outline"
                size="sm"
                icon={Edit3}
                onClick={() => setIsEditing(true)}
              >
                Modify & Calibrate Score
              </Button>
            )}
            {isEditing && !isIndependentScoring && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel Editing
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable Content Workspace */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Section 1: Complete Submission Information */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-400" />
                Project Submission Dossier
              </h3>
              <div className="flex items-center gap-3 text-xs">
                {submission.githubLink && (
                  <a
                    href={submission.githubLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300"
                  >
                    <FileCode className="w-3.5 h-3.5" /> Repository <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {submission.demoLink && (
                  <a
                    href={submission.demoLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                  >
                    <Play className="w-3.5 h-3.5" /> Live Demo <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {submission.presentationLink && (
                  <a
                    href={submission.presentationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                  >
                    <FileText className="w-3.5 h-3.5" /> Pitch Deck <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {submission.description}
            </p>
          </div>

          {/* Section 2: Similarity Alert & Decision Workflow */}
          {submission.similarityFlags && submission.similarityFlags.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Semantic Similarity Defense Alert
                  </h4>
                </div>
                <span className="text-3xs text-slate-400 italic">
                  * Decision support only. AI never automatically rejects submissions.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {submission.similarityFlags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {flag.submission?.title || "Similar Project"}
                      </p>
                      <p className="text-3xs text-slate-400 mt-0.5">
                        Team: {flag.submission?.team?.name || "Other Team"}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                      {(flag.score * 100).toFixed(1)}% Cosine
                    </span>
                  </div>
                ))}
              </div>

              {/* Judge Similarity Decision Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Judge Plagiarism Finding:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSimilarityDecision("similar")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition ${
                      similarityDecision === "similar"
                        ? "bg-rose-500 text-white border-rose-400 shadow-sm"
                        : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    Mark Similar (Plagiarized)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimilarityDecision("not_similar")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition ${
                      similarityDecision === "not_similar"
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                        : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    Mark Distinct (Original)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimilarityDecision("needs_review")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition ${
                      similarityDecision === "needs_review"
                        ? "bg-amber-600 text-white border-amber-500 shadow-sm"
                        : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    Needs Further Review
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Criteria-by-Criteria Scoring Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-brand-400" />
                Dynamic Rubric Dimensions & Rationales
              </h3>
              <span className="text-3xs text-slate-400 font-mono">
                Organizer-configured weights (Fixed)
              </span>
            </div>

            <div className="space-y-4">
              {editedCriteria.map((crit, idx) => {
                const rubricInfo = hackathonCriteria.find((h) => h.name === crit.criterion) || {
                  description: "Rubric dimension",
                  weight: 1,
                  maxScore: 10
                };

                const originalScore =
                  score?.criterionScores?.[idx]?.score ||
                  score?.previousAiScore?.criterionScores?.[idx]?.score ||
                  (score?.source === "ai" ? crit.score : null);

                const critDelta =
                  originalScore !== null && isEditing
                    ? Math.round((crit.score - originalScore) * 100) / 100
                    : 0;

                return (
                  <motion.div
                    key={crit.criterion}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.2 }}
                    className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-white capitalize">
                            {crit.criterion.replace(/([A-Z])/g, " $1")}
                          </span>
                          <span className="text-3xs font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                            Weight: {rubricInfo.weight}× (Max {rubricInfo.maxScore})
                          </span>
                          {critDelta !== 0 && isEditing && (
                            <span
                              className={`text-3xs font-mono px-1.5 py-0.5 rounded ${
                                critDelta > 0
                                  ? "bg-emerald-500/20 text-emerald-300 font-bold"
                                  : "bg-rose-500/20 text-rose-300 font-bold"
                              }`}
                            >
                              Δ {critDelta > 0 ? `+${critDelta}` : critDelta}
                            </span>
                          )}
                        </div>
                        <p className="text-3xs text-slate-400 mt-0.5">{rubricInfo.description}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {isEditing || isIndependentScoring ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max={rubricInfo.maxScore || 10}
                              step="0.5"
                              value={crit.score}
                              onChange={(e) => handleScoreChange(idx, e.target.value)}
                              className="w-28 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                            />
                            <input
                              type="number"
                              min="0"
                              max={rubricInfo.maxScore || 10}
                              step="0.5"
                              value={crit.score}
                              onChange={(e) => handleScoreChange(idx, e.target.value)}
                              className="w-14 px-2 py-1 text-xs font-mono font-bold text-center bg-slate-900 border border-slate-700 rounded-lg text-white"
                            />
                          </div>
                        ) : (
                          <span className="text-sm font-mono font-bold text-white bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                            {crit.score} / {rubricInfo.maxScore || 10}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* AI Rationale (Blue highlight) */}
                    {score?.source === "ai" && crit.rationale && (
                      <div className="p-2.5 rounded-xl bg-sky-500/5 border border-sky-500/20 text-xs text-sky-200">
                        <span className="text-4xs font-mono font-bold text-sky-400 block mb-0.5">
                          AI BASELINE RATIONALE
                        </span>
                        <p className="italic">"{crit.rationale}"</p>
                      </div>
                    )}

                    {/* Judge Adjustment Justification */}
                    {isEditing ? (
                      <div>
                        <label className="block text-4xs font-semibold text-slate-400 uppercase mb-1">
                          Judge Technical Justification for Score Adjustment:
                        </label>
                        <textarea
                          rows={2}
                          value={crit.rationale}
                          onChange={(e) => handleRationaleChange(idx, e.target.value)}
                          placeholder="Provide specific justification grounded in repository code or architecture..."
                          className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-lg text-slate-200 focus:border-brand-500 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                    ) : (
                      score?.source === "human" && (
                        <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                          "{crit.rationale || "No specific rationale provided."}"
                        </p>
                      )
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Structured Human Expert Feedback */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
              Structured Expert Review & Qualitative Observations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-3xs font-semibold text-emerald-400 uppercase mb-1">
                  Key Strengths (Comma separated)
                </label>
                <input
                  type="text"
                  disabled={!isEditing && !isIndependentScoring}
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="e.g. Robust error handling, Novel pipeline"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-brand-500 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-rose-400 uppercase mb-1">
                  Identified Weaknesses (Comma separated)
                </label>
                <input
                  type="text"
                  disabled={!isEditing && !isIndependentScoring}
                  value={weaknesses}
                  onChange={(e) => setWeaknesses(e.target.value)}
                  placeholder="e.g. Missing unit tests, High latency"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-brand-500 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-sky-400 uppercase mb-1">
                  Actionable Suggestions
                </label>
                <input
                  type="text"
                  disabled={!isEditing && !isIndependentScoring}
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="e.g. Add distributed cache, Dockerize"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-brand-500 focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-400 uppercase mb-1">
                Technical Observations (Architecture & Engineering Analysis)
              </label>
              <textarea
                rows={2}
                disabled={!isEditing && !isIndependentScoring}
                value={technicalObservations}
                onChange={(e) => setTechnicalObservations(e.target.value)}
                placeholder="Specific architectural remarks on repo layout, modularity, and algorithm complexity..."
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-brand-500 focus:outline-none resize-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-400 uppercase mb-1">
                Overall Participant Feedback
              </label>
              <textarea
                rows={2}
                disabled={!isEditing && !isIndependentScoring}
                value={overallComments}
                onChange={(e) => setOverallComments(e.target.value)}
                placeholder="Constructive summary feedback delivered to the participant team..."
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-brand-500 focus:outline-none resize-none disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Validation Action Bar */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {score && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReject}
              loading={loading}
              icon={XCircle}
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 self-start sm:self-auto"
            >
              Reject Score
            </Button>
          )}

          <div className="flex items-center gap-3 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </Button>

            {isEditing || isIndependentScoring ? (
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                loading={loading}
                onClick={handleSaveEvaluation}
              >
                {isIndependentScoring ? "Submit Evaluation" : "Save Validated Score"}
              </Button>
            ) : (
              <Button
                variant="success"
                size="sm"
                icon={CheckCircle2}
                loading={loading}
                onClick={handleAcceptUnchanged}
              >
                Accept Score Unchanged
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default JudgeScoreReviewModal;
