import { useState, useEffect } from "react";
import api from "../api/axios";

import Navbar from "../components/Navbar";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-white p-8">Loading Orders...</div>;

  return (
    <div className="min-h-screen bg-primary text-primary-text pb-20">
      <Navbar />
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6 text-white">My Orders</h1>
        {orders.length === 0 ? (
          <p className="text-neutral-light">No past orders found.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-neutral-dark p-4 rounded shadow border-l-4 border-accent"
              >
                <div className="flex justify-between items-start">
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
