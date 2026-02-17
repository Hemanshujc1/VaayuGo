import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const ShopOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders/shop-orders");
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        ),
      );
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading)
    return <div className="text-white text-center">Loading Orders...</div>;

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 text-neutral-light">
        <p className="text-xl">No orders received yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-neutral-dark border border-neutral-mid rounded shadow">
        <thead className="bg-neutral-mid text-white">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
              Order ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
              Items
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-mid">
          {orders.map((order) => (
            <tr
              key={order.id}
              className="hover:bg-neutral-mid/30 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                #{order.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-neutral-light">
                <div className="font-bold text-white">
                  {order.User?.username || "Guest"}
                </div>
                <div className="text-xs">{order.User?.email}</div>
                <div className="text-xs mt-1 text-accent">
                  {order.delivery_address?.substring(0, 20)}...
                </div>
              </td>
              <td className="px-6 py-4 text-neutral-light text-sm">
                <ul className="list-disc list-inside">
                  {order.OrderItems?.map((item) => (
                    <li key={item.id}>
                      {item.quantity} x{" "}
                      {item.name || item.Product?.name || "Unknown"}
                      {item.options && (
                        <div className="text-xs text-neutral-light ml-4">
                          {item.options.color}, {item.options.sides},{" "}
                          {item.options.binding !== "none"
                            ? `Binding: ${item.options.binding}`
                            : ""}
                        </div>
                      )}
                      {item.file_url && (
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent ml-4 hover:underline block"
                        >
                          View Document
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-white font-bold">
                ₹{order.grand_total}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-neutral-light text-sm">
                {new Date(order.createdAt).toLocaleDateString()}
                <br />
                {new Date(order.createdAt).toLocaleTimeString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full uppercase
                    ${
                      order.status === "delivered"
                        ? "bg-green-900 text-green-200"
                        : order.status === "accepted"
                          ? "bg-teal-900 text-teal-200"
                          : order.status === "cancelled"
                            ? "bg-red-900 text-red-200"
                            : order.status === "ready"
                              ? "bg-blue-900 text-blue-200"
                              : order.status === "out_for_delivery"
                                ? "bg-purple-900 text-purple-200"
                                : "bg-yellow-900 text-yellow-200"
                    }`}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {order.status === "pending" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(order.id, "accepted")}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors shadow-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to cancel this order?",
                          )
                        )
                          updateStatus(order.id, "cancelled");
                      }}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors shadow-sm"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="bg-neutral-mid text-white border border-neutral-light rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent"
                    disabled={
                      order.status === "delivered" ||
                      order.status === "cancelled"
                    }
                  >
                    <option value="accepted">Accepted</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ShopOrders;
