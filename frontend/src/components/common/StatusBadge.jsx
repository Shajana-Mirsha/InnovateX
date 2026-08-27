import React from "react";

const StatusBadge = ({ status }) => {
  const statusStyles = {
    // Hackathon Statuses
    upcoming: "bg-blue-50 text-blue-700 border-blue-200",
    registration_open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ongoing: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-slate-100 text-slate-700 border-slate-200",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200",

    // Registration Statuses
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",

    // Team Statuses
    open: "bg-sky-50 text-sky-700 border-sky-200",
    full: "bg-amber-50 text-amber-700 border-amber-200",
    closed: "bg-slate-100 text-slate-700 border-slate-200",

    // Submission Statuses
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    submitted: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
  };

  const styleClass =
    statusStyles[status] || "bg-slate-50 text-slate-600 border-slate-200";
  const label = labels[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${styleClass}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current"></span>
      {label}
    </span>
  );
};

export default StatusBadge;
