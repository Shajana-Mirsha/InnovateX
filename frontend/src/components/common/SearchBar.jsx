import React from "react";
import { Search } from "lucide-react";

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) => {
  return (
    <div className={`relative flex-grow ${className}`}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition duration-150"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
