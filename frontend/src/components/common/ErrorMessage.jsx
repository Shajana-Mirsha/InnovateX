import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "./Button";

const ErrorMessage = ({
  message = "An error occurred while loading this data.",
  retryAction = null,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center bg-rose-50 border border-rose-100 rounded-xl">
      <div className="flex items-center justify-center w-10 h-10 mb-3 rounded-full bg-rose-100 text-rose-600">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-rose-800">Failed to load</h3>
      <p className="max-w-md mb-4 text-xs text-rose-600">{message}</p>
      {retryAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={retryAction}
          icon={RefreshCw}
          className="bg-white border-rose-200 hover:bg-rose-100 hover:text-rose-700 text-rose-600"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorMessage;
