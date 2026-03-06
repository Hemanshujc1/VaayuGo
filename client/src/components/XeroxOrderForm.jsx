import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";

const XeroxOrderForm = ({ shop }) => {
  const { addToCart } = useCart();
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [options, setOptions] = useState({
    copies: 1,
    color: "bw", // bw, color
    sides: "single", // single, double
    binding: "none", // none, spiral
  });

  // Find the Xerox service product to get pricing metadata
  const xeroxProduct = useMemo(() => {
    return (
      (shop.Products || []).find((p) => p.is_xerox_service) ||
      (shop.Products || [])[0]
    );
  }, [shop.Products]);

  const pricing = xeroxProduct?.xerox_metadata || {
    price_per_page_bw: 2,
    price_per_page_color: 10,
    binding_fee_spiral: 30,
    double_side_discount_factor: 0.8,
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Limit check (500MB)
    if (selectedFile.size > 500 * 1024 * 1024) {
      toast.error("File is too large. Max limit is 500MB.");
      return;
    }

    setFile(selectedFile);
    setCalculating(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await api.post("/xerox/calculate-pages", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setPageCount(res.data.pageCount);
        toast.success(`Detected ${res.data.pageCount} pages`);
      }
    } catch (error) {
      console.error("Error calculating pages:", error);
      toast.error("Failed to calculate page count. Defaulting to 1.");
      setPageCount(1);
    } finally {
      setCalculating(false);
    }
  };

  const currentPrice = useMemo(() => {
    if (!pageCount || !pricing) return 0;

    let rate =
      options.color === "bw"
        ? pricing.price_per_page_bw
        : pricing.price_per_page_color;
    let multiplier = pageCount;

    if (options.sides === "double") {
      multiplier = multiplier * (pricing.double_side_discount_factor || 1);
    }

    let total = rate * multiplier * options.copies;

    if (options.binding === "spiral") {
      total += (pricing.binding_fee_spiral || 0) * options.copies;
    }

    return Math.round(total * 100) / 100;
  }, [pageCount, options, pricing]);

  const handleAddToCart = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    try {
      // Final upload for the order (reuse the same file logic or assume we'll re-upload during placement?)
      // For now, we reuse the already uploaded file if we save it, but here we just re-upload to a permanent location
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await api.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fileUrl = uploadRes.data.fileUrl;

      const cartItem = {
        ...xeroxProduct,
        id: `xerox-${Date.now()}`,
        name: `Xerox: ${file.name}`,
        price: currentPrice,
        description: `${options.color === "bw" ? "B&W" : "Color"}, ${options.sides === "single" ? "Single Side" : "Double Side"}${options.binding !== "none" ? `, Binding: ${options.binding}` : ""}`,
        file_url: fileUrl,
        options: { ...options, pageCount },
        is_xerox: true,
      };

      addToCart(cartItem, shop);
      setFile(null);
      setPageCount(0);
      toast.success("Document added to cart");
    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-neutral-dark p-6 rounded-2xl shadow-2xl mt-6 border border-neutral-mid overflow-hidden relative group">
      <div className="absolute top-0 left-0 w-2 h-full bg-accent"></div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Xerox Printing Service
          </h2>
          <p className="text-neutral-light text-sm">
            Upload and configure your documents for professional printing.
          </p>
        </div>
        <div className="bg-accent/10 p-2 rounded-lg border border-accent/20">
          <svg
            className="w-8 h-8 text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-6">
        {/* File Dropzone */}
        <div className="relative">
          <label
            className={`
            flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
            ${file ? "border-success/50 bg-success/5" : "border-neutral-mid hover:border-accent hover:bg-accent/5"}
          `}
          >
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
            />

            {calculating ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4"></div>
                <p className="text-white font-medium">Analyzing Document...</p>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center text-center">
                <div className="bg-success/20 p-3 rounded-full mb-3">
                  <svg
                    className="w-8 h-8 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-white font-bold">{file.name}</p>
                <p className="text-neutral-light text-xs">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • {pageCount}{" "}
                  Pages
                </p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                    setPageCount(0);
                  }}
                  className="mt-4 text-danger text-xs hover:underline"
                >
                  Change File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="bg-neutral-mid p-3 rounded-full mb-3">
                  <svg
                    className="w-8 h-8 text-neutral-light"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="text-white font-medium">
                  Drag & Drop or Click to Upload
                </p>
                <p className="text-neutral-light text-xs mt-1">
                  PDF, DOCX, or Images up to 500MB
                </p>
              </div>
            )}
          </label>
        </div>

        {file && (
          <div className="animate-fadeIn space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-mid/30 p-6 rounded-xl border border-neutral-mid">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-neutral-light mb-2">
                    Copies
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setOptions((prev) => ({
                          ...prev,
                          copies: Math.max(1, prev.copies - 1),
                        }))
                      }
                      className="bg-neutral-mid p-2 rounded-lg hover:bg-neutral-light text-white"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={options.copies}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          copies: parseInt(e.target.value) || 1,
                        })
                      }
                      className="bg-transparent text-center text-xl font-bold text-white w-12 focus:outline-none"
                    />
                    <button
                      onClick={() =>
                        setOptions((prev) => ({
                          ...prev,
                          copies: prev.copies + 1,
                        }))
                      }
                      className="bg-neutral-mid p-2 rounded-lg hover:bg-neutral-light text-white"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-neutral-light mb-2">
                    Color Mode
                  </label>
                  <div className="flex gap-2">
                    {["bw", "color"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setOptions({ ...options, color: mode })}
                        className={`
                          flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all border
                          ${options.color === mode ? "bg-accent text-primary border-accent" : "bg-neutral-mid text-neutral-light border-neutral-mid hover:border-neutral-light"}
                        `}
                      >
                        {mode === "bw" ? "B&W" : "Color"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-neutral-light mb-2">
                    Sidedness
                  </label>
                  <div className="flex gap-2">
                    {["single", "double"].map((side) => (
                      <button
                        key={side}
                        onClick={() => setOptions({ ...options, sides: side })}
                        className={`
                          flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all border
                          ${options.sides === side ? "bg-accent text-primary border-accent" : "bg-neutral-mid text-neutral-light border-neutral-mid hover:border-neutral-light"}
                        `}
                      >
                        {side === "single" ? "Single" : "Double"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-neutral-light mb-2">
                    Binding
                  </label>
                  <div className="flex gap-2">
                    {["none", "spiral"].map((b) => (
                      <button
                        key={b}
                        onClick={() => setOptions({ ...options, binding: b })}
                        className={`
                          flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all border
                          ${options.binding === b ? "bg-accent text-primary border-accent" : "bg-neutral-mid text-neutral-light border-neutral-mid hover:border-neutral-light"}
                        `}
                      >
                        {b === "none" ? "None" : "Spiral"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-primary/50 p-6 rounded-xl border border-neutral-mid">
              <div className="flex justify-between items-center mb-4">
                <span className="text-neutral-light">Estimated Total</span>
                <span className="text-3xl font-bold text-accent">
                  ₹{currentPrice}
                </span>
              </div>
              <div className="text-xs space-y-2 text-neutral-light border-t border-neutral-mid pt-4">
                <div className="flex justify-between">
                  <span>
                    Base Rate ({options.color === "bw" ? "B&W" : "Color"})
                  </span>
                  <span>
                    ₹
                    {options.color === "bw"
                      ? pricing.price_per_page_bw
                      : pricing.price_per_page_color}
                    /page
                  </span>
                </div>
                {options.sides === "double" && (
                  <div className="flex justify-between text-success">
                    <span>Double Sided Discount</span>
                    <span>
                      {(1 - pricing.double_side_discount_factor) * 100}% Off
                    </span>
                  </div>
                )}
                {options.binding === "spiral" && (
                  <div className="flex justify-between">
                    <span>Binding Fee</span>
                    <span>
                      ₹{pricing.binding_fee_spiral} x {options.copies}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={uploading || (shop && !shop.is_open)}
              className={`w-full text-primary py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
                uploading || (shop && !shop.is_open)
                  ? "bg-neutral-light cursor-not-allowed"
                  : "bg-accent hover:bg-secondary hover:text-white"
              }`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  Adding to Basket...
                </>
              ) : shop && !shop.is_open ? (
                "Shop Closed"
              ) : (
                <>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Add Document to Basket
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-start gap-3 bg-accent/5 p-4 rounded-xl border border-accent/20">
        <div className="mt-0.5">
          <svg
            className="w-5 h-5 text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-xs text-neutral-light leading-relaxed">
          <strong>Pro Tip:</strong> Large files may take a few moments to
          process. If you have multiple documents, merge them into a single PDF
          for easier handling.
        </p>
      </div>
    </div>
  );
};

export default XeroxOrderForm;
