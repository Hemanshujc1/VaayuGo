import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { toast } from "react-hot-toast";
import Pagination from "../../components/shared/common/Pagination";
import SearchBar from "../../components/shared/common/SearchBar";
import SortDropdown from "../../components/shared/common/SortDropdown";
import FilterDropdown from "../../components/shared/common/FilterDropdown";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingOrderId, setRatingOrderId] = useState(null);
  const [shopRating, setShopRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [cancelingOrderId, setCancelingOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const submitRating = async (orderId) => {
    if (shopRating === 0 || deliveryRating === 0) {
      return toast.error("Please provide both ratings.");
    }
    try {
      await api.post(`/orders/${orderId}/rate`, {
        shop_rating: shopRating,
        delivery_rating: deliveryRating,
      });
      toast.success("Thank you for your feedback!");
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                is_rated: true,
                shop_rating: shopRating,
                delivery_rating: deliveryRating,
              }
            : o,
        ),
      );
      setRatingOrderId(null);
      setShopRating(0);
      setDeliveryRating(0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit rating");
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!cancelReason.trim()) {
      return toast.error("Please provide a reason for cancellation.");
    }
    try {
      await api.put(`/orders/${orderId}/status`, {
        status: "cancelled",
        cancel_reason: cancelReason,
      });
      toast.success("Order cancelled successfully");
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "cancelled",
                cancel_reason: cancelReason,
                cancelled_by: "customer",
              }
            : o,
        ),
      );
      setCancelingOrderId(null);
      setCancelReason("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel order");
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders/my-orders");
        setOrders(res.data);
      } catch (error) {
        console.error("Error fetching orders", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  if (loading) return <div className="text-white p-8">Loading Orders...</div>;

  const filteredAndSortedOrders = orders
    .filter((o) => {
      const shopName = o.Shop?.name || "Unknown Shop";
      const matchesSearch = shopName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
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
    <div className="min-h-screen bg-primary text-primary-text pb-20">
      <div className="container mx-auto p-4 md:p-8 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6 text-white">My Orders</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Shop Name..."
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

        {currentOrders.length === 0 ? (
          <p className="text-neutral-light">
            {orders.length === 0
              ? "No past orders found."
              : "No matching orders found."}
          </p>
        ) : (
          <div className="space-y-4">
            {currentOrders.map((order) => (
              <div
                key={order.id}
                className="bg-neutral-dark p-4 rounded shadow border-l-4 border-accent"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <h2 className="font-bold text-lg text-white">
                      {order.Shop?.name || "Unknown Shop"}
                    </h2>
                    <p className="text-sm text-neutral-light">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm mt-1 text-gray-300">
                      {order.delivery_address}
                    </p>
                    <div className="mt-2 pt-2 border-t border-neutral-mid">
                      <ul className="text-sm text-neutral-light list-disc list-inside">
                        {order.OrderItems?.map((item) => (
                          <li key={item.id}>
                            {item.quantity} x{" "}
                            {item.name || item.Product?.name || "Item"}
                            {item.options && (
                              <span className="text-xs ml-2 text-gray-500">
                                ({item.options.color}, {item.options.sides})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {order.status === "out_for_delivery" &&
                      order.delivery_otp && (
                        <div className="mt-4 p-3 bg-secondary/10 border border-secondary/50 rounded-lg max-w-sm">
                          <p className="text-secondary font-bold text-xs uppercase tracking-wider">
                            Delivery OTP
                          </p>
                          <p className="text-2xl font-mono text-white tracking-widest">
                            {order.delivery_otp}
                          </p>
                          <p className="text-xs text-neutral-light mt-1">
                            Share this code with the delivery partner.
                          </p>
                        </div>
                      )}

                    {order.status === "failed" && order.failure_reason && (
                      <div className="mt-3 text-sm text-danger bg-danger/10 p-2 rounded inline-block">
                        <span className="font-bold">Failure Reason:</span>{" "}
                        {order.failure_reason}
                      </div>
                    )}
                    {order.status === "cancelled" && order.cancel_reason && (
                      <div className="mt-3 text-sm text-neutral-light bg-neutral-dark/80 p-2 rounded inline-block">
                        <span className="font-bold capitalize">
                          Cancelled By {order.cancelled_by}:
                        </span>{" "}
                        {order.cancel_reason}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-white">
                      ₹{order.grand_total}
                    </p>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold inline-block mt-2 ${
                        order.status === "delivered"
                          ? "bg-secondary text-primary"
                          : order.status === "cancelled"
                            ? "bg-danger text-white"
                            : "bg-warning text-primary"
                      }`}
                    >
                      {order.status.toUpperCase()}
                    </span>

                    <div className="mt-3">
                      <Link
                        to={`/my-orders/${order.id}`}
                        className="inline-block text-xs font-bold text-teal-400 border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500 hover:text-primary px-4 py-2 rounded-lg transition-colors shadow-sm"
                      >
                        View Full Receipt
                      </Link>
                    </div>

                    {order.status !== "cancelled" &&
                      order.status !== "delivered" &&
                      order.status !== "failed" &&
                      (Date.now() - new Date(order.createdAt).getTime()) /
                        60000 <=
                        10 && (
                        <div className="mt-4">
                          <button
                            onClick={() => {
                              setCancelingOrderId(order.id);
                              setCancelReason("");
                            }}
                            className="text-xs bg-danger/10 border border-danger/50 text-danger px-3 py-1.5 rounded font-bold hover:bg-danger hover:text-white transition-colors"
                          >
                            Cancel Order
                          </button>
                        </div>
                      )}
                    {order.status === "delivered" &&
                      !order.is_rated &&
                      ratingOrderId !== order.id && (
                        <div className="mt-4">
                          <button
                            onClick={() => {
                              setRatingOrderId(order.id);
                              setShopRating(0);
                              setDeliveryRating(0);
                            }}
                            className="text-xs bg-accent text-primary px-3 py-1.5 rounded font-bold hover:bg-secondary transition-colors"
                          >
                            Rate Order
                          </button>
                        </div>
                      )}
                    {order.is_rated && (
                      <div className="mt-4 flex flex-col items-end text-xs text-neutral-light">
                        <span className="flex items-center gap-1">
                          Shop:{" "}
                          <span className="text-warning">
                            ★ {order.shop_rating}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          Delivery:{" "}
                          <span className="text-warning">
                            ★ {order.delivery_rating}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {ratingOrderId === order.id && (
                  <div className="mt-4 pt-4 border-t border-neutral-light/20 bg-neutral-dark/50 p-4 rounded-xl">
                    <h3 className="text-sm font-bold text-white mb-4">
                      Rate your experience
                    </h3>

                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <label className="block text-xs text-neutral-light mb-2 uppercase tracking-wide">
                          Shop Rating
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={`shop-${star}`}
                              onClick={() => setShopRating(star)}
                              className={`text-2xl transition-colors ${shopRating >= star ? "text-warning" : "text-neutral-mid hover:text-warning/50"}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1">
                        <label className="block text-xs text-neutral-light mb-2 uppercase tracking-wide">
                          Delivery Rating
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={`delivery-${star}`}
                              onClick={() => setDeliveryRating(star)}
                              className={`text-2xl transition-colors ${deliveryRating >= star ? "text-warning" : "text-neutral-mid hover:text-warning/50"}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        onClick={() => setRatingOrderId(null)}
                        className="px-4 py-2 rounded text-sm font-medium text-neutral-light hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => submitRating(order.id)}
                        className="px-4 py-2 rounded text-sm font-bold bg-accent text-primary hover:bg-secondary transition-colors shadow-lg shadow-accent/20"
                      >
                        Submit Feedback
                      </button>
                    </div>
                  </div>
                )}

                {cancelingOrderId === order.id && (
                  <div className="mt-4 pt-4 border-t border-danger/20 bg-danger/5 p-4 rounded-xl">
                    <h3 className="text-sm font-bold text-danger mb-4">
                      Cancel Order
                    </h3>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Why do you want to cancel?"
                      className="w-full p-2 rounded bg-neutral-dark text-white border border-neutral-mid mb-4 text-sm"
                      rows={2}
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setCancelingOrderId(null);
                          setCancelReason("");
                        }}
                        className="px-4 py-2 rounded text-sm font-medium text-neutral-light hover:text-white transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-4 py-2 rounded text-sm font-bold bg-danger text-white hover:bg-red-600 transition-colors shadow-lg shadow-danger/20"
                      >
                        Confirm Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 pt-6 border-t border-neutral-mid/40">
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

export default MyOrders;
