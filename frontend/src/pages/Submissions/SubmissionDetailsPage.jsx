import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getSubmissionById } from "../../api/submissionApi";
import { getSubmissionScores, createScore, updateScore } from "../../api/scoreApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import {
  Code,
  GitBranch,
  Tv,
  Presentation,
  Users,
  Trophy,
  Star,
  ArrowLeft,
  Calendar,
  MessageSquare,
} from "lucide-react";

const SubmissionDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Scoring states (for admin/organizer/judges)
  const [scores, setScores] = useState([]);
  const [averageScore, setAverageScore] = useState(0);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [myScoreRecord, setMyScoreRecord] = useState(null); // Judge's existing score

  // Score Form states (Judges only)
  const [innovation, setInnovation] = useState(5);
  const [technicalImplementation, setTechnicalImplementation] = useState(5);
  const [impact, setImpact] = useState(5);
  const [presentation, setPresentation] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [scoreSubmitting, setScoreSubmitting] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [scoreSuccess, setScoreSuccess] = useState("");

  const fetchSubmissionDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const subRes = await getSubmissionById(id);
      if (subRes.success) {
        setSubmission(subRes.submission);
      }

      // Check access to scores (Only admin, organizer, judge)
      if (user && (user.role === "admin" || user.role === "organizer" || user.role === "judge")) {
        setScoresLoading(true);
        try {
          const scoreRes = await getSubmissionScores(id);
          if (scoreRes.success) {
            setScores(scoreRes.scores || []);
            setAverageScore(scoreRes.averageScore || 0);

            // If user is judge, check if they already scored it
            if (user.role === "judge") {
              const myGrading = (scoreRes.scores || []).find(
                (s) => s.judge?._id === user.id
              );
              if (myGrading) {
                setMyScoreRecord(myGrading);
                setInnovation(myGrading.innovation);
                setTechnicalImplementation(myGrading.technicalImplementation);
                setImpact(myGrading.impact);
                setPresentation(myGrading.presentation);
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
      console.error(err);
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
    setScoreSuccess("");
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
        // Update score
        res = await updateScore(myScoreRecord._id, {
          innovation: Number(innovation),
          technicalImplementation: Number(technicalImplementation),
          impact: Number(impact),
          presentation: Number(presentation),
          feedback,
        });
      } else {
        // Create new score
        res = await createScore(scoreData);
      }

      if (res.success) {
        setScoreSuccess(
          myScoreRecord ? "Score updated successfully!" : "Score submitted successfully!"
        );
        // Refresh scores list
        const scoreRes = await getSubmissionScores(id);
        if (scoreRes.success) {
          setScores(scoreRes.scores || []);
          setAverageScore(scoreRes.averageScore || 0);
          const myGrading = (scoreRes.scores || []).find(
            (s) => s.judge?._id === user.id
          );
          if (myGrading) setMyScoreRecord(myGrading);
        }
      }
    } catch (err) {
      console.error(err);
      setScoreError(err.response?.data?.message || "Failed to submit score details.");
    } finally {
      setScoreSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
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
      <div className="bg-white border border-slate-100 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-3xs font-semibold text-slate-400 uppercase">
            Hackathon Challenge: {submission.hackathon?.title}
          </span>
          {user && (user.role === "admin" || user.role === "organizer" || user.role === "judge") && (
            <div className="flex items-center gap-1 text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
              <Star className="w-4 h-4 text-sky-500 fill-sky-500" />
              <span>Avg Score: {averageScore.toFixed(2)} / 40</span>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-850">{submission.title}</h1>
        <p className="text-xs text-slate-500">
          Team: <span className="font-semibold text-slate-700">{submission.team?.name}</span>
        </p>

        {/* Links */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-50">
          {submission.githubLink && (
            <a
              href={submission.githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 transition"
            >
              <GitBranch className="w-4 h-4 text-slate-500" />
              GitHub Repository
            </a>
          )}
          {submission.demoLink && (
            <a
              href={submission.demoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 transition"
            >
              <Tv className="w-4 h-4 text-slate-500" />
              Live Product Demo
            </a>
          )}
          {submission.presentationLink && (
            <a
              href={submission.presentationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 transition"
            >
              <Presentation className="w-4 h-4 text-slate-500" />
              Project Presentation
            </a>
          )}
        </div>
      </div>

      {/* DETAIL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Description & Team Members */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2.5 mb-4">
              Project Description
            </h3>
            <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-wrap">
              {submission.description}
            </p>
          </div>

          {/* Members */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2.5 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              Team Members ({submission.team?.members?.length || 0})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {submission.team?.members?.map((m) => (
                <div key={m._id} className="p-3 border border-slate-50 rounded-lg text-xs">
                  <p className="font-semibold text-slate-700">{m.name}</p>
                  <p className="text-slate-400 text-3xs mt-0.5">{m.email}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: Grading Panel for Judges or Leaderboard preview for Admin */}
        <div className="space-y-6">
          {/* Judge Grading panel */}
          {user && user.role === "judge" && (
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-5">
              <div className="border-b border-slate-50 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5">
                  <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
                  {myScoreRecord ? "Update Evaluation" : "Grade Submission"}
                </h3>
                <span className="text-xs font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                  Total: {calculatedTotal} / 40
                </span>
              </div>

              {scoreError && (
                <p className="p-2.5 bg-rose-50 border border-rose-100 text-xs text-rose-800 font-medium rounded-lg">
                  {scoreError}
                </p>
              )}
              {scoreSuccess && (
                <p className="p-2.5 bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 font-medium rounded-lg">
                  {scoreSuccess}
                </p>
              )}

              <form onSubmit={handleScoreSubmit} className="space-y-4">
                {/* Innovation */}
                <div>
                  <div className="flex justify-between items-center text-3xs font-semibold text-slate-500 mb-1.5">
                    <span className="uppercase">Innovation (0-10)</span>
                    <span className="text-slate-800 text-xs font-bold">{innovation} / 10</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
                    value={innovation}
                    onChange={(e) => setInnovation(Number(e.target.value))}
                  />
                </div>

                {/* Technical Implementation */}
                <div>
                  <div className="flex justify-between items-center text-3xs font-semibold text-slate-500 mb-1.5">
                    <span className="uppercase">Technical Implementation (0-10)</span>
                    <span className="text-slate-800 text-xs font-bold">{technicalImplementation} / 10</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
                    value={technicalImplementation}
                    onChange={(e) => setTechnicalImplementation(Number(e.target.value))}
                  />
                </div>

                {/* Impact */}
                <div>
                  <div className="flex justify-between items-center text-3xs font-semibold text-slate-500 mb-1.5">
                    <span className="uppercase">Impact (0-10)</span>
                    <span className="text-slate-800 text-xs font-bold">{impact} / 10</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
                    value={impact}
                    onChange={(e) => setImpact(Number(e.target.value))}
                  />
                </div>

                {/* Presentation */}
                <div>
                  <div className="flex justify-between items-center text-3xs font-semibold text-slate-500 mb-1.5">
                    <span className="uppercase">Presentation (0-10)</span>
                    <span className="text-slate-800 text-xs font-bold">{presentation} / 10</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
                    value={presentation}
                    onChange={(e) => setPresentation(Number(e.target.value))}
                  />
                </div>

                {/* Feedback */}
                <div>
                  <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                    General Feedback
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide constructive review comments for the developers..."
                    className="block w-full text-xs font-medium text-slate-855 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={scoreSubmitting}
                >
                  {myScoreRecord ? "Save Score Changes" : "Submit Score Cards"}
                </Button>
              </form>
            </div>
          )}

          {/* Organizer / Admin scores viewing panel */}
          {user && (user.role === "admin" || user.role === "organizer" || user.role === "judge") && (
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-850 border-b border-slate-50 pb-2.5 flex items-center gap-2">
                <Star className="w-4.5 h-4.5 text-slate-400" />
                Score Records ({scores.length})
              </h3>

              {scoresLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : scores.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No score evaluations submitted yet.</p>
              ) : (
                <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto pr-1">
                  {scores.map((sc) => (
                    <div key={sc._id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{sc.judge?.name}</p>
                        <p className="text-3xs text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {sc.feedback || "No feedback comments."}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-700 shrink-0">
                        {sc.totalScore} / 40
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailsPage;
