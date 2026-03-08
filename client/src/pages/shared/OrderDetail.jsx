import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userRole = user?.role?.toLowerCase() || "customer";

  const isAdmin = userRole === "admin" || userRole === "super_admin";
  const isShopkeeper = userRole === "shopkeeper" || userRole === "shop";
  const isCustomer = userRole === "customer" || userRole === "user";

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
    <div className="p-4 md:p-8 bg-primary min-h-screen text-neutral-light pb-20 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-2 mb-2 text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Orders
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              Order #{order.id}
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase border ${
                  order.final_status_locked ||
                  ["delivered", "failed", "cancelled"].includes(order.status)
                    ? "bg-slate-800/80 text-slate-300 border-slate-700"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}
              >
                {order.status}
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Placed on{" "}
              {new Date(order.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>

          {/* Action Buttons Container (Placeholder for future actions) */}
          <div className="flex gap-3">
            {/* Download Invoice Button could go here */}
          </div>
        </div>

        {/* Entities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Info Card */}
          <div className="bg-neutral-dark p-6 rounded-2xl border border-neutral-mid shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-blue-500 to-indigo-600 opacity-50"></div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">
                Customer Details
              </h2>
            </div>

            {order.User ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Name</span>
                  <span className="font-medium text-slate-200">
                    {order.User.name}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Email</span>
                  <span className="font-medium text-slate-200">
                    {order.User.email}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Phone</span>
                  <span className="font-medium text-slate-200">
                    {order.User.mobile_number || "N/A"}
                  </span>
                </div>
                <div className="pt-3">
                  <p className="text-xs text-neutral-light mb-1 uppercase tracking-wider font-semibold">
                    Delivery Address
                  </p>
                  <p className="bg-primary p-3 rounded-xl border border-neutral-mid text-white leading-relaxed">
                    {order.delivery_address || order.User.address || "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic text-sm flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Customer data unavailable
              </p>
            )}
          </div>

          {/* Shop Info Card */}
          <div className="bg-neutral-dark p-6 rounded-2xl border border-neutral-mid shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 h-full bg-linear-to-b from-teal-400 to-emerald-600 opacity-50"></div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-teal-400/10 flex items-center justify-center text-teal-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">Shop Details</h2>
            </div>

            {order.Shop ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Shop Name</span>
                  <span className="font-medium text-slate-200">
                    {order.Shop.name}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span className="text-slate-400">Contact</span>
                  <span className="font-medium text-slate-200">
                    {order.Shop?.User?.mobile_number || "N/A"}
                  </span>
                </div>
                <div className="pt-3">
                  <p className="text-xs text-neutral-light mb-1 uppercase tracking-wider font-semibold">
                    Location
                  </p>
                  <p className="bg-primary p-3 rounded-xl border border-neutral-mid text-white leading-relaxed">
                    {order.Shop.location_address || "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic text-sm flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Shop data unavailable
              </p>
            )}
          </div>
        </div>

        {/* Delivery Slot & Retry Info */}
        <div className="bg-neutral-dark p-6 rounded-2xl border border-neutral-mid shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-orange-500 to-amber-600 opacity-50"></div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">
              Delivery Slot & Status
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-primary/50 p-4 rounded-xl border border-neutral-mid">
              <p className="text-xs text-neutral-light mb-1 uppercase tracking-wider font-semibold">
                Scheduled Slot
              </p>
              <p className="text-white font-medium">
                {order.DeliverySlot?.name || "N/A"}
              </p>
              <p className="text-xs text-neutral-light mt-0.5">
                {order.DeliverySlot?.start_time} -{" "}
                {order.DeliverySlot?.end_time}
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border ${order.delivery_attempt > 1 ? "bg-accent/10 border-accent/30" : "bg-primary/50 border-neutral-mid"}`}
            >
              <p className="text-xs text-neutral-light mb-1 uppercase tracking-wider font-semibold">
                Delivery Attempts
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-bold ${order.delivery_attempt > 1 ? "text-accent" : "text-white"}`}
                >
                  Attempt {order.delivery_attempt} / 2
                </span>
                {order.delivery_attempt > 1 && (
                  <span className="bg-accent text-primary text-[10px] font-black px-2 py-0.5 rounded">
                    RETRYING
                  </span>
                )}
              </div>
              {order.last_attempt_failed_at && (
                <p className="text-[10px] text-neutral-light mt-1 italic">
                  Last attempt failed at:{" "}
                  {new Date(order.last_attempt_failed_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {order.failure_reason && (
            <div className="mt-4 p-4 rounded-xl bg-danger/5 border border-danger/20">
              <p className="text-xs text-danger font-bold uppercase tracking-wider mb-1">
                Last Failure Note
              </p>
              <p className="text-sm text-neutral-light italic">
                "{order.failure_reason}"
              </p>
            </div>
          )}
        </div>

        {/* Order Items Table/List */}
        <div className="bg-neutral-dark rounded-2xl border border-neutral-mid shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden">
          <div className="p-6 border-b border-neutral-mid bg-primary/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Order Items</h2>
          </div>

          <div className="divide-y divide-slate-800/60">
            {order.OrderItems && order.OrderItems.length > 0 ? (
              order.OrderItems.map((item) => {
                const perUnitDiscount = item.product_discount
                  ? item.product_discount / item.quantity
                  : 0;

                const discountedUnitPrice =
                  Number(item.price_at_time) - perUnitDiscount;

                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-800/20 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-4 md:gap-6 flex-1">
                      <div className="relative group shrink-0">
                        {item.Product?.image_url ? (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white/5 border border-neutral-mid p-1.5 flex items-center justify-center">
                            <img
                              src={`http://localhost:3001${item.Product.image_url}`}
                              alt={item.Product.name}
                              className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-xl border border-neutral-mid flex flex-col items-center justify-center text-neutral-light">
                            <svg
                              className="w-6 h-6 mb-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                        {/* Quantity Badge overlay on image */}
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-slate-800 shadow-sm z-20">
                          {item.quantity}
                        </div>

                        {/* Discount Badge overlay on image (matching ProductCard) */}
                        {perUnitDiscount > 0 && (
                          <div className="absolute top-0 left-0 z-10">
                            <span className="bg-accent text-primary px-1.5 py-0.5 rounded-tl-xl rounded-br text-[10px] font-black shadow-[0_2px_10px_rgba(0,229,255,0.4)]">
                              {item.product_discount_type === "PERCENTAGE"
                                ? `${Math.round(item.product_discount_value)}% OFF`
                                : `₹${Math.round(item.product_discount_value || perUnitDiscount)} OFF`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-base md:text-lg truncate mb-1">
                          {item.Product
                            ? item.Product.name
                            : item.options?.file_url
                              ? "Document Print Job"
                              : "Unknown Item"}
                        </h3>

                        <div className="flex items-center mt-1">
                          {perUnitDiscount > 0 ? (
                            <div className="flex flex-col items-start whitespace-nowrap mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-neutral-500 line-through text-xs font-bold">
                                  ₹{Number(item.price_at_time).toFixed(2)}
                                </span>
                                <span className="text-accent font-extrabold text-lg flex items-center gap-1">
                                  ₹{discountedUnitPrice.toFixed(2)}
                                  <span className="text-neutral-light/70 text-xs font-normal">
                                    per unit
                                  </span>
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-accent font-bold text-lg flex items-center gap-1 mb-2">
                              ₹{Number(item.price_at_time).toFixed(2)}
                              <span className="text-neutral-light/70 text-xs font-normal">
                                per unit
                              </span>
                            </span>
                          )}
                        </div>

                        {item.file_url && (
                          <div className="space-y-3 mt-4">
                            <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider font-bold">
                              {item.options?.color && (
                                <span
                                  className={`px-2 py-1 rounded bg-neutral-mid border border-neutral-mid ${item.options.color === "color" ? "text-accent" : "text-white"}`}
                                >
                                  {item.options.color === "color"
                                    ? "Color"
                                    : "B&W"}
                                </span>
                              )}
                              {item.options?.sides && (
                                <span className="px-2 py-1 rounded bg-neutral-mid border border-neutral-mid text-white">
                                  {item.options.sides === "single"
                                    ? "Single Sided"
                                    : "Double Sided"}
                                </span>
                              )}
                              {item.options?.binding &&
                                item.options.binding !== "none" && (
                                  <span className="px-2 py-1 rounded bg-accent/20 border border-accent/30 text-accent">
                                    {item.options.binding} Binding
                                  </span>
                                )}
                              {item.options?.pageCount && (
                                <span className="px-2 py-1 rounded bg-neutral-mid/50 border border-neutral-mid text-neutral-light">
                                  {item.options.pageCount} Pages
                                </span>
                              )}
                            </div>

                            <a
                              href={`http://localhost:3001${item.file_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-primary hover:bg-secondary hover:text-white rounded-xl text-xs font-black transition-all shadow-lg active:scale-95"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              Download Document
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right sm:w-32 shrink-0 border-t sm:border-t-0 border-neutral-mid pt-3 sm:pt-0">
                      <p className="text-xs text-neutral-light uppercase font-semibold mb-1 hidden sm:block">
                        Item Total
                      </p>
                      <p className="font-bold text-white text-lg">
                        ₹{(discountedUnitPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-700 m-6 rounded-xl">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p>No items found in this order.</p>
              </div>
            )}
          </div>
        </div>

        {/* Comprehensive Financial Breakdown */}
        {revenueLog && (
          <div className="bg-neutral-dark rounded-2xl border border-neutral-mid shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="p-6 border-b border-neutral-mid bg-primary/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">
                Financial Summary
              </h2>
            </div>

            <div className="p-6">
              <div
                className={`grid grid-cols-1 ${!isCustomer ? "lg:grid-cols-2" : ""} gap-6 lg:gap-10`}
              >
                {/* 1. Customer View: The Bill */}
                <div className="bg-primary p-5 sm:p-6 rounded-xl border border-neutral-mid h-full relative">
                  <div className="absolute top-0 right-8 w-16 h-1 bg-teal-500/50 rounded-b-md"></div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5 flex justify-between items-center">
                    <span>Order Bill</span>
                    <span className="text-xs font-normal text-neutral-light normal-case bg-neutral-dark px-2 py-1 rounded border border-neutral-mid">
                      Customer Receipt
                    </span>
                  </h3>

                  <div className="space-y-3.5 text-sm text-slate-400">
                    <div className="flex justify-between items-center group">
                      <span
                        className="flex items-center gap-1.5 cursor-help"
                        title="Total sum of all items in the cart before any discounts"
                      >
                        Items Total (Gross)
                        <svg
                          className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </span>
                      <span className="font-medium text-slate-300">
                        ₹{Number(revenueLog.subtotal).toFixed(2)}
                      </span>
                    </div>

                    {Number(revenueLog.product_discount_amount) > 0 && (
                      <div className="flex justify-between items-center text-rose-400/90 bg-rose-500/5 -mx-2 px-2 py-1.5 rounded">
                        <span>Product Discounts Applied</span>
                        <span className="font-medium">
                          -₹
                          {Number(revenueLog.product_discount_amount).toFixed(
                            2,
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center font-medium text-slate-200 pt-2 border-t border-slate-800/80 border-dashed">
                      <span
                        className="flex items-center gap-1.5 cursor-help"
                        title="Total after product-specific discounts are removed. Also called GMV."
                      >
                        Net Item Sale
                        <svg
                          className="w-3.5 h-3.5 text-slate-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </span>
                      <span>
                        ₹{Number(revenueLog.net_item_total).toFixed(2)}
                      </span>
                    </div>

                    {Number(revenueLog.shop_discount_amount) > 0 && (
                      <div className="flex justify-between items-center text-emerald-400 bg-emerald-500/5 -mx-2 px-2 py-1.5 rounded mt-2">
                        <span>Shop Discount</span>
                        <span className="font-medium">
                          -₹{Number(revenueLog.shop_discount_amount).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {Number(revenueLog.platform_discount_amount) > 0 && (
                      <div className="flex justify-between items-center text-emerald-400 bg-emerald-500/5 -mx-2 px-2 py-1.5 rounded mt-1">
                        <span>Platform Discount (Vaayu Promo)</span>
                        <span className="font-medium">
                          -₹
                          {Number(revenueLog.platform_discount_amount).toFixed(
                            2,
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-800/80 border-dashed">
                      <span>Delivery Fee</span>
                      <span className="text-slate-300 font-medium">
                        ₹{Number(revenueLog.applied_delivery_fee).toFixed(2)}
                      </span>
                    </div>

                    {revenueLog.is_small_order && (
                      <div className="flex justify-between items-center text-amber-400/90 bg-amber-500/5 -mx-2 px-2 py-1.5 rounded mt-1">
                        <span
                          className="flex items-center gap-1.5 cursor-help"
                          title="Extra fee applied because order value was below minimum threshold"
                        >
                          Small Order Fee
                          <svg
                            className="w-3.5 h-3.5 opacity-60"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </span>
                        <span className="font-medium">
                          ₹
                          {Number(revenueLog.small_order_fee_applied).toFixed(
                            2,
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Grand Total Bar */}
                  <div className="flex justify-between items-center font-bold text-lg text-white mt-6 pt-5 border-t-2 border-slate-800">
                    <span>Grand Total Paid</span>
                    <span className="text-teal-400">
                      ₹{Number(order.grand_total).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 2 & 3. Shopkeeper and Admin Views */}
                {!isCustomer && (
                  <div className="space-y-6 flex flex-col">
                    {/* 2. Shopkeeper View: Revenue Breakdown */}
                    <div className="bg-primary p-5 sm:p-6 rounded-xl border border-neutral-mid relative">
                      <div className="absolute top-0 right-8 w-16 h-1 bg-indigo-500/50 rounded-b-md"></div>
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5 flex justify-between items-center">
                        <span>Shop Revenue Splits</span>
                        <span className="text-xs font-normal text-neutral-light normal-case bg-neutral-dark px-2 py-1 rounded border border-neutral-mid">
                          Shopkeeper Ledger
                        </span>
                      </h3>

                      <div className="space-y-3.5 text-sm text-slate-400">
                        {/* PRD Specified Fields */}
                        <div className="flex justify-between items-center">
                          <span
                            className="cursor-help"
                            title="Net Item Sale (Subtotal - Product Discounts)"
                          >
                            Shop GMV
                          </span>
                          <span className="font-medium text-slate-300">
                            ₹{Number(revenueLog.net_item_total).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span
                            className="cursor-help"
                            title="Coupons created and funded by the shop"
                          >
                            Shop Discount
                          </span>
                          <span className="font-medium text-rose-400/90">
                            -₹
                            {Number(revenueLog.shop_discount_amount).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 border-dashed text-slate-200">
                          <span
                            className="cursor-help font-medium"
                            title="GMV minus Shop Discount. The base amount shop earns from items."
                          >
                            Shop Net Sale
                          </span>
                          <span className="font-semibold">
                            ₹
                            {(
                              Number(revenueLog.net_item_total) -
                              Number(revenueLog.shop_discount_amount)
                            ).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-emerald-400/90 mt-3">
                          <span>Delivery Revenue (Shop Share)</span>
                          <span className="font-medium">
                            +₹
                            {Number(revenueLog.shop_delivery_share).toFixed(2)}
                          </span>
                        </div>

                        {revenueLog.is_small_order && (
                          <div className="flex justify-between items-center text-emerald-400/90">
                            <span>Small Order Revenue (Shop Share)</span>
                            <span className="font-medium">
                              +₹
                              {Number(
                                revenueLog.shop_small_order_share,
                              ).toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-white font-medium bg-rose-500/10 p-2.5 rounded border border-rose-500/20 mt-4">
                          <span
                            className="flex items-center gap-1.5 cursor-help"
                            title="Platform percentage fee charged on Shop Net Sale"
                          >
                            Commission Deducted
                            <svg
                              className="w-3.5 h-3.5 text-rose-400/70"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </span>
                          <span className="text-rose-400">
                            -₹
                            {Number(revenueLog.commission_deducted).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center font-bold text-base text-indigo-400 mt-5 pt-4 border-t-2 border-slate-800">
                          <span>Shop Net Revenue (Payout)</span>
                          <span className="text-lg">
                            ₹
                            {Number(revenueLog.shop_final_settlement).toFixed(
                              2,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Admin View: Platform Revenue Breakdown */}
                    {isAdmin && (
                      <div className="bg-neutral-dark shadow-inner p-5 sm:p-6 rounded-xl border border-secondary/20 relative mt-auto">
                        <div className="absolute top-0 right-8 w-16 h-1 bg-secondary rounded-b-md shadow-[0_0_10px_rgba(0,191,166,0.5)]"></div>
                        <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-5 flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                          Platform Revenue Audit
                        </h3>

                        <div className="space-y-3.5 text-sm text-slate-400">
                          <div className="flex justify-between items-center text-emerald-400/90">
                            <span>Commission Earned</span>
                            <span className="font-medium">
                              +₹
                              {Number(revenueLog.commission_deducted).toFixed(
                                2,
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-emerald-400/90">
                            <span>Delivery Revenue (Platform Share)</span>
                            <span className="font-medium">
                              +₹
                              {Number(
                                revenueLog.platform_delivery_share,
                              ).toFixed(2)}
                            </span>
                          </div>

                          {revenueLog.is_small_order && (
                            <div className="flex justify-between items-center text-emerald-400/90">
                              <span>Small Order Revenue (Platform Share)</span>
                              <span className="font-medium">
                                +₹
                                {Number(
                                  revenueLog.platform_small_order_share,
                                ).toFixed(2)}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-800/80 border-dashed text-slate-200">
                            <span className="font-medium">
                              Gross Platform Revenue
                            </span>
                            <span className="font-semibold">
                              ₹
                              {(
                                Number(revenueLog.commission_deducted) +
                                Number(revenueLog.platform_delivery_share) +
                                Number(revenueLog.platform_small_order_share)
                              ).toFixed(2)}
                            </span>
                          </div>

                          {Number(revenueLog.platform_discount_amount) > 0 && (
                            <div className="flex justify-between items-center bg-rose-500/10 -mx-2 px-2 py-1.5 rounded mt-3 text-rose-400">
                              <span
                                className="flex items-center gap-1.5 cursor-help"
                                title="Cost of platform-sponsored promo codes"
                              >
                                Platform Discount Cost
                                <svg
                                  className="w-3.5 h-3.5 opacity-70"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </span>
                              <span className="font-medium">
                                -₹
                                {Number(
                                  revenueLog.platform_discount_amount,
                                ).toFixed(2)}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center font-bold text-base text-emerald-400 mt-4 pt-4 border-t-2 border-slate-800">
                            <span>Net Platform Revenue</span>
                            <span className="text-lg">
                              ₹
                              {Number(revenueLog.platform_net_revenue).toFixed(
                                2,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settlement Information (New Section) */}
        {!isCustomer && order.status === "delivered" && (
          <div className="bg-neutral-dark rounded-2xl border border-neutral-mid shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="p-6 border-b border-neutral-mid bg-primary/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Settlement Details
                </h2>
              </div>
              <span
                className={`px-2 py-1 rounded text-[10px] font-bold border ${order.Settlement ? "bg-green-600/20 text-green-400 border-green-600/30" : "bg-warning/20 text-warning border-warning/30"}`}
              >
                {order.Settlement ? "SETTLED" : "PENDING SETTLEMENT"}
              </span>
            </div>

            <div className="p-6">
              {order.Settlement ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-primary/50 p-4 rounded-xl border border-neutral-mid/50">
                    <p className="text-xs text-neutral-light uppercase tracking-wider mb-1">
                      Settlement ID
                    </p>
                    <p className="text-white font-mono font-bold">
                      #{order.settlement_id}
                    </p>
                  </div>
                  <div className="bg-primary/50 p-4 rounded-xl border border-neutral-mid/50">
                    <p className="text-xs text-neutral-light uppercase tracking-wider mb-1">
                      Processed Date
                    </p>
                    <p className="text-white font-bold">
                      {new Date(
                        order.Settlement.createdAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-primary/50 p-4 rounded-xl border border-neutral-mid/50">
                    <p className="text-xs text-neutral-light uppercase tracking-wider mb-1">
                      Cycle Range
                    </p>
                    <p className="text-white text-sm font-medium">
                      {new Date(
                        order.Settlement.start_date,
                      ).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(order.Settlement.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-warning/5 border border-warning/20 p-4 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning shrink-0">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      Awaiting Settlement Cycle
                    </p>
                    <p className="text-xs text-neutral-light">
                      This order will be included in the next automated weekly
                      settlement run.
                    </p>
                  </div>
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
