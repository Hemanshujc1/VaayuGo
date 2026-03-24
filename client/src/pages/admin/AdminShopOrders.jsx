import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Pagination from "../../components/shared/common/Pagination";
import SearchBar from "../../components/shared/common/SearchBar";
import SortDropdown from "../../components/shared/common/SortDropdown";
import FilterDropdown from "../../components/shared/common/FilterDropdown";

const AdminShopOrders = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("date_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, [id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get(`/admin/shops/${id}/orders`);
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching shop orders", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="text-white text-center p-4">Loading Orders...</div>;

  const filteredAndSortedOrders = orders
    .filter((o) => {
      const matchesSearch = o.id.toString().includes(searchQuery);
      const matchesStatus = statusFilter ? o.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "date_desc":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "value_high":
          return b.grand_total - a.grand_total;
        case "value_low":
          return a.grand_total - b.grand_total;
        default:
          return 0;
      }
    });

  const totalPages =
    Math.ceil(filteredAndSortedOrders.length / itemsPerPage) || 1;
  const currentOrders = filteredAndSortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Shop Order History</h2>
        <button
          onClick={() => navigate(`/admin/shops/${id}`)}
          className="bg-neutral-mid text-white px-4 py-2 rounded-lg hover:bg-neutral-light/20 transition-colors font-bold text-sm"
        >
          ← Back to Shop
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID..."
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <FilterDropdown
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "pending", label: "Pending" },
              { value: "accepted", label: "Accepted" },
              { value: "preparing", label: "Preparing" },
              { value: "out_for_delivery", label: "Out for Delivery" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
              { value: "failed", label: "Failed" },
            ]}
            placeholder="All Statuses"
          />
          <SortDropdown
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: "date_desc", label: "Date (Newest)" },
              { value: "date_asc", label: "Date (Oldest)" },
              { value: "value_high", label: "Value (Highest)" },
              { value: "value_low", label: "Value (Lowest)" },
            ]}
          />
        </div>
      </div>

      <div className="bg-neutral-dark p-6 rounded-xl shadow border border-neutral-mid">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
          <span>Recent Shop Orders ({filteredAndSortedOrders.length})</span>
        </h3>
        <div className="space-y-3">
          {currentOrders.length === 0 ? (
            <p className="text-neutral-light text-center py-4 text-sm">
              {orders.length === 0
                ? "No orders recorded yet."
                : "No matching orders found."}
            </p>
          ) : (
            currentOrders.map((o) => (
              <div
                key={o.id}
                className="bg-primary p-3 rounded border border-neutral-mid flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">
                      Order #{o.id}
                    </span>
                    <button
                      onClick={() => navigate(`/admin/orders/${o.id}`)}
                      className="text-xs bg-neutral-mid hover:bg-neutral-light text-white px-2 py-1 rounded"
                    >
                      View
                    </button>
                    {o.DeliverySlot && (
                      <span className="text-[10px] text-neutral-light bg-neutral-mid/30 px-1.5 py-0.5 rounded border border-neutral-light/10">
                        Slot: {o.DeliverySlot.name}
                      </span>
                    )}
                    {o.delivery_attempt > 1 && (
                      <span className="bg-accent/20 text-accent text-[10px] font-bold px-1.5 py-0.5 rounded border border-accent/30 animate-pulse">
                        RETRY {o.delivery_attempt}
                      </span>
                    )}
                    {o.status === "delivered" && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          o.settlement_id
                            ? "bg-green-600/20 text-green-400 border-green-600/30"
                            : "bg-warning/20 text-warning border-warning/30"
                        }`}
                      >
                        {o.settlement_id ? "SETTLED" : "UNSETTLED"}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      o.status === "delivered"
                        ? "bg-green-900/50 text-green-400"
                        : o.status === "cancelled" || o.status === "failed"
                          ? "bg-red-900/50 text-red-400"
                          : "bg-yellow-900/50 text-yellow-400"
                    }`}
                  >
                    {o.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-light">
                    Val: <span className="text-white">₹{o.grand_total}</span>
                  </span>
                  <span className="text-neutral-500">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 pt-6 border-t border-neutral-mid/40">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminShopOrders;
