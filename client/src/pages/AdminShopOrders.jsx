import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

const AdminShopOrders = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [id]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get(`/admin/shops/${id}/orders`);
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching shop orders", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="text-white text-center p-4">Loading Orders...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Shop Order History</h2>
        <button
          onClick={() => navigate(`/admin/shops/${id}`)}
          className="bg-neutral-mid text-white px-4 py-2 rounded-lg hover:bg-neutral-light/20 transition-colors font-bold text-sm"
        >
          ← Back to Shop
        </button>
      </div>
      <div className="bg-neutral-dark p-6 rounded-xl shadow border border-neutral-mid">
        <h3 className="text-lg font-bold text-white mb-4">
          Recent Shop Orders ({orders.length})
        </h3>
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-neutral-light text-center py-4 text-sm">
              No orders recorded yet.
            </p>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="bg-primary p-3 rounded border border-neutral-mid flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">
                      Order #{o.id}
                    </span>
                    <button
                      onClick={() => navigate(`/admin/orders/${o.id}`)}
                      className="text-xs bg-neutral-mid hover:bg-neutral-light text-white px-2 py-1 rounded"
                    >
                      View
                    </button>
                    {o.DeliverySlot && (
                      <span className="text-[10px] text-neutral-light bg-neutral-mid/30 px-1.5 py-0.5 rounded border border-neutral-light/10">
                        Slot: {o.DeliverySlot.name}
                      </span>
                    )}
                    {o.delivery_attempt > 1 && (
                      <span className="bg-accent/20 text-accent text-[10px] font-bold px-1.5 py-0.5 rounded border border-accent/30 animate-pulse">
                        RETRY {o.delivery_attempt}
                      </span>
                    )}
                    {o.status === "delivered" && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          o.settlement_id
                            ? "bg-green-600/20 text-green-400 border-green-600/30"
                            : "bg-warning/20 text-warning border-warning/30"
                        }`}
                      >
                        {o.settlement_id ? "SETTLED" : "UNSETTLED"}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      o.status === "delivered"
                        ? "bg-green-900/50 text-green-400"
                        : o.status === "cancelled" || o.status === "failed"
                          ? "bg-red-900/50 text-red-400"
                          : "bg-yellow-900/50 text-yellow-400"
                    }`}
                  >
                    {o.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-light">
                    Val: <span className="text-white">₹{o.grand_total}</span>
                  </span>
                  <span className="text-neutral-500">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminShopOrders;
