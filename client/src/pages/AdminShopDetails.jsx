import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api/axios";

const AdminShopDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [shop, setShop] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Still fetching the overview data here. The arrays (products, orders) will be fetched in child routes.
  useEffect(() => {
    fetchShopOverview();
  }, [id]);

  const fetchShopOverview = async () => {
    try {
      const { data } = await api.get(`/admin/shops/${id}`);
      setShop(data.shop);
      setMetrics(data.metrics || null);
    } catch (error) {
      console.error("Error fetching shop details", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="text-white text-center mt-20">
        Loading Shop Details...
      </div>
    );
  if (!shop)
    return <div className="text-danger text-center mt-20">Shop Not Found</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* 1. Header & Identity */}
      <div className="bg-neutral-dark p-6 rounded-xl shadow-lg border border-neutral-mid mb-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full -z-10 blur-2xl"></div>
        {shop.image_url ? (
          <img
            src={shop.image_url}
            alt={shop.name}
            className="w-24 h-24 object-cover rounded-full border-4 border-neutral-mid shadow-lg"
          />
        ) : (
          <div className="w-24 h-24 bg-neutral-mid flex items-center justify-center rounded-full text-3xl shadow-lg border-4 border-neutral-mid">
            🏪
          </div>
        )}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{shop.name}</h1>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full border ${
                shop.status === "approved"
                  ? "bg-green-900/40 text-green-400 border-green-800"
                  : shop.status === "rejected"
                    ? "bg-red-900/40 text-red-400 border-red-800"
                    : "bg-yellow-900/40 text-yellow-400 border-yellow-800"
              }`}
            >
              {shop.status.toUpperCase()}
            </span>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full border ${
                shop.is_open
                  ? "bg-blue-900/40 text-blue-400 border-blue-800"
                  : "bg-neutral-600/40 text-neutral-400 border-neutral-600"
              }`}
            >
              {shop.is_open ? "🟢 OPEN" : "🔴 CLOSED"}
            </span>
          </div>
          <p className="text-neutral-light text-sm mb-1 line-clamp-2">
            📍 {shop.location_address}
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-neutral-400 mt-2">
            <span>
              Owner:{" "}
              <span className="text-white font-medium">
                {shop.User?.name || "Unknown"}
              </span>
            </span>
            <span>📞 {shop.User?.mobile_number || "N/A"}</span>
            <span>Shop ID: {shop.id}</span>
          </div>
        </div>
        <button
          onClick={() => navigate("/admin/shops")}
          className="bg-neutral-mid text-white px-6 py-2 rounded-full hover:bg-neutral-light/20 transition-colors font-bold text-sm shadow whitespace-nowrap"
        >
          ← Back to Shops
        </button>
      </div>

      {metrics && (
        <>
          {/* SECTION 1: SALES */}
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🛒</span> 1. Sales Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-neutral-dark p-5 rounded-lg shadow border-l-4 border-white hover:border-neutral-light transition-colors">
              <h3 className="text-neutral-light font-bold text-xs uppercase tracking-wide">
                Shop GMV
              </h3>
              <p className="text-2xl font-bold text-white mt-1">
                ₹{metrics.shopGmv || "0.00"}
              </p>
              <p className="text-[10px] text-neutral-500 mt-1">
                Gross Merchandise Value before total discounts
              </p>
            </div>
            <div className="bg-neutral-dark p-5 rounded-lg shadow border-l-4 border-blue-400 hover:border-blue-300 transition-colors">
              <h3 className="text-neutral-light font-bold text-xs uppercase tracking-wide">
                Net GMV
              </h3>
              <p className="text-2xl font-bold text-blue-400 mt-1">
                ₹{metrics.shopNetGmv || "0.00"}
              </p>
              <p className="text-[10px] text-neutral-500 mt-1">
                Value after ALL discounts
              </p>
            </div>
            <div className="bg-neutral-dark p-5 rounded-lg shadow border-l-4 border-secondary hover:border-secondary/80 transition-colors">
              <h3 className="text-neutral-light font-bold text-xs uppercase tracking-wide">
                Total Delivered
              </h3>
              <p className="text-2xl font-bold text-secondary mt-1">
                {metrics.totalCompletedOrders || 0}
              </p>
              <p className="text-[10px] text-neutral-500 mt-1">
                Successfully completed orders
              </p>
            </div>
            <div className="bg-neutral-dark p-5 rounded-lg shadow border-l-4 border-accent hover:border-accent/80 transition-colors">
              <h3 className="text-neutral-light font-bold text-xs uppercase tracking-wide">
                AOV (Avg Order Value)
              </h3>
              <p className="text-2xl font-bold text-accent mt-1">
                ₹{metrics.aov || "0.00"}
              </p>
              <p className="text-[10px] text-neutral-500 mt-1">
                Net GMV / Completed Orders
              </p>
            </div>
          </div>

          {/* SECTION 2: PLATFORM REVENUE */}
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>📈</span> 2. Platform Revenue from this Shop
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="col-span-1 lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-primary p-4 rounded-lg shadow border border-neutral-mid flex justify-between items-center">
                <span className="text-neutral-light text-sm">
                  Total Commission
                </span>
                <span className="text-white font-bold text-lg">
                  ₹{metrics.totalCommission || "0.00"}
                </span>
              </div>
              <div className="bg-primary p-4 rounded-lg shadow border border-neutral-mid flex justify-between items-center">
                <span className="text-neutral-light text-sm">
                  Delivery Rev (Platform)
                </span>
                <span className="text-white font-bold text-lg">
                  ₹{metrics.deliveryRevenuePlatformShare || "0.00"}
                </span>
              </div>
              <div className="bg-primary p-4 rounded-lg shadow border border-neutral-mid flex justify-between items-center">
                <span className="text-neutral-light text-sm">
                  Small Order (Platform)
                </span>
                <span className="text-white font-bold text-lg">
                  ₹{metrics.smallOrderRevenuePlatformShare || "0.00"}
                </span>
              </div>
              <div className="bg-primary p-4 rounded-lg shadow border border-warning/50 flex justify-between items-center">
                <span className="text-warning text-sm">Gross Platform Rev</span>
                <span className="text-warning font-bold text-lg">
                  ₹{metrics.grossPlatformRevenue || "0.00"}
                </span>
              </div>
              <div className="bg-primary p-4 rounded-lg shadow border border-danger/50 flex justify-between items-center col-span-2">
                <span className="text-danger text-sm">
                  Platform Discounts Supplied
                </span>
                <span className="text-danger font-bold text-lg">
                  - ₹{metrics.platformDiscounts || "0.00"}
                </span>
              </div>
            </div>

            <div className="bg-linear-to-br from-neutral-dark to-primary p-6 rounded-xl shadow-lg border border-green-500/50 flex flex-col justify-center items-center relative overflow-hidden text-center">
              <div className="absolute -left-10 -bottom-10 text-green-500/10 text-9xl">
                💰
              </div>
              <h3 className="text-green-400 font-bold text-sm uppercase tracking-wider mb-2 z-10">
                Net Platform Revenue
              </h3>
              <p className="text-5xl font-black text-green-400 mt-2 z-10">
                ₹{metrics.netPlatformRevenue || "0.00"}
              </p>
              <p className="text-xs text-green-200/60 mt-4 max-w-[200px] z-10 leading-relaxed">
                Actual Earnings from this shop after all funded discounts
              </p>
            </div>
          </div>

          {/* SECTION 3: SHOP EARNINGS */}
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🏪</span> 3. Shop Earnings & Settlement
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-linear-to-bl from-neutral-dark to-primary p-6 rounded-xl shadow-lg border border-accent/50 flex flex-col justify-center items-center relative overflow-hidden text-center order-last lg:order-first">
              <div className="absolute -right-6 -bottom-6 text-accent/10 text-9xl">
                🏛️
              </div>
              <h3 className="text-accent font-bold text-sm uppercase tracking-wider mb-2 z-10">
                Shop Final Settlement
              </h3>
              <p className="text-5xl font-black text-accent mt-2 z-10">
                ₹{metrics.shopNetRevenueFinalSettlement || "0.00"}
              </p>
              <p className="text-xs text-accent/60 mt-4 max-w-[200px] z-10 leading-relaxed">
                The net payout to this shopkeeper
              </p>
            </div>

            <div className="col-span-1 lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-primary p-4 rounded-lg shadow border border-neutral-mid flex justify-between items-center">
                <span className="text-neutral-light text-sm">
                  Shop Net Sale
                </span>
                <span className="text-white font-bold text-lg">
                  ₹{metrics.shopNetSale || "0.00"}
                </span>
              </div>
              <div className="p-4 rounded-lg shadow border border-danger/50 flex justify-between items-center bg-danger/5">
                <span className="text-danger text-sm">Shop Paid Discounts</span>
                <span className="text-danger font-bold text-lg">
                  - ₹{metrics.totalShopDiscounts || "0.00"}
                </span>
              </div>
              <div className="p-4 rounded-lg shadow border border-danger/50 flex justify-between items-center bg-danger/5">
                <span className="text-danger text-sm">Commission Deducted</span>
                <span className="text-danger font-bold text-lg">
                  - ₹{metrics.commissionDeducted || "0.00"}
                </span>
              </div>
              <div className="bg-primary p-4 rounded-lg shadow border border-neutral-mid flex justify-between items-center">
                <span className="text-neutral-light text-sm">
                  Delivery Rev (Shop)
                </span>
                <span className="text-white font-bold text-lg">
                  + ₹{metrics.deliveryRevenueShopShare || "0.00"}
                </span>
              </div>
              <div className="bg-primary p-4 rounded-lg shadow border border-neutral-mid flex justify-between items-center">
                <span className="text-neutral-light text-sm">
                  Small Order (Shop)
                </span>
                <span className="text-white font-bold text-lg">
                  + ₹{metrics.smallOrderRevenueShopShare || "0.00"}
                </span>
              </div>
              <div className="bg-primary p-4 rounded-lg shadow border border-warning/50 flex justify-between items-center">
                <span className="text-warning text-sm">Shop Gross Rev</span>
                <span className="text-warning font-bold text-lg">
                  ₹{metrics.shopGrossRevenue || "0.00"}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Navigation Links */}
      <div className="mt-8 flex gap-4 border-t border-neutral-mid pt-8">
        <Link
          to={`/admin/shops/${id}/products`}
          className="flex-1 bg-neutral-dark border border-teal-500/30 text-teal-400 font-bold text-center py-4 rounded-xl hover:bg-teal-500 hover:text-primary transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <span>📦</span> View All Products
        </Link>
        <Link
          to={`/admin/shops/${id}/orders`}
          className="flex-1 bg-neutral-dark border border-amber-500/30 text-amber-400 font-bold text-center py-4 rounded-xl hover:bg-amber-500 hover:text-primary transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <span>🧾</span> View All Orders
        </Link>
      </div>
    </div>
  );
};

export default AdminShopDetails;
