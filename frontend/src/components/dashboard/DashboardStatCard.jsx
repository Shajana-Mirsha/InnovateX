import React from "react";

const DashboardStatCard = ({
  title,
  value,
  icon: Icon,
  description = null,
  color = "sky",
}) => {
  const colorStyles = {
    sky: "bg-sky-50 text-sky-600 border-sky-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
  };

  const styleClass = colorStyles[color] || colorStyles.sky;

  return (
    <div className="flex items-center p-5 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition duration-200">
      <div className={`p-3 rounded-lg border ${styleClass} mr-4 shrink-0`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          {title}
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-800 leading-none">
          {value}
        </p>
        {description && (
          <p className="mt-1.5 text-xs font-medium text-slate-500 leading-none">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardStatCard;
