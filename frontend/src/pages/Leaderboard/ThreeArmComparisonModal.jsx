import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Trophy, GitFork, CheckCircle2, TrendingUp, HelpCircle } from "lucide-react";
import { getRankingComparison } from "../../api/leaderboardApi";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { toast } from "sonner";

const ThreeArmComparisonModal = ({ isOpen, onClose, hackathonId, hackathonTitle }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && hackathonId) {
      const fetchComparison = async () => {
        setLoading(true);
        try {
          const res = await getRankingComparison(hackathonId);
          if (res.success) {
            setData(res);
          }
        } catch (err) {
          toast.error("Failed to load three-arm ranking comparison data");
        } finally {
          setLoading(false);
        }
      };
      fetchComparison();
    }
  }, [isOpen, hackathonId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
              <GitFork className="w-3.5 h-3.5" />
              <span>Research Module 6 · Three-Arm Evaluation Matrix</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Three-Arm Ranking & Correlation Comparison
            </h2>
            <p className="text-xs text-slate-500">{hackathonTitle}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : !data || data.comparison?.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No comparative scoring data available for this hackathon yet.
            </div>
          ) : (
            <>
              {/* Statistical Correlation Metrics Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    AI vs Hybrid Spearman (ρ)
                  </p>
                  <p className="text-2xl font-bold text-blue-600 font-mono mt-1">
                    {data.rankCorrelations.ai_vs_hybrid.spearmanRho !== null
                      ? data.rankCorrelations.ai_vs_hybrid.spearmanRho
                      : "N/A"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Rank correlation</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    AI vs Hybrid Kendall (τ)
                  </p>
                  <p className="text-2xl font-bold text-blue-600 font-mono mt-1">
                    {data.rankCorrelations.ai_vs_hybrid.kendallTau !== null
                      ? data.rankCorrelations.ai_vs_hybrid.kendallTau
                      : "N/A"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Concordance tau</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    AI vs Human Spearman (ρ)
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">
                    {data.rankCorrelations.ai_vs_human.spearmanRho !== null
                      ? data.rankCorrelations.ai_vs_human.spearmanRho
                      : "N/A"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Sample N={data.rankCorrelations.ai_vs_human.sampleSize}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    AI vs Human Kendall (τ)
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">
                    {data.rankCorrelations.ai_vs_human.kendallTau !== null
                      ? data.rankCorrelations.ai_vs_human.kendallTau
                      : "N/A"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Sample N={data.rankCorrelations.ai_vs_human.sampleSize}</p>
                </div>
              </div>

              {/* Three Arm Matrix Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      <th className="px-4 py-3">Project Title</th>
                      <th className="px-4 py-3">Team</th>
                      <th className="px-4 py-3 text-center bg-blue-50/50 text-blue-700">
                        Arm 1: AI-Only
                      </th>
                      <th className="px-4 py-3 text-center bg-emerald-50/50 text-emerald-700">
                        Arm 2: Human-Only
                      </th>
                      <th className="px-4 py-3 text-center bg-indigo-50/50 text-indigo-700">
                        Arm 3: Hybrid (Validated)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {data.comparison.map((row) => (
                      <tr key={row.submissionId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {row.projectTitle}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {row.team?.name || "N/A"}
                        </td>

                        {/* Arm 1 */}
                        <td className="px-4 py-3 text-center bg-blue-50/20 font-mono">
                          {row.aiOnly.rank !== null ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="font-bold text-blue-600">Rank {row.aiOnly.rank}</span>
                              <span className="text-slate-400">({row.aiOnly.score})</span>
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Arm 2 */}
                        <td className="px-4 py-3 text-center bg-emerald-50/20 font-mono">
                          {row.humanOnly.rank !== null ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="font-bold text-emerald-600">Rank {row.humanOnly.rank}</span>
                              <span className="text-slate-400">({row.humanOnly.score})</span>
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Arm 3 */}
                        <td className="px-4 py-3 text-center bg-indigo-50/20 font-mono">
                          {row.hybrid.rank !== null ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="font-bold text-indigo-600">Rank {row.hybrid.rank}</span>
                              <span className="text-slate-400">({row.hybrid.score})</span>
                              {row.hybrid.validated && (
                                <span className="text-3xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold font-sans">
                                  val
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            * Direct research computation of Spearman Rho and Kendall Tau over real MongoDB submissions.
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ThreeArmComparisonModal;
