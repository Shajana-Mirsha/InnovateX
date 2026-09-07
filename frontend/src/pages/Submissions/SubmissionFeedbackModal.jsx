import React, { useState, useEffect } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Participant Assessment & Evaluation Report</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {data?.projectTitle || "Project Evaluation"}
            </h2>
            {data?.team && (
              <p className="text-xs text-slate-500">
                Team: <strong className="text-slate-800">{data.team}</strong>
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Navigation Tabs */}
        {data?.scored && (hasHuman || hasAi) && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
            {hasHuman && (
              <button
                type="button"
                onClick={() => setActiveTab("human")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "human"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
              <LoadingSpinner size="lg" color="primary" />
            </div>
          ) : !data || !data.scored ? (
            <div className="text-center py-16 space-y-3">
              <Lightbulb className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Evaluation in Progress</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {data?.message || "This project is currently queued for automated evaluation and expert judge validation. Detailed feedback will appear here once reviewed."}
              </p>
            </div>
          ) : (
            <>
              {/* Active Tab: Human Expert Validated Feedback */}
              {activeTab === "human" && data.humanFeedback && (
                <div className="space-y-6">
                  {/* Summary Banner */}
                  <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status="human_validated" label="Human Expert Validated" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">Official Expert Evaluation</h3>
                      <p className="text-xs text-slate-700 italic leading-relaxed">
                        "{data.humanFeedback.feedback || data.feedback || "Solid submission with rigorous engineering execution."}"
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold block">
                        Official Score
                      </span>
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-3xl font-extrabold text-emerald-700">
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
                        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                            <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" /> Strengths
                          </h4>
                          <ul className="space-y-1 text-xs text-slate-700">
                            {data.humanFeedback.strengths.map((st, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-600">•</span>
                                <span>{st}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {data.humanFeedback.weaknesses?.length > 0 && (
                        <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2">
                          <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Improvement Areas
                          </h4>
                          <ul className="space-y-1 text-xs text-slate-700">
                            {data.humanFeedback.weaknesses.map((wk, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-rose-600">•</span>
                                <span>{wk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {data.humanFeedback.suggestions?.length > 0 && (
                        <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200 space-y-2">
                          <h4 className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5 text-sky-600" /> Next Steps
                          </h4>
                          <ul className="space-y-1 text-xs text-slate-700">
                            {data.humanFeedback.suggestions.map((sg, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-sky-600">•</span>
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
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-blue-600" />
                        Technical Observations & Architectural Assessment
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {data.humanFeedback.technicalObservations}
                      </p>
                    </div>
                  )}

                  {/* Per-Criterion Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-blue-600" />
                      Dynamic Rubric Criteria Scores & Rationales
                    </h4>

                    <div className="space-y-3">
                      {data.humanFeedback.criterionFeedback?.map((cf) => (
                        <div
                          key={cf.criterion}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 capitalize">
                              {cf.criterion.replace(/([A-Z])/g, " $1")}
                            </span>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {cf.score} pts
                            </span>
                          </div>
                          {cf.explanation && (
                            <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
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
                  <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status="ai_scored" label="AI Baseline Assessment" />
                        <span className="text-2xs text-slate-500 font-medium">
                          {data.aiFeedback.model}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">Automated LLM Review</h3>
                      <p className="text-xs text-slate-700 italic leading-relaxed">
                        "{data.aiFeedback.feedback || "Automated analysis completed against competition rubric."}"
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold block">
                        AI Score
                      </span>
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-3xl font-extrabold text-blue-700">
                          {data.aiFeedback.totalScore}
                        </span>
                        <span className="text-xs text-slate-500">/ 40 pts</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Criteria Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-blue-600" />
                      AI Rubric Rationales
                    </h4>

                    <div className="space-y-3">
                      {data.aiFeedback.criterionFeedback?.map((cf) => (
                        <div
                          key={cf.criterion}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 capitalize">
                              {cf.criterion.replace(/([A-Z])/g, " $1")}
                            </span>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {cf.score} pts
                            </span>
                          </div>
                          {cf.explanation && (
                            <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
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
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionFeedbackModal;
