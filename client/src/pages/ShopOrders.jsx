import { useState, useEffect } from "react";
import api from "../api/axios";

const ShopOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders/shop-orders");
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      // Optimistic update or refetch
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    } catch (error) {
      alert("Failed to update status");
    }
  };

  if (loading)
    return (
      <div className="text-white text-center mt-20">Loading Orders...</div>
    );

  return (
    <div className="p-8 bg-primary min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-white">
        Manage Incoming Orders
      </h1>
      {orders.length === 0 ? (
        <p className="text-neutral-light">No orders yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
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
                  <p className="text-sm mt-1 text-white">
                    Addr: {order.delivery_address}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <span
                    className={`px-2 py-1 rounded text-center text-xs font-bold ${
                      order.status === "delivered"
                        ? "bg-secondary text-primary"
                        : "bg-warning text-primary"
                    }`}
                  >
                    {order.status.toUpperCase()}
                  </span>

                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusUpdate(order.id, e.target.value)
                    }
                    className="border border-neutral-mid bg-neutral-mid text-white p-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accept</option>
                    <option value="preparing">Preparing</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancel</option>
                  </select>

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
        </div>
      )}
    </div>
  );
};

export default ShopOrders;
