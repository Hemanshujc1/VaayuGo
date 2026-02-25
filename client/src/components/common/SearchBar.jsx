import React from "react";
import { Search } from "lucide-react"; // Assuming lucide-react is installed, common in modern react projects. We will use a simple SVG if not available.

const SearchBar = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-neutral-light"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full pl-10 pr-3 py-2 border border-neutral-mid rounded-md leading-5 bg-neutral-dark text-white placeholder-neutral-light focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent sm:text-sm transition duration-150 ease-in-out"
      />
      {value && (
        <button
          onClick={() => onChange({ target: { value: "" } })}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-light hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
