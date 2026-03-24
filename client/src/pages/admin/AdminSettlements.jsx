import { useState, useEffect } from "react";
import api from "../../api/axios";
import { toast } from "react-hot-toast";
import Pagination from "../../components/shared/common/Pagination";
import SearchBar from "../../components/shared/common/SearchBar";
import FilterDropdown from "../../components/shared/common/FilterDropdown";
import SortDropdown from "../../components/shared/common/SortDropdown";
import { Link } from "react-router-dom";

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
  const currentPageSettlements = filteredAndSortedSettlements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Statistics Calculations
  const platformEarned = settlements.reduce((sum, s) => sum + (Number(s.vaayugo_charges_total) - Number(s.platform_discount_total || 0)), 0);
  const shopsEarned = settlements.reduce((sum, s) => sum + (Number(s.total_cod_collected || 0) + Number(s.net_payout || 0)), 0);
  const pendingSettlementsCount = settlements.filter(s => s.status === 'pending').length;
  const totalUnpaidAmount = settlements
    .filter(s => s.status === 'pending')
    .reduce((sum, s) => sum + Math.abs(Number(s.net_payout || 0)), 0);

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
        return "bg-green-900/30 text-green-400 border-green-800";
      case "disputed":
        return "bg-red-900/30 text-red-400 border-red-800";
      case "pending":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-800";
      default:
        return "bg-neutral-mid text-neutral-light";
    }
  };

  if (loading)
    return (
      <div className="text-white text-center p-10">Loading settlements...</div>
    );

  return (
    <div className="p-4 md:p-10 bg-[#0a0a0a] min-h-screen text-neutral-light font-sans selection:bg-accent selection:text-primary">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic">
              SETTLEMENT
            </h1>
            <p className="text-neutral-light/60 font-medium max-w-md leading-relaxed">
              Manage shopkeeper payouts, audit weekly cycles, and maintain platform liquidity with precision.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <button
              onClick={() => handleTriggerSettlements(false)}
              disabled={triggering}
              className="flex-1 lg:flex-none px-6 py-3 rounded-2xl bg-neutral-mid/20 hover:bg-neutral-mid/40 text-white font-bold border border-white/5 transition-all disabled:opacity-50 text-sm backdrop-blur-md"
            >
              {triggering ? "Calculating..." : "Process Cycle"}
            </button>
            <button
              onClick={() => handleTriggerSettlements(true)}
              disabled={triggering}
              className="flex-1 lg:flex-none px-8 py-3 rounded-2xl bg-linear-to-r from-accent to-blue-500 text-primary font-black hover:shadow-[0_0_20px_rgba(32,226,224,0.4)] transition-all disabled:opacity-50 text-sm uppercase tracking-wider"
            >
              {triggering ? "Forcing..." : "Force Process"}
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Platform Earned", value: `₹${platformEarned.toFixed(2)}`, color: "accent", icon: "💎" },
            { label: "Shops Earned", value: `₹${shopsEarned.toFixed(2)}`, color: "green-400", icon: "🏪" },
            { label: "Pending Actions", value: pendingSettlementsCount, color: "yellow-400", icon: "⏳" },
            { label: "Unpaid Volume", value: `₹${totalUnpaidAmount.toFixed(2)}`, color: "red-500", icon: "💸" }
          ].map((stat, i) => (
            <div key={i} className="relative group">
              <div className={`absolute -inset-0.5 bg-linear-to-br from-${stat.color}/20 to-transparent rounded-4xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm`} />
              <div className="relative bg-[#141414] border border-white/5 p-8 rounded-4xl flex flex-col justify-between h-full hover:border-white/10 transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-neutral-light/40 text-[10px] font-black uppercase tracking-[0.2em]">
                    {stat.label}
                  </span>
                  <span className="text-xl opacity-50">{stat.icon}</span>
                </div>
                <p className={`text-3xl font-black mt-4 ${stat.color === 'accent' ? 'text-accent' : `text-${stat.color}`}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Toolbar */}
        <div className="bg-[#141414]/60 backdrop-blur-xl p-4 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-light/30 group-focus-within:text-accent transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>
             <input 
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search by shop name..."
               className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all placeholder:text-neutral-light/20"
             />
          </div>
          
          <div className="flex gap-4">
            <div className="min-w-[160px]">
              <FilterDropdown
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "pending", label: "Pending" },
                  { value: "completed", label: "Completed" },
                  { value: "disputed", label: "Disputed" },
                ]}
                placeholder="All Statuses"
                className="bg-black/40! border-white/5! rounded-2xl! py-3! h-full"
              />
            </div>
            <div className="min-w-[180px]">
              <SortDropdown
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: "date_desc", label: "Date (Newest)" },
                  { value: "date_asc", label: "Date (Oldest)" },
                  { value: "payout_high", label: "Payout (Highest)" },
                  { value: "payout_low", label: "Payout (Lowest)" },
                ]}
                className="bg-black/40! border-white/5! rounded-2xl! py-3! h-full"
              />
            </div>
          </div>
        </div>

        {/* Settlements Table / Card List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
             <h2 className="text-sm font-black uppercase tracking-[0.3em] text-neutral-light/30">
                Settlement Records
             </h2>
             <span className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-neutral-light/50 font-bold">
                {filteredAndSortedSettlements.length} Total
             </span>
          </div>

          <div className="bg-[#141414]/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl overflow-x-auto lg:overflow-visible">
            {/* Desktop Table View */}
            <table className="w-full text-left hidden lg:table border-collapse">
              <thead className="text-[10px] uppercase font-black tracking-widest text-neutral-light/20 border-b border-white/5">
                <tr>
                  <th className="px-8 py-6">Shop Entity</th>
                  <th className="px-6 py-6 text-center">Volume</th>
                  <th className="px-6 py-6">Collections</th>
                  <th className="px-6 py-6 text-accent/50">Platform Net</th>
                  <th className="px-6 py-6 text-center">Payout Status</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/2">
                {currentPageSettlements.map((s) => (
                  <tr key={s.id} className="group hover:bg-white/1 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-base group-hover:text-accent transition-colors">
                          {s.Shop?.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-neutral-light/40 font-black uppercase">
                            #{s.shop_id}
                          </span>
                          <span className="text-neutral-light/20">•</span>
                          <span className="text-[10px] text-neutral-light/40 font-medium">
                            {new Date(s.start_date).toLocaleDateString()} - {new Date(s.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-white">
                        {s.total_orders} Orders
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-neutral-light/80 text-xs font-bold">
                          ₹{Number(s.total_cod_collected).toFixed(2)} <span className="text-[9px] opacity-40">COD</span>
                        </span>
                        <span className="text-neutral-light/40 text-[10px]">
                          ₹{Number(s.total_online_collected).toFixed(2)} Online
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-accent font-black text-sm">
                          ₹{(Number(s.vaayugo_charges_total) - Number(s.platform_discount_total || 0)).toFixed(2)}
                        </span>
                        <span className="text-[9px] text-accent/40 uppercase tracking-tighter">Earnings</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex flex-col items-center">
                          <span className={`text-base font-black ${s.status === 'completed' ? 'text-neutral-light/20 line-through italic' : Number(s.net_payout) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ₹{Math.abs(Number(s.net_payout)).toFixed(2)}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 ${getStatusColor(s.status).split(' ')[1]}`}>
                             {s.status === 'completed' ? 'Settled' : Number(s.net_payout) >= 0 ? 'To Shop' : 'From Shop'}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleViewOrders(s)}
                          className="px-4 py-2 bg-neutral-mid/10 hover:bg-neutral-mid/30 text-xs font-black text-neutral-light rounded-xl transition-all border border-white/5"
                        >
                          Details
                        </button>
                        {s.status === 'pending' && (
                          <div className="flex gap-2">
                             <button
                               onClick={() => handleUpdateStatus(s.id, "completed")}
                               className="p-2 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-xl transition-all border border-green-500/20"
                             >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                             </button>
                             <button
                               onClick={() => handleUpdateStatus(s.id, "disputed")}
                               className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"
                             >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                             </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card List View */}
            <div className="lg:hidden p-4 space-y-4">
              {currentPageSettlements.map((s) => (
                <div key={s.id} className="bg-black/20 border border-white/5 rounded-3xl p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-bold text-lg">{s.Shop?.name}</h3>
                      <p className="text-[10px] text-neutral-light/40 uppercase tracking-widest mt-1">
                        Settlement ID: #{s.id}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl">
                       <p className="text-neutral-light/30 text-[9px] font-black uppercase mb-1">Orders</p>
                       <p className="text-white font-bold">{s.total_orders}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl">
                       <p className="text-neutral-light/30 text-[9px] font-black uppercase mb-1">Charges</p>
                       <p className="text-accent font-black">₹{(Number(s.vaayugo_charges_total) - Number(s.platform_discount_total || 0)).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-4 border-y border-white/5">
                     <div>
                        <p className="text-neutral-light/30 text-[9px] font-black uppercase">Net Payout</p>
                        <p className={`text-xl font-black ${s.status === 'completed' ? 'text-neutral-light/20 line-through' : Number(s.net_payout) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ₹{Math.abs(Number(s.net_payout)).toFixed(2)}
                        </p>
                     </div>
                     <p className="text-[10px] font-black text-neutral-light/40 uppercase text-right">
                        {new Date(s.start_date).toLocaleDateString()} - <br/> {new Date(s.end_date).toLocaleDateString()}
                     </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleViewOrders(s)}
                      className="flex-1 py-3 bg-neutral-mid/10 text-white text-xs font-black uppercase tracking-widest rounded-2xl border border-white/5"
                    >
                      Breakdown
                    </button>
                    {s.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(s.id, "completed")}
                        className="flex-1 py-3 bg-green-500 text-primary text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-green-500/20"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {currentPageSettlements.length === 0 && (
              <div className="px-8 py-20 text-center space-y-4">
                <div className="text-6xl grayscale opacity-20">📦</div>
                <p className="text-neutral-light/40 font-medium italic">
                  {settlements.length === 0 ? "No financial records in system." : "No matching settlements found."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="pt-6 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="bg-[#141414]/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl"
            />
          </div>
        )}
      </div>

      {/* Breakdown Modal */}
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
                     {selectedSettlement.Shop?.name}
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
                           <a href={`/admin/orders/${order.id}`} target="_blank" rel="noreferrer" className="opacity-20 hover:opacity-100 transition-opacity">
                             <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                             </svg>
                           </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedSettlement.penalty_total > 0 && (
                    <Link to="/admin/penalties" className="flex items-center justify-between p-6 bg-red-500/10 border border-red-500/20 rounded-3xl group hover:bg-red-500/20 transition-all">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-2xl">⚠️</div>
                         <div>
                            <p className="text-red-400 font-bold tracking-tight">Financial Penalties</p>
                            <p className="text-[10px] text-red-400/50 uppercase tracking-widest mt-1">Deducted from final payout</p>
                         </div>
                       </div>
                       <p className="text-2xl font-black text-red-500 tracking-tighter">-₹{Number(selectedSettlement.penalty_total).toFixed(2)}</p>
                    </Link>
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

export default AdminSettlements;
