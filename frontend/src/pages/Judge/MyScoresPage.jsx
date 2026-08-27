import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllScores } from "../../api/scoreApi";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import { formatDate } from "../../utils/helpers";
import { Star, MessageSquare, Edit2, ArrowRight } from "lucide-react";

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
          (s) => s.judge?._id === user.id
        );
        setScores(filtered);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch your score history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyScores();
  }, [user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="My Scores"
        description="Review project scorecards and feedback comments you have submitted."
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchMyScores} />
      ) : scores.length === 0 ? (
        <EmptyState
          title="No scores submitted"
          message="You have not submitted evaluation scores for any projects yet."
          actionButton={
            <Link to="/judge/submissions">
              <button className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg transition">
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
              className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xs font-semibold text-slate-400">
                    Graded: {formatDate(sc.createdAt)}
                  </span>
                  <span className="text-xs font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    Score: {sc.totalScore} / 40
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-805">
                    {sc.submission?.title}
                  </h3>
                  <p className="text-3xs text-slate-400 font-semibold mt-1">
                    Event: {sc.submission?.hackathon?.title || "Hackathon"}
                  </p>
                </div>

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50 text-3xs text-slate-500 font-medium">
                  <div>Innovation: <span className="font-bold text-slate-750">{sc.innovation}</span></div>
                  <div>Technical Implementation: <span className="font-bold text-slate-750">{sc.technicalImplementation}</span></div>
                  <div>Impact: <span className="font-bold text-slate-750">{sc.impact}</span></div>
                  <div>Presentation: <span className="font-bold text-slate-750">{sc.presentation}</span></div>
                </div>

                {sc.feedback && (
                  <div className="p-3 bg-slate-50 rounded-lg text-3xs text-slate-500 mt-2 flex items-start gap-1.5 leading-relaxed">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>{sc.feedback}</span>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 text-right">
                <Link
                  to={`/submissions/${sc.submission?._id}`}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
                >
                  Edit Scorecard
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
