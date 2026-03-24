import { useState, useEffect } from "react";
import api from "../../api/axios";
import { toast } from "react-hot-toast";
import Pagination from "../../components/shared/common/Pagination";
import SearchBar from "../../components/shared/common/SearchBar";
import SortDropdown from "../../components/shared/common/SortDropdown";
import FilterDropdown from "../../components/shared/common/FilterDropdown";

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
            VaayuGO's commission is deducted from your next payout or remains as
            a due.
          </li>
          <li>
            <strong>Online Orders:</strong> VaayuGO collects the cash and pays
            you the net amount after commission.
          </li>
          <li>
            <strong>Positive Payout (+):</strong> VaayuGO owes you money
            (typically from online orders).
          </li>
          <li>
            <strong>Negative Payout (-):</strong> You owe VaayuGO (typically
            commission from high-volume COD sales).
          </li>
          <li>
            <strong>View Breakdown:</strong> Click the "View Breakdown" link to
            see exactly which orders were processed in a given week.
          </li>
        </ul>
      </div>

      {/* Summary Section */}
      <div className="bg-neutral-dark/40 backdrop-blur-xl p-8 rounded-3xl border border-neutral-mid/30 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
          <span className="p-2 bg-accent/20 rounded-lg text-accent">📊</span>
          Settlement Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="border-r border-neutral-mid/30 pr-4">
            <p className="text-neutral-light text-xs font-bold uppercase tracking-widest mb-2">
              Total Orders
            </p>
            <p className="text-4xl font-black text-white">
              {settlements.reduce((sum, s) => sum + (s.total_orders || 0), 0)}
            </p>
          </div>
          <div className="border-r border-neutral-mid/30 pr-4">
            <p className="text-neutral-light text-xs font-bold uppercase tracking-widest mb-2">
              COD Collected
            </p>
            <p className="text-4xl font-black text-orange-400">
              ₹{settlements.reduce((sum, s) => sum + Number(s.total_cod_collected || 0), 0).toFixed(2)}
            </p>
          </div>
          <div className="border-r border-neutral-mid/30 pr-4">
            <p className="text-neutral-light text-xs font-bold uppercase tracking-widest mb-2">
              Shop Earnings
            </p>
            <p className="text-4xl font-black text-green-400">
              ₹{settlements.reduce((sum, s) => sum + Number(s.total_cod_collected || 0) + Number(s.net_payout || 0), 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-neutral-light text-xs font-bold uppercase tracking-widest mb-2">
              Vaayugo Charges
            </p>
            <p className="text-4xl font-black text-red-400">
              ₹{settlements.reduce((sum, s) => sum + (Number(s.vaayugo_charges_total) - Number(s.platform_discount_total || 0)), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Pending Settlement Highlight */}
        {settlements.find(s => s.status === 'pending') && (
          <div className="mt-12 p-1 rounded-2xl bg-linear-to-r from-accent/30 via-accent/10 to-transparent">
            <div className="bg-neutral-dark/80 backdrop-blur-md p-6 rounded-[0.9rem] flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${
                  Number(settlements.find(s => s.status === 'pending').net_payout) < 0 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'
                }`}>
                  {Number(settlements.find(s => s.status === 'pending').net_payout) < 0 ? '💸' : '💰'}
                </div>
                <div>
                  <p className="text-neutral-light text-sm font-bold uppercase tracking-widest">Pending Settlement</p>
                  <p className={`text-3xl font-black ${
                    Number(settlements.find(s => s.status === 'pending').net_payout) < 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    ₹{Math.abs(settlements.find(s => s.status === 'pending').net_payout).toFixed(2)}
                  </p>
                  <p className={`text-xs font-black uppercase mt-1 ${
                    Number(settlements.find(s => s.status === 'pending').net_payout) < 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {Number(settlements.find(s => s.status === 'pending').net_payout) < 0 ? 'You need to pay VaayuGO' : 'VaayuGO will pay you'}
                  </p>
                </div>
              </div>
              <button className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-xl active:scale-95">
                Pay Settlement
              </button>
            </div>
          </div>
        )}
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
      <div className="bg-neutral-dark/40 backdrop-blur-xl border border-neutral-mid/30 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-neutral-mid/30 bg-primary/20 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Settlement History</h2>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              Receiving
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              Paying
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-neutral-mid/20 text-neutral-light text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Period</th>
                <th className="px-6 py-5">Orders</th>
                <th className="px-6 py-5">COD Collected</th>
                <th className="px-6 py-5">Your Earnings</th>
                <th className="px-6 py-5">Amount to Pay</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-mid/20">
              {currentSettlements.map((s) => {
                const shopEarnings = Number(s.total_cod_collected || 0) + Number(s.net_payout || 0);
                return (
                  <tr
                    key={s.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">
                          {new Date(s.start_date).getFullYear() <= 2000
                            ? "Full History"
                            : new Date(s.start_date).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-bold">
                          to {new Date(s.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-white font-medium">
                      {s.total_orders}
                    </td>
                    <td className="px-6 py-5 text-neutral-light font-medium">
                      ₹{Number(s.total_cod_collected).toFixed(2)}
                    </td>
                    <td className="px-6 py-5 text-green-400/80 font-bold">
                      ₹{shopEarnings.toFixed(2)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-black transition-all ${
                            s.status === "completed"
                              ? "text-neutral-light/20 line-through"
                              : Number(s.net_payout) >= 0
                                ? "text-green-400"
                                : "text-red-400"
                          }`}
                        >
                          ₹{Math.abs(s.net_payout).toFixed(2)}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-black mt-0.5 ${
                            s.status === "completed"
                              ? "text-neutral-light/30"
                              : Number(s.net_payout) >= 0
                                ? "text-green-500/60"
                                : "text-red-500/60"
                          }`}
                        >
                          {s.status === "completed"
                            ? "Settled"
                            : Number(s.net_payout) >= 0
                              ? "VaayuGO will pay you"
                              : "Pay to VaayuGO"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-lg text-[10px] uppercase font-black border tracking-wider ${getStatusColor(s.status)} shadow-lg shadow-black/20`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        className="p-2 bg-neutral-mid/30 hover:bg-accent hover:text-primary rounded-xl transition-all group/btn"
                        onClick={() => handleViewOrders(s)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {currentSettlements.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-neutral-light italic bg-neutral-dark/20"
                  >
                    {settlements.length === 0
                      ? "No settlements recorded under your shop profile yet."
                      : "No matching records found for the applied filters."}
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-9999 animate-in fade-in duration-300">
          <div className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-linear-to-br from-white/2 to-transparent">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Cycle Breakdown</h3>
                <div className="flex items-center gap-3 mt-2">
                   <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded font-black tracking-widest uppercase">
                     REF #{selectedSettlement.id}
                   </span>
                   <span className="text-neutral-light/20 text-xs">•</span>
                   <span className="text-neutral-light/50 text-xs font-medium uppercase tracking-wider">
                     {new Date(selectedSettlement.start_date).getFullYear() <= 2000 ? "Full History" : new Date(selectedSettlement.start_date).toLocaleDateString()} - {new Date(selectedSettlement.end_date).toLocaleDateString()}
                   </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSettlement(null)}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 text-neutral-light/40 hover:text-white transition-all hover:bg-red-500/20 group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
              {loadingOrders ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                  <p className="text-xs font-black text-accent/50 uppercase tracking-[0.2em] animate-pulse">Retrieving Data...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3">
                    {settlementOrders.map((order) => (
                      <div key={order.id} className="group bg-white/2 border border-white/5 p-5 rounded-2xl flex justify-between items-center hover:bg-white/4 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-primary/40 rounded-xl flex items-center justify-center text-accent text-sm font-black border border-white/5">
                             #{order.id.toString().slice(-2)}
                           </div>
                           <div>
                             <p className="text-white font-bold text-sm underline decoration-accent/30 underline-offset-4 cursor-pointer hover:text-accent transition-colors">
                                Order #{order.id}
                             </p>
                             <p className="text-[10px] text-neutral-light/40 mt-1 uppercase tracking-wider">
                               {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                             </p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                             <p className="text-white font-black text-sm tracking-tighter">₹{Number(order.grand_total).toFixed(2)}</p>
                             <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${order.status === 'completed' ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-orange-500/20 text-orange-500 bg-orange-500/5'}`}>
                                {order.status}
                             </span>
                           </div>
                           <a href={`/shop/orders/${order.id}`} target="_blank" rel="noreferrer" className="opacity-20 hover:opacity-100 transition-opacity">
                             <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                             </svg>
                           </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedSettlement.penalty_total > 0 && (
                    <div className="flex items-center justify-between p-6 bg-red-500/10 border border-red-500/20 rounded-3xl">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-2xl">⚠️</div>
                         <div>
                            <p className="text-red-400 font-bold tracking-tight">Financial Penalties</p>
                            <p className="text-[10px] text-red-400/50 uppercase tracking-widest mt-1">Deducted from final payout</p>
                         </div>
                       </div>
                       <p className="text-2xl font-black text-red-500 tracking-tighter">-₹{Number(selectedSettlement.penalty_total).toFixed(2)}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-8 border-t border-white/5 bg-black/40">
               <div className="flex justify-between items-end">
                  <div>
                    <p className="text-neutral-light/30 text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-center md:text-left">
                       Statement Summary
                    </p>
                    <div className="flex gap-4">
                       <div className="text-center md:text-left">
                          <p className="text-white/40 text-[9px] uppercase font-bold">Total Sales</p>
                          <p className="text-white font-bold tracking-tighter">₹{(Number(selectedSettlement.total_cod_collected) + Number(selectedSettlement.total_online_collected)).toFixed(2)}</p>
                       </div>
                       <div className="text-center md:text-left">
                          <p className="text-accent/60 text-[9px] uppercase font-bold">Platform Share</p>
                          <p className="text-accent font-bold tracking-tighter">₹{(Number(selectedSettlement.vaayugo_charges_total) - Number(selectedSettlement.platform_discount_total || 0)).toFixed(2)}</p>
                       </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-neutral-light/50 text-[10px] font-black uppercase mb-1 tracking-widest text-center md:text-right">Final Payout</p>
                    <p className={`text-4xl font-black tracking-tighter ${Number(selectedSettlement.net_payout) >= 0 ? 'text-green-500 shadow-green-500/10' : 'text-red-500 shadow-red-500/10'}`}>
                      ₹{Math.abs(Number(selectedSettlement.net_payout)).toFixed(2)}
                    </p>
                    <p className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${Number(selectedSettlement.net_payout) >= 0 ? 'text-green-500/60' : 'text-red-500/60'}`}>
                      {Number(selectedSettlement.net_payout) >= 0 ? 'To Shop' : 'From Shop'}
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopEarnings;
