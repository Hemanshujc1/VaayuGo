import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        endPage = 5;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between border-t border-neutral-mid px-4 py-3 sm:px-6 mt-4 bg-neutral-dark/30 rounded-b-lg">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center rounded-md border border-neutral-mid bg-neutral-dark px-4 py-2 text-sm font-medium text-white hover:bg-neutral-mid transition-colors ${
            currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`relative ml-3 inline-flex items-center rounded-md border border-neutral-mid bg-neutral-dark px-4 py-2 text-sm font-medium text-white hover:bg-neutral-mid transition-colors ${
            currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-neutral-light">
            Showing Page{" "}
            <span className="font-medium text-white">{currentPage}</span> of{" "}
            <span className="font-medium text-white">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-md shadow-sm"
            aria-label="Pagination"
          >
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-neutral-light ring-1 ring-inset ring-neutral-mid hover:bg-neutral-mid hover:text-white focus:z-20 focus:outline-offset-0 transition-colors ${
                currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span className="sr-only">Previous</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {getPageNumbers().map((number) => (
              <button
                key={number}
                onClick={() => onPageChange(number)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-neutral-mid focus:z-20 focus:outline-offset-0 transition-colors ${
                  currentPage === number
                    ? "z-10 bg-accent text-primary outline outline-accent shadow-accent/20 shadow-md"
                    : "text-white hover:bg-neutral-mid"
                }`}
              >
                {number}
              </button>
            ))}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-neutral-light ring-1 ring-inset ring-neutral-mid hover:bg-neutral-mid hover:text-white focus:z-20 focus:outline-offset-0 transition-colors ${
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <span className="sr-only">Next</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
