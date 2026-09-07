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
      className={`flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`}
    >
      <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="mb-1 text-base font-bold text-slate-800 tracking-tight">{title}</h3>
      <p className="max-w-sm mb-6 text-sm text-slate-500 leading-relaxed">{message}</p>
      {actionButton}
    </motion.div>
  );
};

export default EmptyState;
