import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { getSubmissions } from "../../api/submissionApi";
import { getAllTeams } from "../../api/teamApi";
import SubmissionFeedbackModal from "./SubmissionFeedbackModal";
import PageHeader from "../../components/common/PageHeader";
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
        let list = subRes.submissions || [];
        
        if (user.role === "participant") {
          const teamRes = await getAllTeams();
          if (teamRes.success) {
            const userTeamIds = (teamRes.teams || [])
              .filter(
                (t) =>
                  t.leader?._id === user.id ||
                  t.members?.some((m) => m._id === user.id)
              )
              .map((t) => t._id);

            list = list.filter(
              (s) =>
                s.submittedBy?._id === user.id ||
                userTeamIds.includes(s.team?._id)
            );
          }
        }
        
        setSubmissions(list);
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <FileCode className="w-3.5 h-3.5" />
            <span>Research Projects & Submissions</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {user.role === "participant" ? "My Project Submissions" : "All Challenge Submissions"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
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
          {submissions.map((sub, idx) => (
            <motion.div
              key={sub._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-panel border border-slate-800/80 rounded-3xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xs font-semibold text-brand-400 uppercase tracking-wider">
                    {sub.hackathon?.title || "National Challenge"}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 text-4xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                    Submitted
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white line-clamp-1">
                    {sub.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {sub.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-800/60 text-3xs text-slate-400 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>Team: <strong className="text-slate-300">{sub.team?.name || "N/A"}</strong></span>
                  </div>
                  {sub.githubLink && (
                    <a
                      href={sub.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      GitHub Repo
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  icon={MessageSquare}
                  onClick={() => handleOpenFeedback(sub._id)}
                  className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  View Evaluation Feedback
                </Button>

                <Link
                  to={`/submissions/${sub._id}`}
                  className="text-xs font-bold text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
                >
                  Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
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
