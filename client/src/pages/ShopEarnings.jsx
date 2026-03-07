import { useState, useEffect } from "react";
import api from "../api/axios";
import { toast } from "react-hot-toast";
import Pagination from "../components/common/Pagination";
import SearchBar from "../components/common/SearchBar";
import SortDropdown from "../components/common/SortDropdown";
import FilterDropdown from "../components/common/FilterDropdown";

const ShopEarnings = () => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [settlementOrders, setSettlementOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // List Controls State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchSettlements = async () => {
    try {
      const { data } = await api.get("/shop/settlements");
      setSettlements(
        Array.isArray(data) ? data : data.results || data.settlements || [],
      );
    } catch (error) {
      toast.error("Failed to fetch settlement history");
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

  const handleViewOrders = async (settlement) => {
    setSelectedSettlement(settlement);
    setLoadingOrders(true);
    try {
      const { data } = await api.get(
        `/shop/settlements/${settlement.id}/orders`,
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
      <div className="text-white text-center p-10">
        Loading earnings history...
      </div>
    );

  const filteredAndSortedSettlements = settlements
    .filter((s) => {
      // The search query will match against the Start Date or End Date string format
      // Or just search by settlement id implicitly
      const dateString =
        `${new Date(s.start_date).toLocaleDateString()} ${new Date(s.end_date).toLocaleDateString()}`.toLowerCase();
      const matchesSearch = dateString.includes(searchQuery.toLowerCase());
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
          return Number(b.net_payout) - Number(a.net_payout);
        case "payout_low":
          return Number(a.net_payout) - Number(b.net_payout);
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Earnings & Settlements
        </h1>
        <p className="text-neutral-light">
          Track your weekly payouts and reconciled earnings.
        </p>
      </div>

      {/* Note about math */}
      <div className="bg-accent/5 border border-accent/20 p-6 rounded-xl">
        <h3 className="text-accent font-bold mb-2 flex items-center gap-2">
          <span>💡</span> Understanding the Settlement
        </h3>
        <ul className="text-neutral-light text-sm space-y-2 list-disc ml-5">
          <li>
            <strong>COD Orders:</strong> Since you collect cash directly,
            VaayuGo's commission is deducted from your next payout or remains as
            a due.
          </li>
          <li>
            <strong>Online Orders:</strong> VaayuGo collects the cash and pays
            you the net amount after commission.
          </li>
          <li>
            <strong>Positive Payout (+):</strong> VaayuGo owes you money
            (typically from online orders).
          </li>
          <li>
            <strong>Negative Payout (-):</strong> You owe VaayuGo (typically
            commission from high-volume COD sales).
          </li>
          <li>
            <strong>View Breakdown:</strong> Click the "View Breakdown" link to
            see exactly which orders were processed in a given week.
          </li>
        </ul>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-dark p-6 rounded-xl border border-neutral-mid shadow-lg">
          <p className="text-neutral-light text-sm mb-1 uppercase tracking-wider font-bold">
            Total Settled
          </p>
          <p className="text-3xl font-bold text-success">
            ₹
            {settlements
              .filter((s) => s.status === "completed")
              .reduce((sum, s) => sum + Math.max(0, Number(s.net_payout)), 0)
              .toFixed(2)}
          </p>
        </div>
        <div className="bg-neutral-dark p-6 rounded-xl border border-neutral-mid shadow-lg">
          <p className="text-neutral-light text-sm mb-1 uppercase tracking-wider font-bold">
            Pending Approval
          </p>
          <p className="text-3xl font-bold text-warning">
            ₹
            {settlements
              .filter((s) => s.status === "pending")
              .reduce((sum, s) => sum + Math.max(0, Number(s.net_payout)), 0)
              .toFixed(2)}
          </p>
        </div>
        <div className="bg-neutral-dark p-6 rounded-xl border border-neutral-mid shadow-lg">
          <p className="text-neutral-light text-sm mb-1 uppercase tracking-wider font-bold">
            Platform Due (COD)
          </p>
          <p className="text-3xl font-bold text-danger">
            ₹
            {Math.abs(
              settlements.reduce(
                (sum, s) => sum + Math.min(0, Number(s.net_payout)),
                0,
              ),
            ).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by date..."
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <FilterDropdown
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "completed", label: "Completed" },
              { value: "pending", label: "Pending" },
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

      {/* History Table */}
      <div className="bg-neutral-dark border border-neutral-mid rounded-xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-neutral-mid bg-primary/20">
          <h2 className="text-xl font-bold text-white">Settlement History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-primary/50 text-neutral-light text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4 text-center">Orders</th>
                <th className="px-6 py-4">COD Collected</th>
                <th className="px-6 py-4">Commission</th>
                <th className="px-6 py-4">Net Payout</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-mid">
              {currentSettlements.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4 text-white text-sm">
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
                        Number(s.net_payout) >= 0
                          ? "text-success"
                          : "text-danger"
                      }
                    >
                      {Number(s.net_payout) >= 0 ? "+" : ""} ₹{s.net_payout}
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
                  <td className="px-6 py-4 text-right">
                    <button
                      className="text-accent hover:underline text-xs flex items-center gap-1 justify-end ml-auto"
                      onClick={() => handleViewOrders(s)}
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
                      View Breakdown
                    </button>
                  </td>
                </tr>
              ))}
              {currentSettlements.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-neutral-light italic"
                  >
                    {settlements.length === 0
                      ? "No settlements processed yet."
                      : "No matching settlements found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-6 border-t border-neutral-mid">
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
                  Settlement Order Breakdown
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
                          href={`/shop/orders/${order.id}`}
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

export default ShopEarnings;
