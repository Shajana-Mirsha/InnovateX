import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getSubmissions } from "../../api/submissionApi";
import { getAllTeams } from "../../api/teamApi";
import SubmissionFeedbackModal from "./SubmissionFeedbackModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { CardSkeleton } from "../../components/common/Skeleton";
import { Code, ExternalLink, ArrowRight, Layers, FileCode, Sparkles, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const SubmissionsPage = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Feedback modal
  const [feedbackSubId, setFeedbackSubId] = useState(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError("");
    try {
      const subRes = await getSubmissions();
      
      if (subRes.success) {
        setSubmissions(subRes.submissions || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch project submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  const handleOpenFeedback = (subId) => {
    setFeedbackSubId(subId);
    setFeedbackModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <FileCode className="w-3.5 h-3.5" />
            <span>Research Projects & Submissions</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {user.role === "participant" ? "My Project Submissions" : "All Challenge Submissions"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user.role === "participant"
              ? "View project implementations, AI evaluations, and validated judging feedback."
              : "Review project submissions, codebases, and evaluation statuses."}
          </p>
        </div>

        {user && user.role === "participant" && (
          <Link to="/submissions/create">
            <Button variant="primary" size="md" icon={Code}>
              Submit New Project
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchSubmissions} />
      ) : submissions.length === 0 ? (
        <EmptyState
          title="No Project Submissions Found"
          message={
            user.role === "participant"
              ? "Your team hasn't submitted a project yet. Register and submit before the competition deadline."
              : "No project entries have been submitted yet."
          }
          actionButton={
            user.role === "participant" ? (
              <Link to="/submissions/create">
                <Button variant="primary">Submit Your Project</Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {submissions.map((sub) => (
            <div
              key={sub._id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between shadow-sm"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-semibold text-blue-600 uppercase tracking-wider">
                    {sub.hackathon?.title || "National Challenge"}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 text-2xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    Submitted
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                    {sub.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {sub.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Team: <strong className="text-slate-800">{sub.team?.name || "N/A"}</strong></span>
                  </div>
                  {sub.githubLink && (
                    <a
                      href={sub.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium transition"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      GitHub Repo
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  icon={MessageSquare}
                  onClick={() => handleOpenFeedback(sub._id)}
                  className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 bg-white"
                >
                  View Evaluation Feedback
                </Button>

                <Link
                  to={`/submissions/${sub._id}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition"
                >
                  Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Explainable Feedback Modal */}
      {feedbackModalOpen && (
        <SubmissionFeedbackModal
          isOpen={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          submissionId={feedbackSubId}
        />
      )}
    </div>
  );
};

export default SubmissionsPage;
