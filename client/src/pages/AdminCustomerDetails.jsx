import { useState, useEffect } from "react";
import api from "../api/axios";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import SearchBar from "../components/common/SearchBar";
import FilterDropdown from "../components/common/FilterDropdown";
import SortDropdown from "../components/common/SortDropdown";
import Pagination from "../components/common/Pagination";

const AdminCustomerDetails = () => {
  const { id } = useParams();
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Penalty States
  const [penalties, setPenalties] = useState([]);
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [penaltyReason, setPenaltyReason] = useState("");

  // Table States for Orders
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
      // Refresh local list temporarily instead of refetching for speed (or trigger full refetch)
      setCustomerData((prev) => ({
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
    const fetchCustomerDetails = async () => {
      try {
        const res = await api.get(`/admin/customers/${id}`);
        setCustomerData(res.data);
      } catch (error) {
        toast.error("Failed to load customer details");
      } finally {
        setLoading(false);
      }
    };

    const fetchPenalties = async () => {
      try {
        const res = await api.get(`/admin/users/${id}/penalties`);
        setPenalties(res.data);
      } catch (error) {
        console.error("Failed to fetch penalties");
      }
    };

    fetchCustomerDetails();
    fetchPenalties();
  }, [id]);

  const handleIssuePenalty = async () => {
    if (!penaltyAmount || isNaN(penaltyAmount) || Number(penaltyAmount) <= 0) {
      return toast.error("Please enter a valid penalty amount");
    }
    if (!penaltyReason.trim()) {
      return toast.error("Please enter a reason for the penalty");
    }

    try {
      const res = await api.post("/admin/penalties", {
        user_id: id,
        amount: penaltyAmount,
        reason: penaltyReason,
      });
      toast.success("Penalty issued successfully");
      setIsPenaltyModalOpen(false);
      setPenaltyAmount("");
      setPenaltyReason("");

      // Refresh penalty history
      const updatedPenalties = await api.get(`/admin/users/${id}/penalties`);
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
  if (!customerData)
    return (
      <div className="text-white text-center mt-10">Customer not found</div>
    );

  const { user, orders, totalSpent } = customerData;

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
      const matchesShop = order.Shop?.name?.toLowerCase().includes(term);
      return matchesId || matchesShop;
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
        <Link to="/admin/customers" className="text-accent hover:underline">
          ← Back to Customers
        </Link>
        <button
          onClick={() => setIsPenaltyModalOpen(true)}
          className="bg-danger text-white px-4 py-2 rounded font-bold hover:bg-red-600 transition-colors shadow-lg shadow-danger/20"
        >
          Issue Penalty
        </button>
      </div>

      <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-primary text-3xl font-bold">
            {user.name ? user.name.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {user.name || "N/A"}
            </h1>
            <p className="text-neutral-light">{user.mobile_number}</p>
            <p className="text-neutral-light">{user.email}</p>
            {user.location && (
              <p className="text-neutral-light text-sm mt-1">
                <span className="font-bold">Location:</span> {user.location}
              </p>
            )}
            {user.address && (
              <p className="text-neutral-light text-sm">
                <span className="font-bold">Address:</span> {user.address}
              </p>
            )}
            <p className="text-sm text-neutral-light mt-1">
              Joined: {new Date(user.createdAt).toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>

        <div className="mt-6 md:mt-0 text-right">
          <p className="text-neutral-light">Total Lifetime Spend</p>
          <p className="text-3xl font-bold text-accent">₹{totalSpent}</p>
        </div>
      </div>

      {/* Orders History */}
      <div className="bg-neutral-dark rounded shadow border border-neutral-mid overflow-hidden">
        <div className="p-4 border-b border-neutral-mid flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold text-white whitespace-nowrap">
            Order History ({orders.length})
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto overflow-x-auto pb-1">
            <div className="w-full sm:w-64 shrink-0">
              <SearchBar
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Order ID, Shop Name..."
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
                  Shop
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
                    {order.Shop?.name || "Unknown Shop"}
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
            <h2 className="text-xl font-bold text-danger">Penalty History</h2>
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
              You are about to penalize{" "}
              <strong className="text-white">{user.name}</strong>.
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

export default AdminCustomerDetails;
