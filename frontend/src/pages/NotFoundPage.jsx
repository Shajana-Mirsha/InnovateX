import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import Button from "../components/common/Button";

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-rose-50 text-rose-500">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">404</h1>
      <h2 className="text-lg font-bold text-slate-800 mt-2">Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        The page you are looking for does not exist or has been moved to a new URL.
      </p>
      <div className="mt-8 flex gap-4">
        <Link to="/">
          <Button variant="outline" icon={Home}>
            Home
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="primary" icon={ArrowLeft}>
            Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
