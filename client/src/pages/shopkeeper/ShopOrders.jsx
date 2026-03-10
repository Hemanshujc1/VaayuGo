import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SearchBar from "../../components/shared/common/SearchBar";
import FilterDropdown from "../../components/shared/common/FilterDropdown";
import SortDropdown from "../../components/shared/common/SortDropdown";
import Pagination from "../../components/shared/common/Pagination";
import ExportWidget from "../../components/shared/common/ExportWidget";

const ShopOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Data Table States
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // Default to all orders depending on shop owner preference
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Slightly more items since cards are compact
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotFilter, setSlotFilter] = useState("all");

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'delivery', 'failure', 'cancel'
  const [modalOrderId, setModalOrderId] = useState(null);
  const [deliveryOtp, setDeliveryOtp] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders/shop-orders");
      // The API returns { orders: [...], smallOrdersCount: X }
      setOrders(res.data.orders || []);
    } catch (error) {
      console.error("Error fetching orders", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await api.get("/orders/available-slots");
      setAvailableSlots(res.data || []);
    } catch (error) {
      console.error("Error fetching slots", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSlots();
  }, []);

  const handleStatusUpdate = async (orderId, newStatus, extraData = {}) => {
    try {
      const payload = { status: newStatus, ...extraData };
      await api.put(`/orders/${orderId}/status`, payload);

      // Update local state and conditionally optimistically apply locked flag
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId) {
            const isFinalState = ["delivered", "failed", "cancelled"].includes(
              newStatus,
            );
            return {
              ...o,
              status: newStatus,
              final_status_locked: isFinalState ? true : o.final_status_locked,
              ...extraData,
            };
          }
          return o;
        }),
      );

      closeModal();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update status");
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalOrderId(null);
    setDeliveryOtp("");
    setFailureReason("");
    setCancelReason("");
  };

  // Reset page if data changes dramatically
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, sortOrder, slotFilter]);

  if (loading)
    return (
      <div className="text-white text-center mt-20">Loading Orders...</div>
    );

  // ----- Data Processing -----
  let processedOrders = [...orders];

  // 1. Filter
  if (filter && filter !== "all") {
    processedOrders = processedOrders.filter((o) => o.status === filter);
  }

  // 1b. Slot Filter
  if (slotFilter && slotFilter !== "all") {
    processedOrders = processedOrders.filter(
      (o) => String(o.delivery_slot_id) === String(slotFilter),
    );
  }

  // 2. Search
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    processedOrders = processedOrders.filter((o) => {
      const matchId = String(o.id).includes(term);
      const matchCustomer = o.User?.name?.toLowerCase().includes(term);
      const matchEmail = o.User?.email?.toLowerCase().includes(term);
      const matchPhone = o.User?.mobile_number?.includes(term);
      return matchId || matchCustomer || matchEmail || matchPhone;
    });
  }

  // 3. Sort
  processedOrders.sort((a, b) => {
    if (sortOrder === "newest")
      return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortOrder === "oldest")
      return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortOrder === "amount_highest") return b.grand_total - a.grand_total;
    if (sortOrder === "amount_lowest") return a.grand_total - b.grand_total;
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
    <div className="p-4 sm:p-8 bg-primary min-h-screen text-white">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
              Incoming <span className="text-accent">Orders</span>
            </h1>
            <p className="text-neutral-light text-sm md:text-base">
              Monitor and manage your shop's real-time order flow.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ExportWidget
              data={processedOrders}
              filename="Shop_Orders_Report"
              columns={[
                { key: "id", label: "Order ID" },
                {
                  key: "createdAt",
                  label: "Date",
                  accessor: (o) => new Date(o.createdAt).toLocaleString(),
                },
                {
                  key: "customer_name",
                  label: "Customer Name",
                  accessor: (o) => o.User?.name || "N/A",
                },
                {
                  key: "customer_phone",
                  label: "Customer Phone",
                  accessor: (o) => o.User?.mobile_number || "N/A",
                },
                { key: "grand_total", label: "Total Amount" },
                {
                  key: "status",
                  label: "Status",
                  accessor: (o) => o.status.toUpperCase(),
                },
                {
                  key: "earning",
                  label: "Your Earning",
                  accessor: (o) =>
                    o.status === "delivered"
                      ? (o.OrderRevenueLog?.shop_final_settlement ?? 0)
                      : "Pending",
                },
              ]}
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-neutral-dark/40 backdrop-blur-md p-4 rounded-2xl border border-neutral-mid/50 flex flex-col xl:flex-row gap-4 shadow-xl">
          <div className="flex-1">
            <SearchBar
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Order ID, name, email or phone..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FilterDropdown
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="All Statuses"
              options={[
                { label: "All Statuses", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Accepted", value: "accepted" },
                { label: "Out for Delivery", value: "out_for_delivery" },
                { label: "Delivered", value: "delivered" },
              ]}
            />
            <FilterDropdown
              value={slotFilter}
              onChange={(e) => setSlotFilter(e.target.value)}
              placeholder="All Slots"
              options={[
                { label: "All Slots", value: "all" },
                ...availableSlots.map((s) => ({
                  label: s.name,
                  value: String(s.id),
                })),
              ]}
            />
            <SortDropdown
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              options={[
                { label: "Newest First", value: "newest" },
                { label: "Oldest First", value: "oldest" },
                { label: "Amount (High)", value: "amount_highest" },
                { label: "Amount (Low)", value: "amount_lowest" },
              ]}
            />
          </div>
        </div>
      </div>

      {paginatedOrders.length === 0 ? (
        <div className="max-w-7xl mx-auto p-12 text-center text-neutral-light bg-neutral-dark/30 rounded-3xl border border-dashed border-neutral-mid/50 animate-pulse">
          <p className="text-xl">No orders found matching your filters.</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-6">
          {paginatedOrders.map((order) => (
            <div
              key={order.id}
              className={`group bg-neutral-dark/60 hover:bg-neutral-dark/80 backdrop-blur-sm p-6 rounded-3xl shadow-2xl border transition-all duration-300 ${
                order.delivery_attempt > 1 &&
                !["delivered", "failed", "cancelled"].includes(order.status)
                  ? "border-accent ring-1 ring-accent/20"
                  : "border-neutral-mid/50 hover:border-accent/40"
              }`}
            >
              <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                <div className="flex-1 w-full lg:w-auto">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="bg-neutral-mid/50 text-neutral-light text-[10px] font-bold px-3 py-1 rounded-full border border-neutral-light/10">
                      ID: #{order.id}
                    </span>
                    {order.delivery_attempt > 1 &&
                      !["delivered", "failed", "cancelled"].includes(
                        order.status,
                      ) && (
                        <span className="bg-accent text-primary text-[10px] font-black px-3 py-1 rounded-full animate-bounce shadow-[0_0_15px_rgba(0,229,255,0.4)] uppercase">
                          Retry Attempt {order.delivery_attempt}
                        </span>
                      )}
                    {order.status === "delivered" && (
                      <span
                        className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                          order.settlement_id
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-warning/10 text-warning border-warning/20"
                        }`}
                      >
                        {order.settlement_id
                          ? "SETTLEMENT COMPLETE"
                          : "SETTLEMENT PENDING"}
                      </span>
                    )}
                    {order.DeliverySlot && (
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
                        {order.DeliverySlot.name} (
                        {order.DeliverySlot.start_time} -{" "}
                        {order.DeliverySlot.end_time})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-black text-xl border border-accent/20">
                      {order.User?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <h2 className="font-bold text-xl text-white">
                        {order.User?.name || "Anonymous Guest"}
                      </h2>
                      <p className="text-sm text-neutral-light">
                        {order.User?.mobile_number &&
                          `${order.User.mobile_number} • `}
                        {order.User?.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-primary/40 p-3 rounded-2xl border border-neutral-mid/30">
                      <p className="text-[10px] text-neutral-light uppercase font-bold mb-1">
                        Final Payable
                      </p>
                      <p className="text-xl font-black text-accent">
                        ₹{order.grand_total}
                      </p>
                    </div>
                    <div className="bg-primary/40 p-3 rounded-2xl border border-neutral-mid/30">
                      <p className="text-[10px] text-neutral-light uppercase font-bold mb-1">
                        Date & Time
                      </p>
                      <p className="text-sm text-white font-medium">
                        {new Date(order.createdAt).toLocaleDateString(
                          undefined,
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}{" "}
                        at{" "}
                        {new Date(order.createdAt).toLocaleTimeString(
                          undefined,
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-500/5 p-4 rounded-2xl border border-green-500/10 mb-4">
                    <p className="text-[10px] text-green-400/70 uppercase font-black mb-1 tracking-widest">
                      Expected Earning
                    </p>
                    {order.status === "delivered" ? (
                      <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                        <span className="text-2xl font-black text-green-400">
                          ₹{order.OrderRevenueLog?.shop_final_settlement ?? 0}
                        </span>
                        <span className="text-[10px] text-neutral-light mb-1 italic">
                          (Items: ₹
                          {(
                            Number(order.OrderRevenueLog?.net_item_total || 0) -
                            Number(
                              order.OrderRevenueLog?.commission_deducted || 0,
                            )
                          ).toFixed(2)}{" "}
                          | Del: +₹
                          {order.OrderRevenueLog?.shop_delivery_share || 0}
                          {order.OrderRevenueLog?.is_small_order &&
                            ` | Extra: +₹${order.OrderRevenueLog?.shop_small_order_share || 0}`}
                          )
                        </span>
                      </div>
                    ) : (
                      <p className="text-warning font-bold flex items-center gap-2 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-warning"></span>
                        Calculating on Delivery...
                      </p>
                    )}
                  </div>

                  <div className="flex items-start gap-2 text-sm text-white bg-primary/20 p-3 rounded-2xl border border-neutral-mid/20">
                    <span className="text-accent shrink-0 mt-0.5">📍</span>
                    <p className="leading-relaxed">
                      <span className="text-neutral-light font-medium">
                        Address:
                      </span>{" "}
                      {order.delivery_address}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full lg:w-48">
                  <div
                    className={`px-4 py-3 rounded-2xl text-center text-xs font-black tracking-widest transition-all ${
                      order.final_status_locked ||
                      ["delivered", "failed", "cancelled"].includes(
                        order.status,
                      )
                        ? "bg-neutral-mid/30 text-neutral-light border border-neutral-mid/50"
                        : "bg-warning/20 text-warning border border-warning/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    }`}
                  >
                    {order.final_status_locked
                      ? "FINALIZED"
                      : order.status.toUpperCase()}
                  </div>

                  {!order.final_status_locked &&
                    !["delivered", "failed", "cancelled"].includes(
                      order.status,
                    ) && (
                      <div className="flex flex-col gap-2">
                        {order.status === "pending" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(order.id, "accepted")
                            }
                            className="w-full bg-accent text-primary px-4 py-3 rounded-2xl font-black text-xs hover:bg-white transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                          >
                            <span>ACCEPT ORDER</span>
                            <span className="text-lg">➜</span>
                          </button>
                        )}
                        {order.status === "accepted" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(order.id, "out_for_delivery")
                            }
                            className="w-full bg-indigo-600 text-white px-4 py-3 rounded-2xl font-black text-xs hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
                          >
                            OUT FOR DELIVERY
                          </button>
                        )}
                        {order.status === "out_for_delivery" && (
                          <>
                            <button
                              onClick={() => {
                                setActiveModal("delivery");
                                setModalOrderId(order.id);
                              }}
                              className="w-full bg-green-600 text-white px-4 py-3 rounded-2xl font-black text-xs hover:bg-green-500 transition-all shadow-lg active:scale-95"
                            >
                              COMPLETE DELIVERY
                            </button>
                            <button
                              onClick={() => {
                                setActiveModal("failure");
                                setModalOrderId(order.id);
                              }}
                              className="w-full bg-danger/10 text-danger border border-danger/30 px-4 py-3 rounded-2xl font-black text-xs hover:bg-danger hover:text-white transition-all active:scale-95"
                            >
                              REPORT FAILURE
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setActiveModal("cancel");
                            setModalOrderId(order.id);
                          }}
                          className="w-full text-danger/60 hover:text-danger text-[10px] font-black tracking-widest transition-colors py-2"
                        >
                          CANCEL ORDER
                        </button>
                      </div>
                    )}

                  <button
                    onClick={() => navigate(`/shop/orders/${order.id}`)}
                    className="w-full mt-2 text-neutral-light hover:text-accent text-[11px] font-bold text-center underline transition-colors"
                  >
                    Details & Items ➜
                  </button>

                  {order.is_rated && (
                    <div className="mt-4 p-3 bg-warning/5 rounded-2xl border border-warning/10 text-center">
                      <p className="text-[10px] text-warning/70 font-black uppercase mb-1">
                        Rating
                      </p>
                      <div className="flex justify-center gap-2 text-warning font-black text-sm">
                        <span>Shop: ★{order.shop_rating}</span>
                        <span className="text-neutral-mid/50">•</span>
                        <span>Del: ★{order.delivery_rating}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {paginatedOrders.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {/* Modals */}
      {activeModal === "delivery" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-dark p-6 rounded-xl border border-neutral-mid w-full max-w-sm">
            <h3 className="text-white font-bold text-lg mb-4">
              Complete Delivery
            </h3>
            <p className="text-xs text-neutral-light mb-4">
              Ask the customer for the 4-digit Delivery OTP to successfully
              complete this order.
            </p>
            <input
              type="text"
              maxLength="4"
              value={deliveryOtp}
              onChange={(e) => setDeliveryOtp(e.target.value)}
              className="w-full text-center tracking-widest font-mono text-2xl p-3 bg-neutral-mid text-white border border-accent rounded mb-6 outline-none"
              placeholder="----"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="text-sm px-4 py-2 rounded text-neutral-light hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleStatusUpdate(modalOrderId, "delivered", {
                    delivery_otp: deliveryOtp,
                  })
                }
                className="text-sm px-4 py-2 rounded bg-green-600 font-bold text-white hover:bg-green-500"
              >
                Verify & Deliver
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "failure" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-dark p-6 rounded-xl border border-neutral-mid w-full max-w-sm">
            <h3 className="text-danger font-bold text-lg mb-4">
              Report Failed Delivery
            </h3>
            <select
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              className="w-full p-2 bg-neutral-mid text-white border border-neutral-light rounded mb-6 text-sm outline-none"
            >
              <option value="">Select a reason...</option>
              <option value="Delivery attempt was made">
                Delivery attempt was made
              </option>
              <option value="Customer was unavailable">
                Customer was unavailable
              </option>
              <option value="Customer refused order">
                Customer refused order
              </option>
              <option value="Other">Other</option>
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="text-sm px-4 py-2 rounded text-neutral-light hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleStatusUpdate(modalOrderId, "failed", {
                    failure_reason: failureReason,
                  })
                }
                className="text-sm px-4 py-2 rounded bg-danger font-bold text-white hover:bg-red-600"
              >
                Mark as Failed
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "cancel" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-dark p-6 rounded-xl border border-neutral-mid w-full max-w-sm">
            <h3 className="text-danger font-bold text-lg mb-4">Cancel Order</h3>
            <p className="text-xs text-neutral-light mb-4">
              Please specify a reason for canceling this order.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Product unavailable, operational issue, etc."
              className="w-full p-2 bg-neutral-mid text-white border border-neutral-light rounded mb-6 text-sm outline-none"
              rows="3"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="text-sm px-4 py-2 rounded text-neutral-light hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() =>
                  handleStatusUpdate(modalOrderId, "cancelled", {
                    cancel_reason: cancelReason,
                  })
                }
                className="text-sm px-4 py-2 rounded border border-danger text-danger font-bold hover:bg-danger/10"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopOrders;
