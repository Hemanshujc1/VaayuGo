import { useState, useEffect } from "react";
import api from "../api/axios";
import { toast } from "react-hot-toast";
import Pagination from "../components/common/Pagination";
import SearchBar from "../components/common/SearchBar";
import SortDropdown from "../components/common/SortDropdown";
import FilterDropdown from "../components/common/FilterDropdown";

const AdminSettlements = () => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [settlementOrders, setSettlementOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchSettlements = async () => {
    try {
      const { data } = await api.get("/admin/settlements");
      setSettlements(
        Array.isArray(data) ? data : data.results || data.settlements || [],
      );
    } catch (error) {
      toast.error("Failed to fetch settlements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  const filteredAndSortedSettlements = settlements
    .filter((s) => {
      const matchesSearch = s.Shop?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter ? s.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return new Date(a.start_date) - new Date(b.start_date);
        case "date_desc":
          return new Date(b.start_date) - new Date(a.start_date);
        case "payout_high":
          return b.net_payout - a.net_payout;
        case "payout_low":
          return a.net_payout - b.net_payout;
        default:
          return 0;
      }
    });

  const totalPages =
    Math.ceil(filteredAndSortedSettlements.length / itemsPerPage) || 1;
  const currentSettlements = filteredAndSortedSettlements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/settlements/${id}/status`, { status });
      toast.success(`Settlement marked as ${status}`);
      fetchSettlements();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleTriggerSettlements = async (forceAll = false) => {
    setTriggering(true);
    try {
      const payload = {};
      if (forceAll) {
        payload.start_date = "2000-01-01";
        payload.end_date = new Date(
          new Date().setDate(new Date().getDate() + 1),
        ).toISOString();
      }
      const { data } = await api.post("/admin/settlements/trigger", payload);
      toast.success(data.message);
      fetchSettlements();
    } catch (error) {
      toast.error("Failed to trigger settlements");
    } finally {
      setTriggering(false);
    }
  };

  const handleViewOrders = async (settlement) => {
    setSelectedSettlement(settlement);
    setLoadingOrders(true);
    try {
      const { data } = await api.get(
        `/admin/settlements/${settlement.id}/orders`,
      );
      setSettlementOrders(data || []);
    } catch (error) {
      toast.error("Failed to fetch orders for this settlement");
    } finally {
      setLoadingOrders(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-success/20 text-success border-success/30";
      case "disputed":
        return "bg-danger/20 text-danger border-danger/30";
      case "pending":
        return "bg-warning/20 text-warning border-warning/30";
      default:
        return "bg-neutral-mid text-neutral-light";
    }
  };

  if (loading)
    return (
      <div className="text-white text-center p-10">Loading settlements...</div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Weekly Settlements</h1>
          <p className="text-neutral-light">
            Audit and approve weekly payouts for shopkeepers.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleTriggerSettlements(false)}
            disabled={triggering}
            className="bg-neutral-mid text-white px-4 py-2 rounded font-bold hover:bg-neutral-light transition-all disabled:opacity-50"
          >
            {triggering ? "Calculating..." : "Process Last Week"}
          </button>
          <button
            onClick={() => handleTriggerSettlements(true)}
            disabled={triggering}
            className="bg-accent text-primary px-6 py-2 rounded font-bold hover:shadow-[0_0_15px_rgba(32,226,224,0.4)] transition-all disabled:opacity-50"
          >
            {triggering ? "Forcing..." : "Force Process All Pending"}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by shop name..."
          />
        </div>
        <div className="flex gap-4">
          <FilterDropdown
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Completed" },
              { value: "disputed", label: "Disputed" },
            ]}
            placeholder="All Statuses"
          />
          <SortDropdown
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: "date_desc", label: "Date (Newest)" },
              { value: "date_asc", label: "Date (Oldest)" },
              { value: "payout_high", label: "Payout (Highest)" },
              { value: "payout_low", label: "Payout (Lowest)" },
            ]}
          />
        </div>
      </div>

      <div className="bg-neutral-dark border border-neutral-mid rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-primary/50 text-neutral-light text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Shop</th>
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4 text-center">Orders</th>
                <th className="px-6 py-4">COD Coll.</th>
                <th className="px-6 py-4">Comm. Total</th>
                <th className="px-6 py-4">NET PAYOUT</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Breakdown</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-mid">
              {currentSettlements.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">
                      {s.Shop?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-light text-sm">
                    {new Date(s.start_date).getFullYear() <= 2000
                      ? "Full History"
                      : new Date(s.start_date).toLocaleDateString()}{" "}
                    - <br />
                    {new Date(s.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center text-white">
                    {s.total_orders}
                  </td>
                  <td className="px-6 py-4 text-neutral-light">
                    ₹{s.total_cod_collected}
                  </td>
                  <td className="px-6 py-4 text-neutral-light">
                    ₹{s.commission_total}
                  </td>
                  <td className="px-6 py-4 font-bold">
                    <span
                      className={
                        s.net_payout >= 0 ? "text-success" : "text-danger"
                      }
                    >
                      {s.net_payout >= 0 ? "+" : ""} ₹{s.net_payout}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${getStatusColor(s.status)}`}
                      >
                        {s.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleViewOrders(s)}
                        className="text-xs text-accent hover:underline flex items-center gap-1"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View ({s.total_orders})
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {s.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(s.id, "completed")}
                          className="text-success hover:bg-success/10 px-3 py-1 rounded text-xs border border-transparent hover:border-success/30 transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(s.id, "disputed")}
                          className="text-danger hover:bg-danger/10 px-3 py-1 rounded text-xs border border-transparent hover:border-danger/30 transition-all"
                        >
                          Dispute
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {currentSettlements.length === 0 && (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-10 text-center text-neutral-light italic"
                  >
                    {settlements.length === 0
                      ? "No settlements generated yet."
                      : "No matching settlements found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-mid/40">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {selectedSettlement && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-dark rounded-2xl border border-neutral-mid w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-neutral-mid flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Settlement Breakdown
                </h3>
                <p className="text-xs text-neutral-light mt-1 flex items-center gap-2">
                  <span className="bg-primary px-1.5 py-0.5 rounded border border-neutral-mid">
                    SETTLEMENT #{selectedSettlement.id}
                  </span>
                  <span>•</span>
                  <span>
                    Cycle:{" "}
                    {new Date(selectedSettlement.start_date).getFullYear() <=
                    2000
                      ? "Full History"
                      : new Date(
                          selectedSettlement.start_date,
                        ).toLocaleDateString()}{" "}
                    -{" "}
                    {new Date(selectedSettlement.end_date).toLocaleDateString()}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedSettlement(null)}
                className="text-neutral-light hover:text-white p-2"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingOrders ? (
                <div className="flex justify-center p-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {settlementOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-primary/40 border border-neutral-mid p-4 rounded-xl flex justify-between items-center hover:bg-primary/60 transition-colors"
                    >
                      <div>
                        <p className="text-white font-bold text-sm">
                          Order #{order.id}
                        </p>
                        <p className="text-[10px] text-neutral-light">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-accent font-bold text-sm">
                            ₹{order.grand_total}
                          </p>
                          <p className="text-[10px] text-neutral-light uppercase">
                            {order.status}
                          </p>
                        </div>
                        <a
                          href={`/admin/orders/${order.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-neutral-mid/50 hover:bg-neutral-mid rounded-lg text-neutral-light hover:text-white transition-all"
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
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))}
                  {settlementOrders.length === 0 && (
                    <p className="text-center text-neutral-light py-10">
                      No matching orders found in the system for this period.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettlements;
