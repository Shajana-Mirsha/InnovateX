import React from "react";
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
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-sky-600 hover:bg-sky-700 text-white border border-transparent focus:ring-sky-500 shadow-sm",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 focus:ring-slate-400",
    outline:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 focus:ring-sky-500 shadow-sm",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white border border-transparent focus:ring-rose-500 shadow-sm",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white border border-transparent focus:ring-emerald-500 shadow-sm",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-300",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" color={variant === "secondary" || variant === "outline" || variant === "ghost" ? "gray" : "white"} className="mr-2" />
      ) : Icon ? (
        <Icon className="w-4 h-4 mr-2" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
