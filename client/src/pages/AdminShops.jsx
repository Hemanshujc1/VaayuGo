import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import SearchBar from "../components/common/SearchBar";
import FilterDropdown from "../components/common/FilterDropdown";
import SortDropdown from "../components/common/SortDropdown";
import Pagination from "../components/common/Pagination";

const AdminShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Data Table States
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAllShops();
  }, []);

  const fetchAllShops = async () => {
    try {
      const res = await api.get("/admin/shops/all");
      setShops(res.data);
    } catch (err) {
      toast.error("Failed to fetch shops");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.put(`/admin/shops/verify/${id}`);
      toast.success("Shop Verified Successfully");
      // Refresh local state
      setShops(
        shops.map((s) => (s.id === id ? { ...s, status: "approved" } : s)),
      );
    } catch (err) {
      toast.error("Failed to verify shop");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this shop?")) return;
    try {
      await api.patch(`/admin/shops/${id}/reject`);
      toast.success("Shop Rejected");
      setShops(
        shops.map((s) => (s.id === id ? { ...s, status: "rejected" } : s)),
      );
    } catch (err) {
      toast.error("Failed to reject shop");
    }
  };

  const handleBlockUnblock = async (id, currentStatus) => {
    const newStatus = currentStatus === "suspended" ? "approved" : "suspended";
    const action = currentStatus === "suspended" ? "Unblock" : "Block";

    if (!window.confirm(`Are you sure you want to ${action} this shop?`))
      return;

    try {
      await api.patch(`/admin/shops/${id}`, { status: newStatus });
      toast.success(`Shop ${action}ed Successfully`);
      setShops(
        shops.map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
      );
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${action} shop`);
    }
  };

  // 1. Filter
  let processedData = shops.filter((shop) => {
    if (filter && shop.status !== filter) return false;
    // 2. Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesName = shop.name?.toLowerCase().includes(term);
      const matchesOwner = shop.User?.username?.toLowerCase().includes(term);
      const matchesEmail = shop.User?.email?.toLowerCase().includes(term);
      return matchesName || matchesOwner || matchesEmail;
    }
    return true;
  });

  // 3. Sort
  processedData.sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortOrder === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortOrder === "name_asc") {
      return a.name.localeCompare(b.name);
    } else if (sortOrder === "name_desc") {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  // 4. Paginate
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedShops = processedData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Reset page if data changes dramatically
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, sortOrder]);

  return (
    <div className="p-8 bg-primary min-h-screen text-primary-text">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">Manage Shops</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search shops or owners..."
          />
          <div className="flex gap-3">
            <FilterDropdown
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="All Statuses"
              options={[
                { label: "Pending", value: "pending" },
                { label: "Active", value: "approved" },
                { label: "Blocked", value: "suspended" },
              ]}
            />
            <SortDropdown
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              options={[
                { label: "Newest First", value: "newest" },
                { label: "Oldest First", value: "oldest" },
                { label: "Name (A-Z)", value: "name_asc" },
                { label: "Name (Z-A)", value: "name_desc" },
              ]}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-white">Loading...</div>
      ) : (
        <div className="grid gap-6">
          {paginatedShops.length === 0 && (
            <div className="text-center text-neutral-light py-10 bg-neutral-dark rounded border border-neutral-mid">
              No shops match your criteria.
            </div>
          )}

          {paginatedShops.map((shop) => (
            <div
              key={shop.id}
              className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid flex flex-col md:flex-row justify-between items-start md:items-center"
            >
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {shop.name}
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${
                      shop.status === "approved"
                        ? "border-green-500 text-green-400"
                        : shop.status === "pending"
                          ? "border-yellow-500 text-yellow-400"
                          : shop.status === "suspended"
                            ? "border-red-500 text-red-400"
                            : "border-gray-500 text-gray-400"
                    }`}
                  >
                    {shop.status.toUpperCase()}
                  </span>
                </h2>
                <div className="text-neutral-light mt-2 space-y-1 text-sm">
                  <p>
                    Owner: {shop.User?.username} ({shop.User?.email})
                  </p>
                  <p>Category: {shop.category}</p>
                  <p>Location: {shop.location_address || "N/A"}</p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex gap-4">
                <button
                  onClick={() => navigate(`/admin/shops/${shop.id}`)}
                  className="bg-neutral-mid text-white px-4 py-2 rounded hover:bg-neutral-light transition-colors border border-neutral-light"
                >
                  View Details
                </button>

                {shop.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleVerify(shop.id)}
                      className="bg-accent text-primary px-4 py-2 rounded font-bold hover:bg-secondary transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(shop.id)}
                      className="bg-red-900/50 text-red-200 px-4 py-2 rounded font-bold hover:bg-red-900 border border-red-900 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}

                {(shop.status === "approved" ||
                  shop.status === "suspended") && (
                  <button
                    onClick={() => handleBlockUnblock(shop.id, shop.status)}
                    className={`px-4 py-2 rounded font-bold transition-colors border ${
                      shop.status === "suspended"
                        ? "bg-green-900/50 text-green-200 border-green-900 hover:bg-green-900"
                        : "bg-red-900/50 text-red-200 border-red-900 hover:bg-red-900"
                    }`}
                  >
                    {shop.status === "suspended" ? "Unblock" : "Block"}
                  </button>
                )}
              </div>
            </div>
          ))}

          {paginatedShops.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminShops;
