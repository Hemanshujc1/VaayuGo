import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useConfirm } from "../context/ConfirmContext";
import SearchBar from "../components/common/SearchBar";
import FilterDropdown from "../components/common/FilterDropdown";
import SortDropdown from "../components/common/SortDropdown";
import Pagination from "../components/common/Pagination";

const AdminShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const confirm = useConfirm();

  // Data Table States
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchCategories();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchAllShops();
  }, [debouncedSearchTerm, filter, categoryFilter, sortOrder, currentPage]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/admin/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const fetchAllShops = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/shops/all", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchTerm,
          status: filter,
          category_id: categoryFilter,
          sort: sortOrder,
        },
      });
      setShops(res.data.shops);
      setTotalPages(res.data.totalPages);
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
      fetchAllShops();
    } catch (err) {
      toast.error("Failed to verify shop");
    }
  };

  const handleReject = async (id) => {
    const acknowledged = await confirm({
      title: "Reject Shop?",
      message:
        "Are you sure you want to reject this shop registration? This will notify the shop owner.",
      confirmText: "Yes, Reject",
      cancelText: "Cancel",
      type: "danger",
    });

    if (!acknowledged) return;
    try {
      await api.patch(`/admin/shops/${id}/reject`);
      toast.success("Shop Rejected");
      fetchAllShops();
    } catch (err) {
      toast.error("Failed to reject shop");
    }
  };

  const handleBlockUnblock = async (id, currentStatus) => {
    const newStatus = currentStatus === "suspended" ? "approved" : "suspended";
    const action = currentStatus === "suspended" ? "Unblock" : "Block";

    const acknowledged = await confirm({
      title: `${action} Shop?`,
      message: `Are you sure you want to ${action.toLowerCase()} this shop? This will affect their ability to receive orders.`,
      confirmText: action,
      cancelText: "Keep Active",
      type: action === "Block" ? "danger" : "info",
    });

    if (!acknowledged) return;

    try {
      await api.patch(`/admin/shops/${id}`, { status: newStatus });
      toast.success(`Shop ${action}ed Successfully`);
      fetchAllShops();
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${action} shop`);
    }
  };

  const handleFilterChange = (val) => {
    setFilter(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val) => {
    setCategoryFilter(val);
    setCurrentPage(1);
  };

  const handleSortChange = (val) => {
    setSortOrder(val);
    setCurrentPage(1);
  };

  return (
    <div className="p-4 md:p-8 bg-primary min-h-screen text-primary-text">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <h1 className="text-3xl font-bold text-white whitespace-nowrap">
          Manage Shops
        </h1>

        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto items-stretch md:items-center">
          <div className="flex-1 md:w-80">
            <SearchBar
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search shops or owners..."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <FilterDropdown
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              placeholder="All Statuses"
              options={[
                { label: "Pending", value: "pending" },
                { label: "Active", value: "approved" },
                { label: "Blocked", value: "suspended" },
              ]}
            />
            <FilterDropdown
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              placeholder="All Categories"
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
            <SortDropdown
              value={sortOrder}
              onChange={(e) => handleSortChange(e.target.value)}
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
        <div className="text-center text-white py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          Loading shops...
        </div>
      ) : (
        <div className="grid gap-6">
          {shops.length === 0 && (
            <div className="text-center text-neutral-light py-10 bg-neutral-dark rounded border border-neutral-mid">
              No shops match your criteria.
            </div>
          )}

          {shops.map((shop) => (
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
                    Owner: {shop.User?.name || "N/A"}{" "}
                    {shop.User?.mobile_number && `(${shop.User.mobile_number})`}
                  </p>
                  <p>Email: {shop.User?.email || "N/A"}</p>
                  <p>
                    Category:{" "}
                    {(shop.Categories || []).length > 0
                      ? shop.Categories.map((c) => c.name).join(", ")
                      : shop.category || "General"}
                  </p>
                  <p>Location: {shop.location_address || "N/A"}</p>
                  <p>
                    Rating:{" "}
                    {shop.rating > 0
                      ? `${Number(shop.rating).toFixed(1)} ★`
                      : "New"}
                  </p>
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

          {shops.length > 0 && (
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
