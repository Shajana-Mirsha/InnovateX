import React from "react";

const PageHeader = ({ title, description, action = null, className = "" }) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-slate-100 mb-6 gap-4 ${className}`}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center shrink-0">{action}</div>}
    </div>
  );
};

export default PageHeader;
