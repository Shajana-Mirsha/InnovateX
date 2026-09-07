import React from "react";

const StatusBadge = ({ status, label: customLabel, count }) => {
  const statusStyles = {
    // Hackathon Statuses
    upcoming: "bg-blue-50 text-blue-700 border-blue-200",
    registration_open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ongoing: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-slate-100 text-slate-700 border-slate-300",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200",

    // Registration Statuses
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",

    // Team Statuses
    open: "bg-sky-50 text-sky-700 border-sky-200",
    full: "bg-amber-50 text-amber-700 border-amber-200",
    closed: "bg-slate-100 text-slate-600 border-slate-300",

    // Submission Statuses
    draft: "bg-slate-100 text-slate-600 border-slate-300",
    submitted: "bg-emerald-50 text-emerald-700 border-emerald-200",

    // IEEE Research Evaluation Statuses
    ai_scored: "bg-sky-50 text-sky-700 border-sky-200",
    human_validated: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium",
    unscored: "bg-slate-100 text-slate-600 border-slate-200",
    scoring: "bg-blue-50 text-blue-700 border-blue-200 animate-pulse",
    similarity_flag: "bg-amber-50 text-amber-700 border-amber-200 font-medium",
    duplicate: "bg-rose-50 text-rose-700 border-rose-200 font-medium"
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
    statusStyles[status] || "bg-slate-100 text-slate-700 border-slate-300";
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
