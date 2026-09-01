import React from "react";
import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = "No data available",
  message = "There are no records to display at this stage.",
  actionButton = null,
  className = ""
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col items-center justify-center p-10 text-center bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-sm ${className}`}
    >
      <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-400 shadow-inner">
        <Icon className="w-7 h-7 text-slate-300" />
      </div>
      <h3 className="mb-1.5 text-base font-semibold text-white tracking-tight">{title}</h3>
      <p className="max-w-sm mb-6 text-sm text-slate-400 leading-relaxed">{message}</p>
      {actionButton}
    </motion.div>
  );
};

export default EmptyState;
