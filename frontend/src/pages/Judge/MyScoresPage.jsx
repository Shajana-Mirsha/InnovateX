import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllScores } from "../../api/scoreApi";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import { CardSkeleton } from "../../components/common/Skeleton";
import { formatDate } from "../../utils/helpers";
import {
  Star,
  MessageSquare,
  Edit2,
  ArrowRight,
  Gavel,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  AlertCircle
} from "lucide-react";

const MyScoresPage = () => {
  const { user } = useAuth();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMyScores = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllScores();
      if (res.success) {
        const filtered = (res.scores || []).filter(
          (s) => (s.judge?._id || s.judge) === user.id
        );
        setScores(filtered);
      }
    } catch (err) {
      setError("Failed to fetch your score history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyScores();
  }, [user]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <Gavel className="w-3.5 h-3.5" />
            <span>Judge Scorecards & Audit History</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            My Evaluation Scorecards
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review submission scores, dynamic rubric breakdowns, qualitative observations, and calibration audit logs.
          </p>
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchMyScores} />
      ) : scores.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title="No scores submitted yet"
          message="You have not submitted evaluation scores for any projects yet."
          actionButton={
            <Link to="/judge/submissions">
              <button className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl shadow transition">
                Start Grading Submissions
              </button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scores.map((sc) => (
            <div
              key={sc._id}
              className="glass-panel border border-slate-800/80 rounded-3xl overflow-hidden flex flex-col justify-between shadow-lg"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xs font-mono font-semibold text-slate-400">
                    Validated: {formatDate(sc.validatedAt || sc.createdAt)}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Total: {sc.totalScore} pts
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    {sc.submission?.title || "Submission Project"}
                  </h3>
                  <p className="text-3xs text-slate-400 font-mono mt-1">
                    Event: {sc.submission?.hackathon?.title || "Hackathon Challenge"}
                  </p>
                </div>

                {/* Dynamic Criterion Scores Breakdown */}
                {sc.criterionScores && sc.criterionScores.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-800/60 text-3xs font-mono">
                    {sc.criterionScores.map((cs) => (
                      <div key={cs.criterion} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400 block capitalize truncate">{cs.criterion}</span>
                        <strong className="text-white text-xs">{cs.score} pts</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/60 text-3xs text-slate-400 font-mono">
                    <div>Innovation: <strong className="text-white">{sc.innovation || "N/A"}</strong></div>
                    <div>Tech Implementation: <strong className="text-white">{sc.technicalImplementation || "N/A"}</strong></div>
                    <div>Impact: <strong className="text-white">{sc.impact || "N/A"}</strong></div>
                    <div>Presentation: <strong className="text-white">{sc.presentation || "N/A"}</strong></div>
                  </div>
                )}

                {/* Qualitative Feedback */}
                {(sc.technicalObservations || sc.overallComments || sc.feedback) && (
                  <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-3xs text-slate-300 space-y-1.5">
                    {sc.technicalObservations && (
                      <p><strong className="text-brand-300 font-mono">Technical Observation:</strong> {sc.technicalObservations}</p>
                    )}
                    {(sc.overallComments || sc.feedback) && (
                      <p><strong className="text-emerald-300 font-mono">Feedback:</strong> {sc.overallComments || sc.feedback}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-4xs text-slate-500 font-mono">
                  Status: {sc.evaluationStatus || "submitted"}
                </span>
                <Link
                  to={`/judge/submissions`}
                  className="text-xs font-bold text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
                >
                  Edit in Judge Workspace
                  <Edit2 className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyScoresPage;
