import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import {
  Upload,
  Download,
  FileText,
  Archive,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Store,
} from "lucide-react";

const AdminBulkUpload = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const res = await api.get("/admin/shops/all");
      setShops(res.data);
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast.error("Failed to load shops");
    }
  };

  const handleCsvChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
    } else {
      toast.error("Please select a valid CSV file");
      e.target.value = null;
    }
  };

  const handleZipChange = (e) => {
    const file = e.target.files[0];
    if (
      file &&
      (file.type === "application/zip" ||
        file.type === "application/x-zip-compressed")
    ) {
      setZipFile(file);
    } else {
      toast.error("Please select a valid ZIP file");
      e.target.value = null;
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedShopId) {
      toast.error("Please select a target shop");
      return;
    }
    if (!csvFile || !zipFile) {
      toast.error("Both CSV and ZIP files are required");
      return;
    }

    const formData = new FormData();
    formData.append("csv", csvFile);
    formData.append("imagesZip", zipFile);
    formData.append("target_shop_id", selectedShopId);

    setIsUploading(true);
    setResults(null);
    const toastId = toast.loading(
      "Processing bulk upload... This may take a while.",
    );

    try {
      const res = await api.post("/products/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResults(res.data);
      toast.success("Bulk upload completed!", { id: toastId });
    } catch (error) {
      console.error("Bulk upload error:", error);
      const msg = error.response?.data?.message || "Bulk upload failed";
      toast.error(msg, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link
        to="/admin/dashboard"
        className="flex items-center gap-2 text-neutral-light hover:text-accent mb-6 transition-colors group"
      >
        <ChevronLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Back to Dashboard
      </Link>

      <div className="bg-neutral-dark rounded-2xl border border-neutral-mid overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-neutral-mid bg-neutral-mid/10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Bulk Upload
          </h1>
          <p className="text-neutral-light">
            Perform bulk uploads on behalf of any registered shop.
          </p>
        </div>

        <div className="p-8">
          {/* Shop Selection */}
          <div className="mb-10 p-6 bg-primary/50 rounded-xl border border-neutral-mid">
            <div className="flex items-start gap-4">
              <div className="bg-secondary/10 p-3 rounded-lg text-secondary">
                <Store size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-3">
                  Step 1: Select Target Shop
                </h3>
                <select
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  className="w-full bg-neutral-mid text-white border border-neutral-mid p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                >
                  <option value="">-- Choose a Shop --</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name} ({shop.User?.location || "No Location"})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-8">
            {/* File Section Step 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CSV Upload */}
              <div
                className={`relative group p-6 rounded-xl border-2 border-dashed transition-all ${csvFile ? "border-accent bg-accent/5" : "border-neutral-mid hover:border-neutral-light"}`}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isUploading}
                />
                <div className="text-center">
                  <div
                    className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${csvFile ? "bg-accent text-primary" : "bg-neutral-mid text-neutral-light group-hover:text-white"}`}
                  >
                    <Upload size={24} />
                  </div>
                  <h4 className="font-bold text-white mb-1">CSV File</h4>
                  <p className="text-xs text-neutral-light">
                    {csvFile ? csvFile.name : "Click or drag CSV here"}
                  </p>
                </div>
              </div>

              {/* ZIP Upload */}
              <div
                className={`relative group p-6 rounded-xl border-2 border-dashed transition-all ${zipFile ? "border-accent bg-accent/5" : "border-neutral-mid hover:border-neutral-light"}`}
              >
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isUploading}
                />
                <div className="text-center">
                  <div
                    className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${zipFile ? "bg-accent text-primary" : "bg-neutral-mid text-neutral-light group-hover:text-white"}`}
                  >
                    <Archive size={24} />
                  </div>
                  <h4 className="font-bold text-white mb-1">Images ZIP</h4>
                  <p className="text-xs text-neutral-light">
                    {zipFile ? zipFile.name : "Click or drag ZIP here"}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading || !csvFile || !zipFile || !selectedShopId}
              className="w-full py-4 bg-secondary hover:bg-warning text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing Workflow...
                </>
              ) : (
                "Execute Bulk Import"
              )}
            </button>
          </form>

          {/* Results Display */}
          {results && (
            <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 bg-neutral-mid/20 rounded-2xl border border-neutral-mid">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Import Summary
                    {results.errorCount === 0 && (
                      <CheckCircle2 className="text-green-500" size={20} />
                    )}
                  </h3>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">
                        {results.successCount}
                      </p>
                      <p className="text-[10px] text-neutral-light font-bold uppercase">
                        Success
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-danger">
                        {results.errorCount}
                      </p>
                      <p className="text-[10px] text-neutral-light font-bold uppercase">
                        Errors
                      </p>
                    </div>
                  </div>
                </div>

                {results.errors && results.errors.length > 0 && (
                  <div className="bg-primary/50 rounded-lg border border-neutral-mid max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-neutral-dark border-b border-neutral-mid">
                        <tr>
                          <th className="p-3 text-neutral-light font-bold uppercase text-[10px]">
                            Error Report
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.errors.map((err, i) => (
                          <tr
                            key={i}
                            className="border-b border-neutral-mid/50 last:border-0"
                          >
                            <td className="p-3 text-danger/80 flex items-start gap-2">
                              <AlertCircle
                                size={14}
                                className="mt-0.5 shrink-0"
                              />
                              {err}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBulkUpload;
