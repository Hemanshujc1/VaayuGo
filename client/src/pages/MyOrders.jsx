import { useState, useEffect } from "react";
import api from "../api/axios";
import { toast } from "react-hot-toast";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingOrderId, setRatingOrderId] = useState(null);
  const [shopRating, setShopRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);

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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
