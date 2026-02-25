import { useState, useEffect } from "react";
import api from "../api/axios";
import SearchBar from "../components/common/SearchBar";
import FilterDropdown from "../components/common/FilterDropdown";
import SortDropdown from "../components/common/SortDropdown";
import Pagination from "../components/common/Pagination";
import ExportWidget from "../components/common/ExportWidget";

const ShopOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Data Table States
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // Default to all orders depending on shop owner preference
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Slightly more items since cards are compact

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

  useEffect(() => {
    fetchOrders();
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
  }, [searchTerm, filter, sortOrder]);

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
    <div className="p-8 bg-primary min-h-screen">
      <div className="flex flex-col flex-wrap md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white whitespace-nowrap">
            Manage Incoming Orders
          </h1>
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
                    ? (o.OrderRevenueLog?.shop_final_earning ?? 0)
                    : "Pending",
              },
            ]}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, name, email..."
          />
          <div className="flex gap-3">
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
        <div className="p-8 text-center text-neutral-light bg-neutral-dark rounded border border-neutral-mid">
          No orders match your criteria.
        </div>
      ) : (
        <div className="space-y-6">
          {paginatedOrders.map((order) => (
            <div
              key={order.id}
              className="bg-neutral-dark p-6 rounded shadow border-l-4 border-warning"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-bold text-lg text-white">
                    Order #{order.id}
                  </h2>
                  <p className="text-sm text-neutral-light">
                    From: {order.User?.name || "N/A"} (
                    {order.User?.mobile_number
                      ? order.User.mobile_number + " | "
                      : ""}
                    {order.User?.email})
                  </p>
                  <p className="text-sm text-neutral-light">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm font-bold mt-1 text-accent">
                    Total: ₹{order.grand_total}
                  </p>
                  <p className="text-sm font-bold mt-1 text-green-400">
                    Your Earning:{" "}
                    {order.status === "delivered"
                      ? `₹${order.OrderRevenueLog?.shop_final_earning ?? 0}`
                      : "Pending"}
                  </p>
                  <p className="text-sm mt-1 text-white">
                    Addr: {order.delivery_address}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <span
                    className={`px-2 py-1 rounded text-center text-xs font-bold ${
                      order.final_status_locked ||
                      ["delivered", "failed", "cancelled"].includes(
                        order.status,
                      )
                        ? "bg-neutral-mid text-white"
                        : "bg-warning text-primary"
                    }`}
                  >
                    {order.final_status_locked
                      ? "FINALIZED"
                      : order.status.toUpperCase()}
                  </span>

                  {!order.final_status_locked &&
                    !["delivered", "failed", "cancelled"].includes(
                      order.status,
                    ) && (
                      <div className="flex flex-col gap-2 mt-2 w-full">
                        {order.status === "pending" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(order.id, "accepted")
                            }
                            className="bg-accent text-primary text-xs px-3 py-2 rounded font-bold hover:bg-secondary transition-colors"
                          >
                            Accept Order
                          </button>
                        )}
                        {order.status === "accepted" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(order.id, "out_for_delivery")
                            }
                            className="bg-purple-600 text-white text-xs px-3 py-2 rounded font-bold hover:bg-purple-500 transition-colors"
                          >
                            Mark Out for Delivery
                          </button>
                        )}
                        {order.status === "out_for_delivery" && (
                          <>
                            <button
                              onClick={() => {
                                setActiveModal("delivery");
                                setModalOrderId(order.id);
                              }}
                              className="bg-green-600 text-white text-xs px-3 py-2 rounded font-bold hover:bg-green-500 transition-colors"
                            >
                              Complete Delivery
                            </button>
                            <button
                              onClick={() => {
                                setActiveModal("failure");
                                setModalOrderId(order.id);
                              }}
                              className="bg-danger text-white text-xs px-3 py-2 rounded font-bold hover:bg-red-500 transition-colors"
                            >
                              Report Failure
                            </button>
                          </>
                        )}

                        {/* Cancel implicitly allowed if not finalized, primarily for pending or accepted */}
                        <button
                          onClick={() => {
                            setActiveModal("cancel");
                            setModalOrderId(order.id);
                          }}
                          className="border border-danger/50 text-danger text-xs px-3 py-1.5 rounded font-bold hover:bg-danger/10 transition-colors mt-2"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}

                  {/* Customer Rating Details */}
                  {order.is_rated && (
                    <div className="mt-2 text-right text-xs bg-neutral-dark/50 border border-neutral-mid/30 p-2 rounded-md">
                      <p className="text-neutral-light font-semibold mb-1">
                        Customer Feedback:
                      </p>
                      <p className="text-white flex items-center justify-end gap-1">
                        Shop:{" "}
                        <span className="text-warning">
                          ★ {order.shop_rating}
                        </span>
                      </p>
                      <p className="text-white flex items-center justify-end gap-1">
                        Delivery:{" "}
                        <span className="text-warning">
                          ★ {order.delivery_rating}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-primary p-4 rounded border border-neutral-mid">
                <h3 className="font-bold text-sm mb-2 text-neutral-light">
                  Items:
                </h3>
                {order.OrderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm mb-1 text-white"
                  >
                    <span>
                      {item.quantity} x{" "}
                      {item.Product
                        ? item.Product.name
                        : item.options?.file_url
                          ? "Xerox Doc"
                          : "Unknown"}
                    </span>
                    {item.file_url && (
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent underline text-xs"
                      >
                        View Document
                      </a>
                    )}
                  </div>
                ))}
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
