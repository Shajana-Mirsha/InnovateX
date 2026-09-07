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
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white border border-transparent",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-slate-400 border border-slate-200",
    outline:
      "bg-white hover:bg-slate-50 text-slate-700 font-medium border border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-blue-500 shadow-sm",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm focus:ring-2 focus:ring-rose-500",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm focus:ring-2 focus:ring-emerald-500",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-medium",
    amber:
      "bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm focus:ring-2 focus:ring-amber-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  return (
    <motion.button
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      type={type}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" color={variant === "outline" || variant === "ghost" || variant === "secondary" ? "blue" : "white"} className="mr-2" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </motion.button>
  );
};

export default Button;
