import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllScores } from "../../api/scoreApi";
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Gavel className="w-3.5 h-3.5" />
            <span>Judge Scorecards & Audit History</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            My Evaluation Scorecards
          </h1>
          <p className="text-sm text-slate-500 mt-1">
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
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition">
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
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Validated: {formatDate(sc.validatedAt || sc.createdAt)}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Total: {sc.totalScore} pts
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {sc.submission?.title || "Submission Project"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Event: {sc.submission?.hackathon?.title || "Hackathon Challenge"}
                  </p>
                </div>

                {/* Dynamic Criterion Scores Breakdown */}
                {sc.criterionScores && sc.criterionScores.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 text-xs">
                    {sc.criterionScores.map((cs) => (
                      <div key={cs.criterion} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 text-2xs block capitalize truncate">{cs.criterion}</span>
                        <strong className="text-slate-900 text-xs">{cs.score} pts</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">Innovation: <strong className="text-slate-900">{sc.innovation || "N/A"}</strong></div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">Tech Implementation: <strong className="text-slate-900">{sc.technicalImplementation || "N/A"}</strong></div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">Impact: <strong className="text-slate-900">{sc.impact || "N/A"}</strong></div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">Presentation: <strong className="text-slate-900">{sc.presentation || "N/A"}</strong></div>
                  </div>
                )}

                {/* Qualitative Feedback */}
                {(sc.technicalObservations || sc.overallComments || sc.feedback) && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1.5">
                    {sc.technicalObservations && (
                      <p><strong className="text-blue-700 font-semibold">Technical Observation:</strong> {sc.technicalObservations}</p>
                    )}
                    {(sc.overallComments || sc.feedback) && (
                      <p><strong className="text-emerald-700 font-semibold">Feedback:</strong> {sc.overallComments || sc.feedback}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-2xs text-slate-500 font-medium uppercase tracking-wider">
                  Status: <span className="text-slate-700 font-semibold">{sc.evaluationStatus || "submitted"}</span>
                </span>
                <Link
                  to={`/judge/submissions`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition"
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
