import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getSubmissionById } from "../../api/submissionApi";
import { getSubmissionScores, createScore, updateScore } from "../../api/scoreApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import SubmissionFeedbackModal from "./SubmissionFeedbackModal";
import StatusBadge from "../../components/common/StatusBadge";
import { CardSkeleton } from "../../components/common/Skeleton";
import { formatDate } from "../../utils/helpers";
import {
  FileCode,
  GitBranch,
  Tv,
  Presentation,
  Users,
  Trophy,
  Star,
  ArrowLeft,
  Calendar,
  MessageSquare,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Clock,
  Check,
  AlertCircle,
  Gavel,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

const SubmissionDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [scores, setScores] = useState([]);
  const [averageScore, setAverageScore] = useState(0);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [myScoreRecord, setMyScoreRecord] = useState(null);

  // Score Form states (Judges only)
  const [innovation, setInnovation] = useState(5);
  const [technicalImplementation, setTechnicalImplementation] = useState(5);
  const [impact, setImpact] = useState(5);
  const [presentation, setPresentation] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [scoreSubmitting, setScoreSubmitting] = useState(false);
  const [scoreError, setScoreError] = useState("");

  // Participant feedback modal
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const fetchSubmissionDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const subRes = await getSubmissionById(id);
      if (subRes.success) {
        setSubmission(subRes.submission);
      }

      if (user && (user.role === "admin" || user.role === "organizer" || user.role === "judge")) {
        setScoresLoading(true);
        try {
          const scoreRes = await getSubmissionScores(id);
          if (scoreRes.success) {
            setScores(scoreRes.scores || []);
            setAverageScore(scoreRes.averageScore || 0);

            if (user.role === "judge") {
              const myGrading = (scoreRes.scores || []).find(
                (s) => (s.judge?._id || s.judge) === user.id
              );
              if (myGrading) {
                setMyScoreRecord(myGrading);
                setInnovation(myGrading.innovation || 5);
                setTechnicalImplementation(myGrading.technicalImplementation || 5);
                setImpact(myGrading.impact || 5);
                setPresentation(myGrading.presentation || 5);
                setFeedback(myGrading.feedback || "");
              }
            }
          }
        } catch (sErr) {
          console.warn("Could not load scores:", sErr);
        } finally {
          setScoresLoading(false);
        }
      }
    } catch (err) {
      setError("Failed to load submission details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissionDetails();
  }, [id, user]);

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    setScoreError("");
    setScoreSubmitting(true);

    const scoreData = {
      submissionId: id,
      innovation: Number(innovation),
      technicalImplementation: Number(technicalImplementation),
      impact: Number(impact),
      presentation: Number(presentation),
      feedback,
    };

    try {
      let res;
      if (myScoreRecord) {
        res = await updateScore(myScoreRecord._id, {
          innovation: Number(innovation),
          technicalImplementation: Number(technicalImplementation),
          impact: Number(impact),
          presentation: Number(presentation),
          feedback,
        });
      } else {
        res = await createScore(scoreData);
      }

      if (res.success) {
        toast.success(
          myScoreRecord ? "Scorecard updated successfully!" : "Scorecard submitted successfully!"
        );
        const scoreRes = await getSubmissionScores(id);
        if (scoreRes.success) {
          setScores(scoreRes.scores || []);
          setAverageScore(scoreRes.averageScore || 0);
          const myGrading = (scoreRes.scores || []).find(
            (s) => (s.judge?._id || s.judge) === user.id
          );
          if (myGrading) setMyScoreRecord(myGrading);
        }
      }
    } catch (err) {
      setScoreError(err.response?.data?.message || "Failed to submit score details.");
    } finally {
      setScoreSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-8">
        <CardSkeleton count={2} />
      </div>
    );
  }

  if (error || !submission) {
    return <ErrorMessage message={error || "Submission not found"} />;
  }

  const calculatedTotal =
    Number(innovation) +
    Number(technicalImplementation) +
    Number(impact) +
    Number(presentation);

  // Real Deadline Calculation
  const deadlineDate = submission.hackathon?.endDate ? new Date(submission.hackathon.endDate) : null;
  const isDeadlinePassed = deadlineDate ? new Date() > deadlineDate : false;
  const daysRemaining = deadlineDate
    ? Math.max(0, Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  // Real Submission Evaluation State
  const hasAiScored = scores.some((s) => s.source === "ai" || s.previousAiScore);
  const hasHumanScored = scores.some((s) => s.source === "human");

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <Link
          to="/submissions"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Submissions
        </Link>
      </div>

      {/* HEADER CARD */}
      <div className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xs font-mono font-bold text-brand-400 uppercase tracking-wider">
              Challenge: {submission.hackathon?.title || "National Hackathon"}
            </span>
            {isDeadlinePassed ? (
              <span className="px-2.5 py-0.5 text-4xs font-mono font-bold rounded-full bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                Submission Closed
              </span>
            ) : daysRemaining !== null ? (
              <span className="px-2.5 py-0.5 text-4xs font-mono font-bold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase">
                {daysRemaining} Day{daysRemaining !== 1 ? "s" : ""} Remaining
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={MessageSquare}
              onClick={() => setFeedbackModalOpen(true)}
              className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              View Assessment Feedback
            </Button>
            {user && (user.role === "admin" || user.role === "organizer" || user.role === "judge") && (
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-brand-300 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/30">
                <Star className="w-3.5 h-3.5 text-brand-400 fill-brand-400" />
                <span>Avg: {averageScore.toFixed(1)} / 40</span>
              </div>
            )}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{submission.title}</h1>
        <p className="text-xs text-slate-400">
          Developed by Team: <strong className="text-slate-200">{submission.team?.name || "N/A"}</strong>
        </p>

        {/* Links */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-800/80">
          {submission.githubLink && (
            <a
              href={submission.githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
            >
              <FileCode className="w-4 h-4 text-sky-400" />
              GitHub Repository
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {submission.demoLink && (
            <a
              href={submission.demoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              <Tv className="w-4 h-4 text-emerald-400" />
              Live Demo
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {submission.presentationLink && (
            <a
              href={submission.presentationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
            >
              <Presentation className="w-4 h-4 text-brand-400" />
              Presentation Deck
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>

      {/* SUBMISSION STATUS TIMELINE */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4 shadow-xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-400" />
          Project Evaluation Status Timeline
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          {/* Step 1 */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
            <span className="text-3xs font-bold text-emerald-300 block">1. Registration</span>
            <span className="text-4xs text-slate-400 font-mono">Approved</span>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
            <span className="text-3xs font-bold text-emerald-300 block">2. Team Formation</span>
            <span className="text-4xs text-slate-400 font-mono">Complete</span>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
            <span className="text-3xs font-bold text-emerald-300 block">3. Code Submitted</span>
            <span className="text-4xs text-slate-400 font-mono">Recorded</span>
          </div>

          {/* Step 4 */}
          <div
            className={`p-3.5 rounded-2xl space-y-1 border ${
              hasAiScored
                ? "bg-sky-500/10 border-sky-500/30"
                : "bg-slate-900 border-slate-800 opacity-60"
            }`}
          >
            {hasAiScored ? (
              <CheckCircle2 className="w-4 h-4 text-sky-400 mx-auto" />
            ) : (
              <Clock className="w-4 h-4 text-slate-500 mx-auto" />
            )}
            <span className={`text-3xs font-bold block ${hasAiScored ? "text-sky-300" : "text-slate-400"}`}>
              4. AI Evaluation
            </span>
            <span className="text-4xs text-slate-400 font-mono">
              {hasAiScored ? "Completed" : "Queued"}
            </span>
          </div>

          {/* Step 5 */}
          <div
            className={`p-3.5 rounded-2xl space-y-1 border ${
              hasHumanScored
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-slate-900 border-slate-800 opacity-60"
            }`}
          >
            {hasHumanScored ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
            ) : (
              <Clock className="w-4 h-4 text-slate-500 mx-auto" />
            )}
            <span className={`text-3xs font-bold block ${hasHumanScored ? "text-emerald-300" : "text-slate-400"}`}>
              5. Expert Validation
            </span>
            <span className="text-4xs text-slate-400 font-mono">
              {hasHumanScored ? "Validated" : "In Review"}
            </span>
          </div>

          {/* Step 6 */}
          <div
            className={`p-3.5 rounded-2xl space-y-1 border ${
              hasHumanScored
                ? "bg-indigo-500/10 border-indigo-500/30"
                : "bg-slate-900 border-slate-800 opacity-60"
            }`}
          >
            <Trophy className={`w-4 h-4 mx-auto ${hasHumanScored ? "text-indigo-400" : "text-slate-500"}`} />
            <span className={`text-3xs font-bold block ${hasHumanScored ? "text-indigo-300" : "text-slate-400"}`}>
              6. Final Standings
            </span>
            <span className="text-4xs text-slate-400 font-mono">
              {hasHumanScored ? "Published" : "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* DETAIL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Project Description & System Overview
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {submission.description}
            </p>
          </div>

          {/* Members */}
          <div className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-brand-400" />
              Team Roster ({submission.team?.members?.length || 0})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {submission.team?.members?.map((m) => (
                <div key={m._id} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs space-y-0.5">
                  <p className="font-bold text-white">{m.name}</p>
                  <p className="text-slate-400 text-3xs font-mono">{m.email}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: Grading Panel for Judges */}
        <div className="space-y-6">
          {user && user.role === "judge" && (
            <div className="glass-panel border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {myScoreRecord ? "Update Evaluation" : "Grade Submission"}
                </h3>
                <span className="text-xs font-mono font-bold text-brand-300 bg-brand-500/15 px-2.5 py-0.5 rounded-full border border-brand-500/30">
                  Total: {calculatedTotal} / 40
                </span>
              </div>

              {scoreError && (
                <p className="p-3 bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 rounded-xl">
                  {scoreError}
                </p>
              )}

              <form onSubmit={handleScoreSubmit} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-3xs font-semibold text-slate-400 mb-1.5">
                    <span className="uppercase">Innovation (0-10)</span>
                    <span className="text-white font-mono font-bold">{innovation} / 10</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    value={innovation}
                    onChange={(e) => setInnovation(Number(e.target.value))}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-3xs font-semibold text-slate-400 mb-1.5">
                    <span className="uppercase">Technical Implementation (0-10)</span>
                    <span className="text-white font-mono font-bold">{technicalImplementation} / 10</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    value={technicalImplementation}
                    onChange={(e) => setTechnicalImplementation(Number(e.target.value))}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-3xs font-semibold text-slate-400 mb-1.5">
                    <span className="uppercase">Impact (0-10)</span>
                    <span className="text-white font-mono font-bold">{impact} / 10</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    value={impact}
                    onChange={(e) => setImpact(Number(e.target.value))}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-3xs font-semibold text-slate-400 mb-1.5">
                    <span className="uppercase">Presentation (0-10)</span>
                    <span className="text-white font-mono font-bold">{presentation} / 10</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    value={presentation}
                    onChange={(e) => setPresentation(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-3xs font-semibold text-slate-400 uppercase mb-1.5">
                    Constructive Feedback:
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-brand-500 focus:outline-none resize-none"
                    placeholder="Provide actionable feedback for the team..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  loading={scoreSubmitting}
                >
                  {myScoreRecord ? "Update Evaluation" : "Submit Evaluation"}
                </Button>
              </form>
            </div>
          )}

          {/* Participant Info Card */}
          {user && user.role === "participant" && (
            <div className="glass-panel border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                Submission Protection
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your submission is protected under IEEE empirical evaluation protocols. Scoring rubrics and expert validations are logged immutably.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-emerald-400 border-emerald-500/30"
                onClick={() => setFeedbackModalOpen(true)}
              >
                Inspect Feedback Dossier
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Explainable Feedback Modal */}
      {feedbackModalOpen && (
        <SubmissionFeedbackModal
          isOpen={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          submissionId={submission._id}
        />
      )}
    </div>
  );
};

export default SubmissionDetailsPage;
