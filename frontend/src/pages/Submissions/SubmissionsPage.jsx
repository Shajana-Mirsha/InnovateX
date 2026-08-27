import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllSubmissions } from "../../api/submissionApi";
import { getAllTeams } from "../../api/teamApi";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { Code, ExternalLink, ArrowRight, Layers, FileCode } from "lucide-react";

const SubmissionsPage = () => {
  const { user } = useAuth();
  
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSubmissions = async () => {
    setLoading(true);
    setError("");
    try {
      const subRes = await getAllSubmissions();
      
      if (subRes.success) {
        let list = subRes.submissions || [];
        
        if (user.role === "participant") {
          // Find teams user belongs to
          const teamRes = await getAllTeams();
          if (teamRes.success) {
            const userTeamIds = (teamRes.teams || [])
              .filter(
                (t) =>
                  t.leader?._id === user.id ||
                  t.members?.some((m) => m._id === user.id)
              )
              .map((t) => t._id);

            // Filter submissions submitted by user or belonging to user's teams
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Project Submissions"
        description={
          user.role === "participant"
            ? "View project solution reports submitted by your teams."
            : "Review project submissions across all hosted events."
        }
        action={
          user && user.role === "participant" ? (
            <Link to="/submissions/create">
              <Button variant="primary" icon={Code}>
                Submit New Project
              </Button>
            </Link>
          ) : null
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchSubmissions} />
      ) : submissions.length === 0 ? (
        <EmptyState
          title="No Project Submissions"
          message={
            user.role === "participant"
              ? "Your team hasn't submitted a project yet. Register and submit before the event deadline."
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
              className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xs font-semibold text-slate-400">
                    Event: {sub.hackathon?.title}
                  </span>
                  <span className="inline-flex items-center text-4xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                    Submitted
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800 line-clamp-1">
                    {sub.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {sub.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-50 text-3xs text-slate-500 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Team: <span className="text-slate-700">{sub.team?.name}</span></span>
                  </div>
                  {sub.githubLink && (
                    <a
                      href={sub.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-sky-600 transition"
                    >
                      <FileCode className="w-3.5 h-3.5 text-slate-400" />
                      GitHub Repo
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-3xs text-slate-400 font-medium">
                  Submitted by: {sub.submittedBy?.name || "Member"}
                </span>
                <Link
                  to={`/submissions/${sub._id}`}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
                >
                  Review Details & Scores
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubmissionsPage;
