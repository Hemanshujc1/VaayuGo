import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ExportWidget = ({ data = [], columns = [], filename = "Export" }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Default: check all columns
  const [selectedCols, setSelectedCols] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {}),
  );

  const handleToggleCol = (key) => {
    setSelectedCols((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeColumns = columns.filter((col) => selectedCols[col.key]);

  const handleCsvExport = () => {
    if (activeColumns.length === 0 || data.length === 0) return;

    // 1. Create Headers Row
    const headers = activeColumns
      .map((col) => `"${col.label.replace(/"/g, '""')}"`)
      .join(",");

    // 2. Create Data Rows
    const rows = data.map((item) => {
      return activeColumns
        .map((col) => {
          let val = col.accessor ? col.accessor(item) : item[col.key];
          // Handle null/undefined, and escape quotes/commas for CSV compliance
          if (val === null || val === undefined) val = "";
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",");
    });

    // 3. Combine and create Blob
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // 4. Trigger Download
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsOpen(false);
  };

  const handlePdfExport = () => {
    if (activeColumns.length === 0 || data.length === 0) return;

    try {
      const doc = new jsPDF();

      // AutoTable expects array of arrays for bodies
      const tableHeader = activeColumns.map((col) => String(col.label));
      const tableBody = data.map((item) => {
        return activeColumns.map((col) => {
          const val = col.accessor ? col.accessor(item) : item[col.key];
          return val !== null && val !== undefined ? String(val) : "";
        });
      });

      doc.text(`${filename} Report`, 14, 15);

      autoTable(doc, {
        head: [tableHeader],
        body: tableBody,
        startY: 20,
        theme: "striped",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 229, 255], textColor: [0, 0, 0] }, // Theme Accent color
      });

      doc.save(`${filename}.pdf`);
      setIsOpen(false);
    } catch (err) {
      console.error("PDF EXPORT ERROR:", err);
      alert("Failed to generate PDF: " + err.message);
    }
  };

  return (
    <div className="relative inline-block text-left z-20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-neutral-dark border border-neutral-mid rounded-xl text-white font-semibold hover:bg-neutral-mid/50 transition-colors shadow-md"
      >
        <svg
          className="w-5 h-5 text-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Export
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-neutral-dark rounded-xl shadow-2xl border border-neutral-mid/50 z-40 overflow-hidden">
            <div className="p-4 border-b border-neutral-mid">
              <h3 className="text-white font-bold text-lg mb-1">Export Data</h3>
              <p className="text-neutral-light text-xs">
                Select columns to include in the file.
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto p-2">
              {columns.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-3 p-2 hover:bg-neutral-mid/30 rounded cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedCols[col.key]}
                    onChange={() => handleToggleCol(col.key)}
                    className="w-4 h-4 text-accent bg-neutral-mid border-neutral-light rounded focus:ring-accent accent-accent"
                  />
                  <span className="text-white text-sm font-medium">
                    {col.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="p-4 bg-primary/30 border-t border-neutral-mid grid grid-cols-2 gap-2">
              <button
                onClick={handlePdfExport}
                disabled={activeColumns.length === 0}
                className="flex items-center justify-center gap-1 w-full py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                PDF
              </button>
              <button
                onClick={handleCsvExport}
                disabled={activeColumns.length === 0}
                className="flex items-center justify-center gap-1 w-full py-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                CSV
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportWidget;
