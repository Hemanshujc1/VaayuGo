import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isShopkeeper = user?.role === "shopkeeper";
  const isCustomer = user?.role === "customer";

  const fetchOrderDetails = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      console.error("Error fetching order details", err);
      setError(err.response?.data?.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-white min-h-screen bg-primary">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 text-danger min-h-screen bg-primary font-bold">
        {error || "Order not found."}
      </div>
    );
  }

  const revenueLog = order.OrderRevenueLog;

  return (
    <div className="p-4 md:p-8 bg-primary min-h-screen text-primary-text pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="text-accent hover:underline flex items-center gap-1 mb-4"
        >
          &larr; Back
        </button>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Order Details #{order.id}
        </h1>
        <div className="flex flex-wrap gap-2 items-center mb-6">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              order.final_status_locked ||
              ["delivered", "failed", "cancelled"].includes(order.status)
                ? "bg-neutral-mid text-white"
                : "bg-warning text-primary"
            }`}
          >
            {order.status.toUpperCase()}
          </span>
          <span className="text-sm text-neutral-light">
            Created: {new Date(order.createdAt).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Info Box */}
          <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
            <h2 className="text-lg font-bold mb-4 text-accent">
              Customer Info
            </h2>
            {order.User ? (
              <div className="space-y-2 text-sm text-white">
                <p>
                  <span className="text-neutral-light">Name:</span>{" "}
                  {order.User.name}
                </p>
                <p>
                  <span className="text-neutral-light">Email:</span>{" "}
                  {order.User.email}
                </p>
                <p>
                  <span className="text-neutral-light">Phone:</span>{" "}
                  {order.User.mobile_number || "N/A"}
                </p>
                <div className="mt-4 border-t border-neutral-mid pt-4">
                  <p className="font-semibold mb-1">Delivery Address:</p>
                  <p className="bg-neutral-mid/30 p-3 rounded">
                    {order.delivery_address || order.User.address || "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-neutral-light italic text-sm">
                Customer data unavailable
              </p>
            )}
          </div>

          {/* Shop Info Box */}
          <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
            <h2 className="text-lg font-bold mb-4 text-accent">Shop Info</h2>
            {order.Shop ? (
              <div className="space-y-2 text-sm text-white">
                <p>
                  <span className="text-neutral-light">Name:</span>{" "}
                  {order.Shop.name}
                </p>
                <p>
                  <span className="text-neutral-light">Phone:</span>{" "}
                  {order.Shop.mobile_number || "N/A"}
                </p>
                <p className="mt-2">
                  <span className="text-neutral-light">Address:</span>{" "}
                  {order.Shop.location_address || "N/A"}
                </p>
              </div>
            ) : (
              <p className="text-neutral-light italic text-sm">
                Shop data unavailable
              </p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
          <h2 className="text-lg font-bold mb-4 text-accent">Order Items</h2>
          <div className="space-y-4">
            {order.OrderItems && order.OrderItems.length > 0 ? (
              order.OrderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row justify-between sm:items-center py-3 border-b border-neutral-mid last:border-0 gap-2"
                >
                  <div className="flex items-center gap-4">
                    {item.Product?.image_url ? (
                      <img
                        src={item.Product.image_url}
                        alt={item.Product.name}
                        className="w-12 h-12 object-cover rounded bg-white p-1"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-neutral-mid rounded flex items-center justify-center text-xs text-neutral-light">
                        Img
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">
                        {item.Product
                          ? item.Product.name
                          : item.options?.file_url
                            ? "Xerox Document"
                            : "Unknown Item"}
                      </p>
                      <p className="text-xs text-neutral-light">
                        Qty: {item.quantity} × ₹{item.price}
                      </p>
                      {item.file_url && (
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent underline text-xs mt-1 inline-block"
                        >
                          View Uploaded Document
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-neutral-light text-sm italic">
                No items found.
              </p>
            )}
          </div>
        </div>

        {/* Comprehensive Financial Breakdown */}
        {revenueLog && (
          <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
            <h2 className="text-lg font-bold mb-4 text-accent">
              Finance & Revenue Breakdown
            </h2>

            <div
              className={`grid grid-cols-1 ${!isCustomer ? "lg:grid-cols-2" : ""} gap-8`}
            >
              {/* Customer View of the Bill */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 border-b border-neutral-mid pb-2">
                  Order Bill
                </h3>
                <div className="space-y-2 text-sm text-neutral-light">
                  <div className="flex justify-between">
                    <span>Items Total (Gross)</span>
                    <span>₹{Number(revenueLog.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(revenueLog.product_discount_amount) > 0 && (
                    <div className="flex justify-between text-accent">
                      <span>Product Discounts</span>
                      <span>
                        -₹
                        {Number(revenueLog.product_discount_amount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-white pt-1 border-t border-neutral-mid/50">
                    <span>Net Item Sale</span>
                    <span>₹{Number(revenueLog.net_item_total).toFixed(2)}</span>
                  </div>

                  {Number(revenueLog.shop_discount_amount) > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Shop Discount Applied</span>
                      <span>
                        -₹{Number(revenueLog.shop_discount_amount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {Number(revenueLog.platform_discount_amount) > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Platform Discount Applied</span>
                      <span>
                        -₹
                        {Number(revenueLog.platform_discount_amount).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between mt-2 pt-2 border-t border-neutral-mid/50">
                    <span>Delivery Fee</span>
                    <span>
                      ₹{Number(revenueLog.applied_delivery_fee).toFixed(2)}
                    </span>
                  </div>
                  {revenueLog.is_small_order && (
                    <div className="flex justify-between text-orange-400">
                      <span>Small Order Extra Charge</span>
                      <span>
                        ₹{Number(revenueLog.small_order_fee_applied).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-lg text-white mt-3 pt-3 border-t border-neutral-mid">
                    <span>Grand Total Paid</span>
                    <span>₹{Number(order.grand_total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shopkeeper and Admin View: Revenue Splits */}
              {!isCustomer && (
                <div className="space-y-6">
                  <div className="bg-neutral-mid/20 p-4 rounded border border-neutral-mid/50">
                    <h3 className="text-sm font-semibold text-white mb-3 border-b border-neutral-mid pb-2">
                      Shop Revenue Splits
                    </h3>
                    <div className="space-y-3 text-sm text-neutral-light">
                      <div className="flex justify-between text-white font-medium bg-neutral-dark/50 p-2 rounded border border-neutral-mid/50">
                        <span>Applicable Commission Deducted</span>
                        <span className="text-danger">
                          -₹{Number(revenueLog.commission_deducted).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Shop Delivery Share</span>
                        <span className="text-green-400">
                          +₹{Number(revenueLog.shop_delivery_share).toFixed(2)}
                        </span>
                      </div>
                      {revenueLog.is_small_order && (
                        <div className="flex justify-between">
                          <span>Shop Min Order Share</span>
                          <span className="text-green-400">
                            +₹
                            {Number(revenueLog.shop_small_order_share).toFixed(
                              2,
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between font-bold text-base text-accent mt-3 pt-3 border-t border-neutral-mid">
                        <span>Final Shop Payout</span>
                        <span>
                          ₹{Number(revenueLog.shop_final_settlement).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Only View: Platform Revenue Breakdown */}
                  {isAdmin && (
                    <div className="bg-primary p-4 rounded border border-accent/30 shadow-[0_0_15px_rgba(45,212,191,0.05)]">
                      <h3 className="text-sm font-semibold text-accent mb-3 border-b border-accent/20 pb-2 flex items-center gap-2">
                        <span>🛡️</span> Platform Revenue Breakdown
                      </h3>
                      <div className="space-y-3 text-sm text-neutral-light">
                        <div className="flex justify-between">
                          <span>Commission Earned</span>
                          <span className="text-green-400">
                            +₹
                            {Number(revenueLog.commission_deducted).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery Rev (Platform Share)</span>
                          <span className="text-green-400">
                            +₹
                            {Number(revenueLog.platform_delivery_share).toFixed(
                              2,
                            )}
                          </span>
                        </div>
                        {revenueLog.is_small_order && (
                          <div className="flex justify-between">
                            <span>Small Order Rev (Platform Share)</span>
                            <span className="text-green-400">
                              +₹
                              {Number(
                                revenueLog.platform_small_order_share,
                              ).toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between mt-2 pt-2 border-t border-neutral-mid/30">
                          <span>Gross Platform Revenue</span>
                          <span className="text-white">
                            ₹
                            {(
                              Number(revenueLog.commission_deducted) +
                              Number(revenueLog.platform_delivery_share) +
                              Number(revenueLog.platform_small_order_share)
                            ).toFixed(2)}
                          </span>
                        </div>

                        {Number(revenueLog.platform_discount_amount) > 0 && (
                          <div className="flex justify-between text-danger">
                            <span>Platform Discount Cost</span>
                            <span>
                              -₹
                              {Number(
                                revenueLog.platform_discount_amount,
                              ).toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between font-bold text-base text-green-400 mt-3 pt-3 border-t border-accent/30">
                          <span>Net Platform Revenue</span>
                          <span>
                            ₹
                            {Number(revenueLog.platform_net_revenue).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
