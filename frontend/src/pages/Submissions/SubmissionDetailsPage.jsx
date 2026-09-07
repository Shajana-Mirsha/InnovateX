import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getSubmissionById } from "../../api/submissionApi";
import { getSubmissionScores, createScore, updateScore } from "../../api/scoreApi";
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
import JudgeScoreReviewModal from "../Judge/JudgeScoreReviewModal";
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

  // Dynamic Rubric Scoring state (Judges only)
  const [criterionScores, setCriterionScores] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [scoreSubmitting, setScoreSubmitting] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [judgeModalOpen, setJudgeModalOpen] = useState(false);

  // Participant feedback modal
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const fetchSubmissionDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const subRes = await getSubmissionById(id);
      if (subRes.success) {
        setSubmission(subRes.submission);
        
        // Initialize dynamic criteria based on hackathon criteria
        const criteria = subRes.submission?.hackathon?.criteria?.length > 0
          ? subRes.submission.hackathon.criteria
          : [
              { name: "innovation", weight: 1, maxScore: 10 },
              { name: "technicalImplementation", weight: 1, maxScore: 10 },
              { name: "impact", weight: 1, maxScore: 10 },
              { name: "presentation", weight: 1, maxScore: 10 }
            ];

        setCriterionScores(
          criteria.map((c) => ({
            criterion: c.name,
            score: 5,
            rationale: ""
          }))
        );
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
                setFeedback(myGrading.feedback || myGrading.overallComments || "");
                if (myGrading.criterionScores?.length > 0) {
                  setCriterionScores(
                    myGrading.criterionScores.map((c) => ({
                      criterion: c.criterion,
                      score: c.score,
                      rationale: c.rationale || ""
                    }))
                  );
                }
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
      criterionScores: criterionScores.map((c) => ({
        criterion: c.criterion,
        score: Number(c.score),
        rationale: c.rationale || ""
      })),
      feedback,
    };

    try {
      let res;
      if (myScoreRecord) {
        res = await updateScore(myScoreRecord._id, {
          criterionScores: scoreData.criterionScores,
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

  const calculatedTotal = Math.round(
    criterionScores.reduce((sum, item) => sum + (Number(item.score) || 0), 0) * 100
  ) / 100;
  const maxPossibleTotal = (submission.hackathon?.criteria?.length || criterionScores.length || 4) * 10;

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <Link
          to="/submissions"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Submissions
        </Link>
      </div>

      {/* HEADER CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xs font-semibold text-blue-600 uppercase tracking-wider">
              Challenge: {submission.hackathon?.title || "National Hackathon"}
            </span>
            {isDeadlinePassed ? (
              <span className="px-2.5 py-0.5 text-2xs font-semibold rounded-full bg-slate-200 text-slate-700 uppercase">
                Submission Closed
              </span>
            ) : daysRemaining !== null ? (
              <span className="px-2.5 py-0.5 text-2xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
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
              className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 bg-white"
            >
              View Assessment Feedback
            </Button>
            {user && (user.role === "admin" || user.role === "organizer" || user.role === "judge") && (
              <div className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Avg: {averageScore.toFixed(1)} / 40</span>
              </div>
            )}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{submission.title}</h1>
        <p className="text-xs text-slate-500">
          Developed by Team: <strong className="text-slate-800">{submission.team?.name || "N/A"}</strong>
        </p>

        {/* Links */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
          {submission.githubLink && (
            <a
              href={submission.githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              <FileCode className="w-4 h-4 text-blue-600" />
              GitHub Repository
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {submission.demoLink && (
            <a
              href={submission.demoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition"
            >
              <Tv className="w-4 h-4 text-emerald-600" />
              Live Demo
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {submission.presentationLink && (
            <a
              href={submission.presentationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              <Presentation className="w-4 h-4 text-indigo-600" />
              Presentation Deck
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>

      {/* SUBMISSION STATUS TIMELINE */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Project Evaluation Status Timeline
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
            <span className="text-2xs font-bold text-emerald-800 block">1. Registration</span>
            <span className="text-2xs text-slate-500 font-medium">Approved</span>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
            <span className="text-2xs font-bold text-emerald-800 block">2. Team Formation</span>
            <span className="text-2xs text-slate-500 font-medium">Complete</span>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
            <span className="text-2xs font-bold text-emerald-800 block">3. Code Submitted</span>
            <span className="text-2xs text-slate-500 font-medium">Recorded</span>
          </div>

          {/* Step 4 */}
          <div
            className={`p-3.5 rounded-xl space-y-1 border ${
              hasAiScored
                ? "bg-sky-50 border-sky-200"
                : "bg-slate-50 border-slate-200 opacity-60"
            }`}
          >
            {hasAiScored ? (
              <CheckCircle2 className="w-4 h-4 text-sky-600 mx-auto" />
            ) : (
              <Clock className="w-4 h-4 text-slate-400 mx-auto" />
            )}
            <span className={`text-2xs font-bold block ${hasAiScored ? "text-sky-800" : "text-slate-500"}`}>
              4. AI Evaluation
            </span>
            <span className="text-2xs text-slate-400 font-medium">
              {hasAiScored ? "Completed" : "Queued"}
            </span>
          </div>

          {/* Step 5 */}
          <div
            className={`p-3.5 rounded-xl space-y-1 border ${
              hasHumanScored
                ? "bg-emerald-50 border-emerald-200"
                : "bg-slate-50 border-slate-200 opacity-60"
            }`}
          >
            {hasHumanScored ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
            ) : (
              <Clock className="w-4 h-4 text-slate-400 mx-auto" />
            )}
            <span className={`text-2xs font-bold block ${hasHumanScored ? "text-emerald-800" : "text-slate-500"}`}>
              5. Expert Validation
            </span>
            <span className="text-2xs text-slate-400 font-medium">
              {hasHumanScored ? "Validated" : "In Review"}
            </span>
          </div>

          {/* Step 6 */}
          <div
            className={`p-3.5 rounded-xl space-y-1 border ${
              hasHumanScored
                ? "bg-indigo-50 border-indigo-200"
                : "bg-slate-50 border-slate-200 opacity-60"
            }`}
          >
            <Trophy className={`w-4 h-4 mx-auto ${hasHumanScored ? "text-indigo-600" : "text-slate-400"}`} />
            <span className={`text-2xs font-bold block ${hasHumanScored ? "text-indigo-800" : "text-slate-500"}`}>
              6. Final Standings
            </span>
            <span className="text-2xs text-slate-400 font-medium">
              {hasHumanScored ? "Published" : "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* DETAIL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Project Description & System Overview
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {submission.description}
            </p>
          </div>

          {/* Members */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-blue-600" />
              Team Roster ({submission.team?.members?.length || 0})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {submission.team?.members?.map((m) => (
                <div key={m._id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-0.5">
                  <p className="font-bold text-slate-900">{m.name}</p>
                  <p className="text-slate-500 text-2xs font-medium">{m.email}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: Grading Panel for Judges */}
        <div className="space-y-6">
          {user && user.role === "judge" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  {myScoreRecord ? "Update Evaluation" : "Grade Submission"}
                </h3>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Total: {calculatedTotal} / {maxPossibleTotal}
                </span>
              </div>

              {scoreError && (
                <p className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
                  {scoreError}
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Gavel}
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 bg-white"
                onClick={() => setJudgeModalOpen(true)}
              >
                Comprehensive Judging Workspace
              </Button>

              <form onSubmit={handleScoreSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                {criterionScores.map((cs, idx) => (
                  <div key={cs.criterion}>
                    <div className="flex justify-between items-center text-2xs font-semibold text-slate-500 mb-1.5">
                      <span className="capitalize">{cs.criterion} (0-10)</span>
                      <span className="text-slate-900 font-bold">{cs.score} / 10</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      value={cs.score}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCriterionScores((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, score: val } : item))
                        );
                      }}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-2xs font-semibold text-slate-500 uppercase mb-1.5">
                    Constructive Feedback:
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none resize-none transition"
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Submission Protection
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your submission is protected under IEEE empirical evaluation protocols. Scoring rubrics and expert validations are logged immutably.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-50 bg-white"
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

      {/* Comprehensive Judge Score Review Modal */}
      {judgeModalOpen && (
        <JudgeScoreReviewModal
          isOpen={judgeModalOpen}
          onClose={() => setJudgeModalOpen(false)}
          submission={submission}
          score={myScoreRecord}
          onValidated={() => {
            setJudgeModalOpen(false);
            fetchSubmissionDetails();
          }}
        />
      )}
    </div>
  );
};

export default SubmissionDetailsPage;
