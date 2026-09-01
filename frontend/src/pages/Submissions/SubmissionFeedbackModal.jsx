import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  CheckCircle2,
  Award,
  MessageSquare,
  FileText,
  Lightbulb,
  ExternalLink,
  UserCheck,
  Brain,
  ThumbsUp,
  AlertCircle,
  Compass,
  Cpu
} from "lucide-react";
import { getSubmissionFeedback } from "../../api/submissionApi";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { toast } from "sonner";

const SubmissionFeedbackModal = ({ isOpen, onClose, submissionId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("human"); // "human" or "ai"

  useEffect(() => {
    if (isOpen && submissionId) {
      const fetchFeedback = async () => {
        setLoading(true);
        try {
          const res = await getSubmissionFeedback(submissionId);
          if (res.success) {
            setData(res);
            if (res.humanFeedback) {
              setActiveTab("human");
            } else if (res.aiFeedback) {
              setActiveTab("ai");
            }
          }
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to load project feedback");
        } finally {
          setLoading(false);
        }
      };
      fetchFeedback();
    }
  }, [isOpen, submissionId]);

  if (!isOpen) return null;

  const hasHuman = Boolean(data?.humanFeedback);
  const hasAi = Boolean(data?.aiFeedback);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="w-full max-w-4xl glass-panel bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/90">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Participant Assessment & Evaluation Report</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {data?.projectTitle || "Project Evaluation"}
            </h2>
            {data?.team && (
              <p className="text-xs text-slate-400 font-mono">
                Team: <strong className="text-slate-200">{data.team}</strong>
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Navigation Tabs */}
        {data?.scored && (hasHuman || hasAi) && (
          <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center gap-3">
            {hasHuman && (
              <button
                type="button"
                onClick={() => setActiveTab("human")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "human"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Human Expert Feedback (Validated)
              </button>
            )}

            {hasAi && (
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "ai"
                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Brain className="w-4 h-4" />
                AI Baseline Assessment
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" color="white" />
            </div>
          ) : !data || !data.scored ? (
            <div className="text-center py-16 space-y-3">
              <Lightbulb className="w-12 h-12 text-amber-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Evaluation in Progress</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {data?.message || "This project is currently queued for automated evaluation and expert judge validation. Detailed feedback will appear here once reviewed."}
              </p>
            </div>
          ) : (
            <>
              {/* Active Tab: Human Expert Validated Feedback */}
              {activeTab === "human" && data.humanFeedback && (
                <div className="space-y-6">
                  {/* Summary Banner */}
                  <div className="p-6 rounded-2xl glass-panel bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-slate-900/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status="human_validated" label="Human Expert Validated" />
                      </div>
                      <h3 className="text-base font-bold text-white">Official Expert Evaluation</h3>
                      <p className="text-xs text-slate-300 italic leading-relaxed">
                        "{data.humanFeedback.feedback || data.feedback || "Solid submission with rigorous engineering execution."}"
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-4xs uppercase tracking-wider text-slate-400 font-semibold block">
                        Official Score
                      </span>
                      <div className="flex items-baseline gap-1 justify-end font-mono">
                        <span className="text-3xl font-extrabold text-emerald-300">
                          {data.humanFeedback.totalScore}
                        </span>
                        <span className="text-xs text-slate-500">/ 40 pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Qualitative Observations (Strengths, Weaknesses, Suggestions) */}
                  {(data.humanFeedback.strengths?.length > 0 ||
                    data.humanFeedback.weaknesses?.length > 0 ||
                    data.humanFeedback.suggestions?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {data.humanFeedback.strengths?.length > 0 && (
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/20 space-y-2">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <ThumbsUp className="w-3.5 h-3.5" /> Strengths
                          </h4>
                          <ul className="space-y-1 text-xs text-slate-300">
                            {data.humanFeedback.strengths.map((st, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-400">•</span>
                                <span>{st}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {data.humanFeedback.weaknesses?.length > 0 && (
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-rose-500/20 space-y-2">
                          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" /> Improvement Areas
                          </h4>
                          <ul className="space-y-1 text-xs text-slate-300">
                            {data.humanFeedback.weaknesses.map((wk, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-rose-400">•</span>
                                <span>{wk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {data.humanFeedback.suggestions?.length > 0 && (
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-sky-500/20 space-y-2">
                          <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5" /> Next Steps
                          </h4>
                          <ul className="space-y-1 text-xs text-slate-300">
                            {data.humanFeedback.suggestions.map((sg, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-sky-400">•</span>
                                <span>{sg}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Technical Observations */}
                  {data.humanFeedback.technicalObservations && (
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-brand-400" />
                        Technical Observations & Architectural Assessment
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {data.humanFeedback.technicalObservations}
                      </p>
                    </div>
                  )}

                  {/* Per-Criterion Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-brand-400" />
                      Dynamic Rubric Criteria Scores & Rationales
                    </h4>

                    <div className="space-y-3">
                      {data.humanFeedback.criterionFeedback?.map((cf, idx) => (
                        <div
                          key={cf.criterion}
                          className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white capitalize font-mono">
                              {cf.criterion.replace(/([A-Z])/g, " $1")}
                            </span>
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              {cf.score} pts
                            </span>
                          </div>
                          {cf.explanation && (
                            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                              "{cf.explanation}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Active Tab: AI Baseline Assessment */}
              {activeTab === "ai" && data.aiFeedback && (
                <div className="space-y-6">
                  {/* Summary Banner */}
                  <div className="p-6 rounded-2xl glass-panel bg-gradient-to-r from-sky-950/40 via-slate-900/90 to-slate-900/90 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status="ai_scored" label="AI Baseline Assessment" />
                        <span className="text-4xs font-mono text-slate-400">
                          {data.aiFeedback.model}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">Automated LLM Review</h3>
                      <p className="text-xs text-slate-300 italic leading-relaxed">
                        "{data.aiFeedback.feedback || "Automated analysis completed against competition rubric."}"
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-4xs uppercase tracking-wider text-slate-400 font-semibold block">
                        AI Score
                      </span>
                      <div className="flex items-baseline gap-1 justify-end font-mono">
                        <span className="text-3xl font-extrabold text-sky-300">
                          {data.aiFeedback.totalScore}
                        </span>
                        <span className="text-xs text-slate-500">/ 40 pts</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Criteria Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-sky-400" />
                      AI Rubric Rationales
                    </h4>

                    <div className="space-y-3">
                      {data.aiFeedback.criterionFeedback?.map((cf) => (
                        <div
                          key={cf.criterion}
                          className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white capitalize font-mono">
                              {cf.criterion.replace(/([A-Z])/g, " $1")}
                            </span>
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                              {cf.score} pts
                            </span>
                          </div>
                          {cf.explanation && (
                            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                              "{cf.explanation}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Report
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SubmissionFeedbackModal;
