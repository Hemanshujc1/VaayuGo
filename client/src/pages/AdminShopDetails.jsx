import { useState, useEffect } from "react";
import api from "../api/axios";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import SearchBar from "../components/common/SearchBar";
import FilterDropdown from "../components/common/FilterDropdown";
import SortDropdown from "../components/common/SortDropdown";
import Pagination from "../components/common/Pagination";

const AdminShopDetails = () => {
  const { id } = useParams();
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Penalty States
  const [penalties, setPenalties] = useState([]);
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [penaltyReason, setPenaltyReason] = useState("");

  // Table States for Orders (Products can remain simple or add similar states if requested later)
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Override state
  const [activeOverrideModalId, setActiveOverrideModalId] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState("delivered");
  const [overrideReason, setOverrideReason] = useState("");

  const handleOverride = async (orderId) => {
    if (!overrideReason.trim()) return toast.error("Reason is required");
    try {
      await api.put(`/admin/orders/${orderId}/override-status`, {
        status: overrideStatus,
        reason: overrideReason,
      });
      toast.success("Order overridden successfully");
      setShopData((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: overrideStatus,
                cancel_reason: `ADMIN OVERRIDE: ${overrideReason}`,
                final_status_locked: [
                  "delivered",
                  "failed",
                  "cancelled",
                ].includes(overrideStatus),
              }
            : o,
        ),
      }));
      setActiveOverrideModalId(null);
      setOverrideReason("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to override order");
    }
  };

  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        const res = await api.get(`/admin/shops/${id}`);
        setShopData(res.data);
      } catch (error) {
        toast.error("Failed to load shop details");
      } finally {
        setLoading(false);
      }
    };

    const fetchPenalties = async () => {
      // Fetch penalties via the shop's owner user ID once we have shopData.
      // Admin routes use user_id, so we wait till shopData resolves or do it sequentially.
    };

    fetchShopDetails();
  }, [id]);

  useEffect(() => {
    if (shopData?.shop?.owner_id) {
      const fetchPenalties = async () => {
        try {
          const res = await api.get(
            `/admin/users/${shopData.shop.owner_id}/penalties`,
          );
          setPenalties(res.data);
        } catch (error) {
          console.error("Failed to fetch penalties");
        }
      };
      fetchPenalties();
    }
  }, [shopData?.shop?.owner_id]);

  const handleIssuePenalty = async () => {
    if (!shopData?.shop?.owner_id) return toast.error("Shop owner not found");
    if (!penaltyAmount || isNaN(penaltyAmount) || Number(penaltyAmount) <= 0) {
      return toast.error("Please enter a valid penalty amount");
    }
    if (!penaltyReason.trim()) {
      return toast.error("Please enter a reason for the penalty");
    }

    try {
      const res = await api.post("/admin/penalties", {
        user_id: shopData.shop.owner_id,
        amount: penaltyAmount,
        reason: penaltyReason,
      });
      toast.success("Penalty issued successfully");
      setIsPenaltyModalOpen(false);
      setPenaltyAmount("");
      setPenaltyReason("");

      // Refresh penalty history
      const updatedPenalties = await api.get(
        `/admin/users/${shopData.shop.owner_id}/penalties`,
      );
      setPenalties(updatedPenalties.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to issue penalty");
    }
  };

  // Reset page if data changes dramatically
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, sortOrder]);

  if (loading)
    return <div className="text-white text-center mt-10">Loading...</div>;
  if (!shopData)
    return <div className="text-white text-center mt-10">Shop not found</div>;

  const { shop, products, orders, totalRevenue, shopEarned, vaayugoEarned } =
    shopData;

  const handleBlockUnblock = async () => {
    const newStatus = shop.status === "suspended" ? "approved" : "suspended";
    const action = shop.status === "suspended" ? "Unblock" : "Block";

    if (!window.confirm(`Are you sure you want to ${action} this shop?`))
      return;

    try {
      await api.patch(`/admin/shops/${id}`, { status: newStatus });
      toast.success(`Shop ${action}ed Successfully`);
      setShopData({ ...shopData, shop: { ...shop, status: newStatus } });
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${action} shop`);
    }
  };

  // ----- Data Processing for Orders -----
  let processedOrders = [...(orders || [])];

  // 1. Filter
  if (filter) {
    processedOrders = processedOrders.filter(
      (order) => order.status === filter,
    );
  }

  // 2. Search
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    processedOrders = processedOrders.filter((order) => {
      const matchesId = String(order.id).includes(term);
      const matchesCustomer = order.User?.name?.toLowerCase().includes(term);
      return matchesId || matchesCustomer;
    });
  }

  // 3. Sort
  processedOrders.sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortOrder === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortOrder === "amount_highest") {
      return b.grand_total - a.grand_total;
    } else if (sortOrder === "amount_lowest") {
      return a.grand_total - b.grand_total;
    }
    return 0;
  });

  // 4. Paginate
  const totalPages = Math.ceil(processedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = processedOrders.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="p-8 bg-primary min-h-screen text-primary-text space-y-8">
      <div className="flex justify-between items-center">
        <Link to="/admin/shops" className="text-accent hover:underline">
          ← Back to Shops
        </Link>
        <button
          onClick={() => setIsPenaltyModalOpen(true)}
          className="bg-danger text-white px-4 py-2 rounded font-bold hover:bg-red-600 transition-colors shadow-lg shadow-danger/20"
        >
          Issue Penalty to Shop
        </button>
      </div>

      {/* Header / Shop Info */}
      <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{shop.name}</h1>
          <p className="text-neutral-light">
            Category:{" "}
            <span className="text-white font-medium">{shop.category}</span>
          </p>
          <p className="text-neutral-light">
            Location:{" "}
            <span className="text-white font-medium">
              {shop.location_address || "N/A"}
            </span>
          </p>
          <p className="text-neutral-light">
            Owner:{" "}
            <span className="text-white font-medium">
              {shop.User?.name || "N/A"} ({shop.User?.mobile_number} |{" "}
              {shop.User?.email})
            </span>
          </p>
          <div className="mt-4 flex gap-4">
            <span
              className={`px-3 py-1 rounded text-sm font-bold flex items-center ${shop.status === "approved" ? "bg-green-900 text-green-200" : shop.status === "suspended" ? "bg-red-900 text-red-200" : "bg-yellow-900 text-yellow-200"}`}
            >
              {shop.status.toUpperCase()}
            </span>

            {(shop.status === "approved" || shop.status === "suspended") && (
              <button
                onClick={handleBlockUnblock}
                className={`px-4 py-1 rounded text-sm font-bold transition-colors border ${
                  shop.status === "suspended"
                    ? "bg-green-900/50 text-green-200 border-green-900 hover:bg-green-900"
                    : "bg-red-900/50 text-red-200 border-red-900 hover:bg-red-900"
                }`}
              >
                {shop.status === "suspended" ? "Unblock Shop" : "Block Shop"}
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-8 text-right bg-primary p-4 rounded border border-neutral-mid shrink-0">
          <div>
            <p className="text-xs text-neutral-light uppercase font-bold tracking-wider mb-1">
              Total Order Volume
            </p>
            <p className="text-2xl font-bold text-white">
              ₹{totalRevenue || 0}
            </p>
          </div>
          <div className="border-l border-neutral-mid pl-6">
            <p className="text-xs text-neutral-light uppercase font-bold tracking-wider mb-1">
              Shop Net Earned
            </p>
            <p className="text-2xl font-bold text-green-400">
              ₹{shopEarned || 0}
            </p>
          </div>
          <div className="border-l border-neutral-mid pl-6">
            <p className="text-xs text-neutral-light uppercase font-bold tracking-wider mb-1">
              VaayuGo Profit
            </p>
            <p className="text-2xl font-bold text-blue-400">
              ₹{vaayugoEarned || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Shop Gallery */}
      {(() => {
        let parsedImages = [];
        try {
          if (Array.isArray(shop.images)) {
            parsedImages = shop.images;
          } else if (typeof shop.images === "string") {
            parsedImages = JSON.parse(shop.images);
          }
        } catch (e) {
          if (shop.image_url) parsedImages = [shop.image_url];
        }
        if (!parsedImages || parsedImages.length === 0) {
          if (shop.image_url) parsedImages = [shop.image_url];
        }

        if (parsedImages.length === 0) return null;

        return (
          <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
            <h3 className="text-xl font-bold text-white mb-4">Shop Photos</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {parsedImages.map((img, idx) => (
                <img
                  key={idx}
                  src={`http://localhost:3001${img}`}
                  alt={`${shop.name} ${idx + 1}`}
                  className="w-48 h-32 object-cover rounded-md shrink-0 border border-neutral-mid"
                />
              ))}
            </div>
          </div>
        );
      })()}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-blue-500">
          <h3 className="text-neutral-light font-bold">Total Orders</h3>
          <p className="text-2xl font-bold text-white">{orders.length}</p>
        </div>
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-purple-500">
          <h3 className="text-neutral-light font-bold">Total Products</h3>
          <p className="text-2xl font-bold text-white">{products.length}</p>
        </div>
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-green-500">
          <h3 className="text-neutral-light font-bold">Shop Rating</h3>
          <p className="text-2xl font-bold text-white flex items-center gap-1">
            <span className="text-warning text-lg">★</span>
            {shop.rating != null && shop.rating > 0
              ? shop.rating.toFixed(1)
              : "N/A"}
          </p>
        </div>
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-yellow-500">
          <h3 className="text-neutral-light font-bold">Delivery Rating</h3>
          <p className="text-2xl font-bold text-white flex items-center gap-1">
            <span className="text-warning text-lg">★</span>
            {shop.delivery_rating != null && shop.delivery_rating > 0
              ? shop.delivery_rating.toFixed(1)
              : "N/A"}
          </p>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-neutral-dark rounded shadow border border-neutral-mid overflow-hidden">
        <div className="p-4 border-b border-neutral-mid">
          <h2 className="text-xl font-bold text-white">
            Products ({products.length})
          </h2>
        </div>
        <div className="overflow-x-auto max-h-64">
          <table className="min-w-full">
            <thead className="bg-neutral-mid">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-mid">
              {products.map((p) => {
                let imgPath = p.image_url;
                if (!imgPath && p.images) {
                  try {
                    const parsed =
                      typeof p.images === "string"
                        ? JSON.parse(p.images)
                        : p.images;
                    if (Array.isArray(parsed) && parsed.length > 0)
                      imgPath = parsed[0];
                  } catch (e) {
                    console.warn(
                      "Failed to parse images JSON for product",
                      p.id,
                    );
                  }
                }
                return (
                  <tr key={p.id}>
                    <td className="px-6 py-3">
                      {imgPath ? (
                        <img
                          src={`http://localhost:3001${imgPath}`}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded border border-neutral-mid"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-neutral-dark rounded flex items-center justify-center text-xs text-neutral-light border border-neutral-mid">
                          No Img
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-white">{p.name}</td>
                    <td className="px-6 py-3 text-white">₹{p.price}</td>
                    <td className="px-6 py-3 text-white">{p.stock_quantity}</td>
                    <td className="px-6 py-3 text-white">
                      {p.is_available ? "In Stock" : "Unavailable"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-neutral-dark rounded shadow border border-neutral-mid overflow-hidden">
        <div className="p-4 border-b border-neutral-mid flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold text-white whitespace-nowrap">
            Order History
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto overflow-x-auto pb-1">
            <div className="w-full sm:w-64 shrink-0">
              <SearchBar
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Order ID, Customer..."
              />
            </div>
            <FilterDropdown
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="All Statuses"
              options={[
                { label: "Pending", value: "pending" },
                { label: "Accepted", value: "accepted" },
                { label: "Out for Delivery", value: "out_for_delivery" },
                { label: "Delivered", value: "delivered" },
                { label: "Failed", value: "failed" },
                { label: "Cancelled", value: "cancelled" },
              ]}
            />
            <SortDropdown
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              options={[
                { label: "Newest First", value: "newest" },
                { label: "Oldest First", value: "oldest" },
                { label: "Amount (High to Low)", value: "amount_highest" },
                { label: "Amount (Low to High)", value: "amount_lowest" },
              ]}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-neutral-mid">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-mid">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-mid/50">
                  <td className="px-6 py-4 text-white">#{order.id}</td>
                  <td className="px-6 py-4 text-white">
                    {order.User?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-white">₹{order.grand_total}</td>
                  <td className="px-6 py-4 text-neutral-light">
                    {new Date(order.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded ${
                        order.status === "delivered"
                          ? "bg-green-900 text-green-200"
                          : order.status === "cancelled" ||
                              order.status === "failed"
                            ? "bg-red-900 text-red-200"
                            : "bg-blue-900 text-blue-200"
                      }`}
                    >
                      {order.status}
                    </span>
                    {order.final_status_locked && (
                      <span className="ml-2 text-[10px] bg-neutral-mid text-white px-1 rounded">
                        LOCKED
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-white">
                    <button
                      onClick={() => setActiveOverrideModalId(order.id)}
                      className="text-xs bg-danger/20 text-danger border border-danger/50 px-2 py-1 rounded hover:bg-danger hover:text-white transition-colors"
                    >
                      Override Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paginatedOrders.length === 0 && (
            <div className="p-8 text-center text-neutral-light border-b border-t border-neutral-mid">
              No orders match your criteria.
            </div>
          )}

          {paginatedOrders.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* Penalty History Table */}
      {penalties.length > 0 && (
        <div className="bg-neutral-dark rounded shadow border border-danger/30 overflow-hidden">
          <div className="p-4 border-b border-danger/30 bg-danger/10">
            <h2 className="text-xl font-bold text-danger">
              Shop Penalty History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-neutral-mid">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                    Issued By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-mid">
                {penalties.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-mid/50">
                    <td className="px-6 py-4 text-neutral-light text-sm">
                      {new Date(p.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4 text-danger font-bold">
                      ₹{p.amount}
                    </td>
                    <td className="px-6 py-4 text-white text-sm break-all max-w-xs">
                      {p.reason}
                    </td>
                    <td className="px-6 py-4 text-neutral-light text-sm">
                      {p.admin?.name || "Admin"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-bold rounded ${p.status === "pending" ? "bg-yellow-900 text-yellow-200" : "bg-green-900 text-green-200"}`}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issue Penalty Modal */}
      {isPenaltyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-neutral-dark p-6 rounded-xl border border-danger shadow-2xl shadow-danger/20 w-full max-w-sm">
            <h3 className="text-danger font-bold text-xl mb-4">
              Issue Penalty
            </h3>
            <p className="text-sm text-neutral-light mb-4">
              You are about to penalize the shop{" "}
              <strong className="text-white">{shop.name}</strong> owner{" "}
              <strong className="text-white">{shop.User?.name}</strong>.
            </p>

            <div className="mb-4">
              <label className="block text-sm text-neutral-light mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value)}
                className="w-full bg-neutral-mid text-white border border-neutral-light rounded p-2 outline-none"
                placeholder="e.g. 500"
                min="1"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-neutral-light mb-1">
                Reason (Mandatory)
              </label>
              <textarea
                value={penaltyReason}
                onChange={(e) => setPenaltyReason(e.target.value)}
                className="w-full bg-neutral-mid text-white border border-neutral-light rounded p-2 outline-none resize-none"
                placeholder="Describe why this penalty is being issued..."
                rows="3"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsPenaltyModalOpen(false);
                  setPenaltyAmount("");
                  setPenaltyReason("");
                }}
                className="px-4 py-2 text-sm text-neutral-light hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleIssuePenalty}
                className="px-4 py-2 text-sm bg-danger text-white rounded font-bold hover:bg-red-600"
              >
                Submit Penalty
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {activeOverrideModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-neutral-dark p-6 rounded-xl border border-danger/30 w-full max-w-sm">
            <h3 className="text-danger font-bold text-lg mb-4">
              ADMIN OVERRIDE: Order #{activeOverrideModalId}
            </h3>
            <select
              value={overrideStatus}
              onChange={(e) => setOverrideStatus(e.target.value)}
              className="w-full bg-neutral-mid text-white border border-neutral-light rounded p-2 mb-4 outline-none"
            >
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Mandatory reason for audit..."
              className="w-full bg-neutral-mid text-white border border-neutral-light rounded p-2 mb-4 outline-none text-sm"
              rows="3"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setActiveOverrideModalId(null);
                  setOverrideReason("");
                }}
                className="px-4 py-2 text-sm text-neutral-light hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleOverride(activeOverrideModalId)}
                className="px-4 py-2 text-sm bg-danger text-white rounded font-bold hover:bg-red-600"
              >
                Force Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShopDetails;
