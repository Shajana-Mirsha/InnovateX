import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getMyRegistrations } from "../../api/registrationApi";
import { createSubmission } from "../../api/submissionApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import { ArrowLeft, Code, Sparkles, FileCode } from "lucide-react";
import { toast } from "sonner";

const CreateSubmissionPage = () => {
  const navigate = useNavigate();

  const [approvedRegs, setApprovedRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedRegIndex, setSelectedRegIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [demoLink, setDemoLink] = useState("");
  const [presentationLink, setPresentationLink] = useState("");

  useEffect(() => {
    const fetchApprovedRegistrations = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getMyRegistrations();
        if (data.success) {
          const approved = (data.registrations || []).filter(
            (r) => r.status === "approved"
          );
          setApprovedRegs(approved);
        }
      } catch (err) {
        setError("Failed to fetch registered hackathons.");
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedRegistrations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (approvedRegs.length === 0) {
      setError("No approved registrations available.");
      return;
    }

    if (!title || !description) {
      setError("Project title and description are required.");
      return;
    }

    const selectedReg = approvedRegs[selectedRegIndex];
    const submissionData = {
      hackathonId: selectedReg.hackathon?._id || selectedReg.hackathon,
      teamId: selectedReg.team?._id || selectedReg.team,
      title,
      description,
      githubLink,
      demoLink,
      presentationLink,
    };

    setSubmitLoading(true);
    try {
      const res = await createSubmission(submissionData);
      if (res.success) {
        toast.success("Project solution submitted successfully!");
        navigate("/submissions");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to submit project. Has your team already submitted?"
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (approvedRegs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 pb-12">
        <div>
          <Link
            to="/submissions"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Submissions
          </Link>
        </div>
        <EmptyState
          icon={FileCode}
          title="No Approved Registrations"
          message="You can only submit project solutions once your team registration has been approved by the challenge organizers."
          actionButton={
            <Link to="/registrations">
              <Button variant="primary" size="sm">Check My Registrations</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-12">
      <div>
        <Link
          to="/submissions"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Submissions
        </Link>
      </div>

      <div className="glass-panel border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-8 py-6 bg-slate-900/90 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-brand-400" />
            Submit Hackathon Project Solution
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Publish your codebase repository and build details for AI and judge evaluation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-3xs font-semibold text-slate-400 uppercase mb-2">
              Select Approved Hackathon Team *
            </label>
            <select
              className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500"
              value={selectedRegIndex}
              onChange={(e) => setSelectedRegIndex(Number(e.target.value))}
            >
              {approvedRegs.map((reg, idx) => (
                <option key={reg._id} value={idx}>
                  Team: {reg.team?.name} — Challenge: {reg.hackathon?.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-3xs font-semibold text-slate-400 uppercase mb-2">
              Project / Product Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Adaptive Decentralized Health Ledger"
              className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-3xs font-semibold text-slate-400 uppercase mb-2">
              Project Description & System Architecture *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe your tech stack, system architecture, core solution algorithms, and implementation details..."
              className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-3xs font-semibold text-slate-400 uppercase mb-2">
              GitHub Repository URL
            </label>
            <input
              type="url"
              placeholder="https://github.com/your-username/repo-name"
              className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500 font-mono"
              value={githubLink}
              onChange={(e) => setGithubLink(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-3xs font-semibold text-slate-400 uppercase mb-2">
                Live Demo Link (optional)
              </label>
              <input
                type="url"
                placeholder="https://your-demo-website.com"
                className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500"
                value={demoLink}
                onChange={(e) => setDemoLink(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-400 uppercase mb-2">
                Presentation / Slides Link (optional)
              </label>
              <input
                type="url"
                placeholder="https://docs.google.com/presentation/..."
                className="block w-full text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-brand-500"
                value={presentationLink}
                onChange={(e) => setPresentationLink(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-800/80">
            <Link to="/submissions">
              <Button variant="outline" type="button" disabled={submitLoading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" loading={submitLoading}>
              Submit Project Solution
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubmissionPage;
