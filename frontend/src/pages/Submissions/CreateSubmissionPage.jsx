import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getMyRegistrations } from "../../api/registrationApi";
import { createSubmission } from "../../api/submissionApi";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import { ArrowLeft, Code } from "lucide-react";

const CreateSubmissionPage = () => {
  const navigate = useNavigate();

  const [approvedRegs, setApprovedRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
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
          // Only show approved registrations
          const approved = (data.registrations || []).filter(
            (r) => r.status === "approved"
          );
          setApprovedRegs(approved);
        }
      } catch (err) {
        console.error(err);
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
    setSuccess("");

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
      hackathonId: selectedReg.hackathon?._id,
      teamId: selectedReg.team?._id,
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
        setSuccess("Project solution submitted successfully!");
        setTimeout(() => {
          navigate("/submissions");
        }, 1500);
      }
    } catch (err) {
      console.error(err);
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
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
        <div>
          <Link
            to="/submissions"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Submissions
          </Link>
        </div>
        <EmptyState
          title="No Approved Registrations"
          message="You can only submit project solutions once your team registration has been approved by the organizers."
          actionButton={
            <Link to="/registrations">
              <Button variant="primary">Check My Registrations</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-200">
      <div>
        <Link
          to="/submissions"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Submissions
        </Link>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Code className="w-5 h-5 text-sky-600" />
            Submit Hackathon Project
          </h2>
          <p className="text-4xs text-slate-400 mt-1">
            Publish your codebase repository and build details. Only the Team Leader can submit.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-800 font-medium">
              {success}
            </div>
          )}

          <div>
            <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
              Select Approved Hackathon Team *
            </label>
            <select
              className="block w-full text-xs font-medium text-slate-855 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={selectedRegIndex}
              onChange={(e) => setSelectedRegIndex(Number(e.target.value))}
            >
              {approvedRegs.map((reg, idx) => (
                <option key={reg._id} value={idx}>
                  Team: {reg.team?.name} — Event: {reg.hackathon?.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
              Project / Product Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Decentralized Health Tracker"
              className="block w-full text-xs font-medium text-slate-855 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
              Project Description *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe your tech stack, system architecture, core solution, and project implementation..."
              className="block w-full text-xs font-medium text-slate-855 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
              GitHub Repository URL
            </label>
            <input
              type="url"
              placeholder="https://github.com/your-username/repo-name"
              className="block w-full text-xs font-medium text-slate-855 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={githubLink}
              onChange={(e) => setGithubLink(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                Live Demo Link (optional)
              </label>
              <input
                type="url"
                placeholder="https://your-demo-website.com"
                className="block w-full text-xs font-medium text-slate-855 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                value={demoLink}
                onChange={(e) => setDemoLink(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-500 uppercase mb-2">
                Presentation / Slides Link (optional)
              </label>
              <input
                type="url"
                placeholder="https://docs.google.com/presentation/..."
                className="block w-full text-xs font-medium text-slate-855 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                value={presentationLink}
                onChange={(e) => setPresentationLink(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-50">
            <Link to="/submissions">
              <Button variant="outline" type="button" disabled={submitLoading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" loading={submitLoading}>
              Submit Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubmissionPage;
