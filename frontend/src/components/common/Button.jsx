import React from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "./LoadingSpinner";

const Button = ({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  onClick,
  icon: Icon,
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-brand-600 hover:bg-brand-500 text-white border border-brand-500/30 focus:ring-brand-500 shadow-md shadow-brand-600/20",
    secondary:
      "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-500",
    outline:
      "bg-transparent hover:bg-slate-800/60 text-slate-300 border border-slate-700 hover:border-slate-600 focus:ring-brand-500",
    danger:
      "bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/30 focus:ring-rose-500 shadow-md shadow-rose-600/20",
    success:
      "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/30 focus:ring-emerald-500 shadow-md shadow-emerald-600/20",
    ghost:
      "bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 focus:ring-slate-500",
    amber:
      "bg-amber-600 hover:bg-amber-500 text-white border border-amber-500/30 focus:ring-amber-500 shadow-md shadow-amber-600/20"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  return (
    <motion.button
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      whileHover={!disabled && !loading ? { scale: 1.01 } : {}}
      type={type}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" color="white" className="mr-2" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </motion.button>
  );
};

export default Button;
