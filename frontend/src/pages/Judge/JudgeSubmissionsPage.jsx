import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllSubmissions } from "../../api/submissionApi";
import { getAllScores } from "../../api/scoreApi";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import { formatDate } from "../../utils/helpers";
import { Star, CheckCircle, Clock, Gavel, ArrowRight } from "lucide-react";

const JudgeSubmissionsPage = () => {
  const { user } = useAuth();

  const [submissions, setSubmissions] = useState([]);
  const [myScores, setMyScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJudgeWorkspace = async () => {
    setLoading(true);
    setError("");
    try {
      const [subRes, scoreRes] = await Promise.all([
        getAllSubmissions(),
        getAllScores(),
      ]);

      if (subRes.success) {
        setSubmissions(subRes.submissions || []);
      }
      if (scoreRes.success) {
        // Filter scores submitted by this judge
        const filtered = (scoreRes.scores || []).filter(
          (s) => s.judge?._id === user.id
        );
        setMyScores(filtered);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load judge submissions workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJudgeWorkspace();
  }, [user]);

  // Map submissions to determine if scored
  const gradedSubmissionIds = myScores.map((s) => s.submission?._id);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Submissions to Judge"
        description="Review project solutions submitted by participants and score their implementations."
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchJudgeWorkspace} />
      ) : submissions.length === 0 ? (
        <EmptyState
          title="No projects submitted"
          message="There are no project submissions available for evaluation yet."
        />
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-3xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-150">
                  <th className="px-6 py-4">Project Title</th>
                  <th className="px-6 py-4">Hackathon Event</th>
                  <th className="px-6 py-4">Submitting Team</th>
                  <th className="px-6 py-4">My Status</th>
                  <th className="px-6 py-4 text-right">Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => {
                  const isGraded = gradedSubmissionIds.includes(sub._id);
                  const gradeRecord = myScores.find((s) => s.submission?._id === sub._id);

                  return (
                    <tr key={sub._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <Link
                          to={`/submissions/${sub._id}`}
                          className="text-sm font-bold text-slate-800 hover:text-sky-600 underline block"
                        >
                          {sub.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                        {sub.hackathon?.title}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {sub.team?.name}
                      </td>
                      <td className="px-6 py-4">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 text-3xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Graded: {gradeRecord?.totalScore} / 40
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-3xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 animate-pulse">
                            <Clock className="w-3.5 h-3.5 animate-spin duration-3000" />
                            Pending Evaluation
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/submissions/${sub._id}`}>
                          <button className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 px-3.5 py-1.5 rounded-lg transition duration-150">
                            Evaluate
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeSubmissionsPage;
