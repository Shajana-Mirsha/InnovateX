import React from "react";

const StatusBadge = ({ status, label: customLabel, count }) => {
  const statusStyles = {
    // Hackathon Statuses
    upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    registration_open: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    ongoing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    completed: "bg-slate-500/10 text-slate-300 border-slate-700",
    cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",

    // Registration Statuses
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",

    // Team Statuses
    open: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    full: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    closed: "bg-slate-500/10 text-slate-400 border-slate-700",

    // Submission Statuses
    draft: "bg-slate-500/10 text-slate-400 border-slate-700",
    submitted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",

    // IEEE Research Evaluation Statuses
    ai_scored: "bg-sky-500/10 text-sky-300 border-sky-500/30",
    human_validated: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-medium",
    unscored: "bg-slate-800 text-slate-400 border-slate-700",
    scoring: "bg-brand-500/15 text-brand-300 border-brand-500/30 animate-pulse",
    similarity_flag: "bg-amber-500/15 text-amber-300 border-amber-500/30 font-medium",
    duplicate: "bg-rose-500/15 text-rose-300 border-rose-500/30 font-medium"
  };

  const labels = {
    upcoming: "Upcoming",
    registration_open: "Registration Open",
    ongoing: "Ongoing",
    completed: "Completed",
    cancelled: "Cancelled",
    pending: "Pending Approval",
    approved: "Approved",
    rejected: "Rejected",
    open: "Open for Members",
    full: "Team Full",
    closed: "Closed",
    draft: "Draft",
    submitted: "Submitted",
    ai_scored: "AI Baseline Score",
    human_validated: "Human Validated",
    unscored: "Unscored",
    scoring: "AI Scoring...",
    similarity_flag: "Similarity Warning",
    duplicate: "Duplicate Flagged"
  };

  const styleClass =
    statusStyles[status] || "bg-slate-800 text-slate-300 border-slate-700";
  const label = customLabel || labels[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${styleClass}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current"></span>
      {label}
      {count !== undefined && <span className="ml-1 opacity-80">({count})</span>}
    </span>
  );
};

export default StatusBadge;
