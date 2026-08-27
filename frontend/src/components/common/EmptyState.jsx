import React from "react";
import { FolderOpen } from "lucide-react";

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = "No data found",
  message = "There's nothing to display right now.",
  actionButton = null,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-100 rounded-xl shadow-sm">
      <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-slate-50 text-slate-400">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-slate-800">{title}</h3>
      <p className="max-w-xs mb-5 text-sm text-slate-500">{message}</p>
      {actionButton}
    </div>
  );
};

export default EmptyState;
