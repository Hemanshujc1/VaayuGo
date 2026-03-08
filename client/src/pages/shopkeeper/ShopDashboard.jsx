import { useState, useEffect } from "react";
import api from "../../api/axios";
import { Link } from "react-router-dom";

const ShopDashboard = () => {
  const [shop, setShop] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShopAndAnalytics();
  }, []);

  const fetchShopAndAnalytics = async () => {
    try {
      const [shopRes, analyticsRes] = await Promise.all([
        api.get("/shop/my-shop"),
        api.get("/shop/my-analytics"),
      ]);
      setShop(shopRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setShop(null);
      } else {
        console.error("Error fetching shop data:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="text-white text-center mt-20">Loading...</div>;

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <div className="bg-neutral-dark p-8 rounded-lg shadow-lg border border-neutral-mid text-center max-w-lg w-full">
          <h2 className="text-3xl font-bold mb-4 text-accent">
            Welcome Partner!
          </h2>
          <p className="mb-8 text-neutral-light text-lg">
            You're just one step away from reaching thousands of customers.
            <br /> Register your shop to start selling on VaayuGo.
          </p>
          <Link
            to="/shop/register"
            className="inline-block bg-accent text-primary font-bold px-8 py-3 rounded-full hover:bg-secondary hover:text-white transition-all shadow-md"
          >
            Register Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{shop.name}</h1>
          <p className="text-neutral-light flex items-center gap-2 flex-wrap">
            {(shop.Categories || []).length > 0 ? (
              shop.Categories.map((cat) => (
                <span
                  key={cat.id}
                  className="bg-neutral-mid px-2 py-1 rounded text-xs text-accent border border-neutral-mid"
                >
                  {cat.name}
                </span>
              ))
            ) : (
              <span className="bg-neutral-mid px-2 py-1 rounded text-xs text-accent border border-neutral-mid">
                {shop.category || "General"}
              </span>
            )}
            <span>📍 {shop.location_address}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          {shop.status === "approved" && (
            <button
              onClick={async () => {
                try {
                  const res = await api.patch("/shop/status");
                  setShop((prev) => ({ ...prev, is_open: res.data.is_open }));
                } catch (error) {
                  console.error("Error toggling status:", error);
                }
              }}
              className={`px-6 py-2 rounded-full font-bold text-white transition-all shadow-lg ${
                shop.is_open
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {shop.is_open ? "🟢 Shop Open" : "🔴 Shop Closed"}
            </button>
          )}

          <div
            className={`px-4 py-2 rounded-full font-bold text-sm border ${
              shop.status === "approved"
                ? "bg-green-900/30 text-green-400 border-green-800"
                : shop.status === "rejected"
                  ? "bg-red-900/30 text-red-400 border-red-800"
                  : "bg-yellow-900/30 text-yellow-400 border-yellow-800"
            }`}
          >
            Status: {shop.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Pending Banner */}
      {shop.status === "pending" && (
        <div className="bg-blue-900/20 border-l-4 border-blue-500 text-blue-300 p-4 mb-8 rounded-r">
          <p className="font-medium">Admin Review In Progress</p>
          <p className="text-sm opacity-80">
            Your shop is currently under review. You can add products, but
            customers won't see your shop until it is approved.
          </p>
        </div>
      )}

      {/* Analytics Overview */}
      {shop.status === "approved" && analytics && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Earnings Dashboard
          </h2>

          {/* 1. Revenue Overview */}
          <h3 className="text-lg font-bold text-neutral-light mb-4 flex items-center gap-2">
            <span>💰</span> Revenue Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-neutral-dark p-6 rounded-xl shadow border border-neutral-mid hover:border-white transition-colors">
              <h4 className="text-neutral-light font-bold text-sm uppercase tracking-wide">
                Shop Gross Sale (GMV)
              </h4>
              <p className="text-3xl font-bold text-white mt-2">
                ₹{analytics.shopGrossSale || "0.00"}
              </p>
              <p className="text-xs text-neutral-light mt-1">
                Before any discounts
              </p>
            </div>
            <div className="bg-neutral-dark p-6 rounded-xl shadow border border-blue-400/50 hover:border-blue-400 transition-colors">
              <h4 className="text-blue-300 font-bold text-sm uppercase tracking-wide">
                Shop Net Sale
              </h4>
              <p className="text-3xl font-bold text-blue-400 mt-2">
                ₹{analytics.shopNetSale || "0.00"}
              </p>
              <p className="text-xs text-blue-200/50 mt-1">
                After Shop Discounts
              </p>
            </div>
            <div className="bg-neutral-dark p-6 rounded-xl shadow border border-accent/50 hover:border-accent transition-colors">
              <h4 className="text-accent font-bold text-sm uppercase tracking-wide">
                Potential Revenue
              </h4>
              <p className="text-3xl font-bold text-accent mt-2">
                ₹{analytics.potentialRevenue || "0.00"}
              </p>
              <p className="text-xs text-accent/50 mt-1">
                Gross Sale + Extras, No Commission
              </p>
            </div>
            <div className="bg-linear-to-br from-green-900/40 to-neutral-dark p-6 rounded-xl shadow border border-green-500/50 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-green-500/10 text-8xl">
                ₹
              </div>
              <h4 className="text-green-400 font-bold text-sm uppercase tracking-wide relative z-10">
                Shop Net Revenue
              </h4>
              <p className="text-4xl font-bold text-green-400 mt-2 relative z-10">
                ₹{analytics.shopNetRevenue || "0.00"}
              </p>
              <p className="text-xs text-green-200/70 mt-1 relative z-10">
                Final Settlement (Payout)
              </p>
            </div>
          </div>

          {/* 2. Earnings Breakdown */}
          <h3 className="text-lg font-bold text-neutral-light mb-4 flex items-center gap-2">
            <span>📊</span> Earnings Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-neutral-dark p-5 rounded-lg shadow border-l-4 border-warning">
              <h4 className="text-neutral-light font-bold text-xs uppercase tracking-wider">
                Shop Gross Revenue
              </h4>
              <p className="text-xl font-bold text-warning mt-1">
                ₹{analytics.shopGrossRevenue || "0.00"}
              </p>
              <p className="text-[10px] text-neutral-light mt-1">
                Net Sale + Fees
              </p>
            </div>
            <div className="bg-neutral-dark p-5 rounded-lg shadow border-l-4 border-secondary">
              <h4 className="text-neutral-light font-bold text-xs uppercase tracking-wider">
                Delivery Revenue
              </h4>
              <p className="text-xl font-bold text-secondary mt-1">
                + ₹{analytics.deliveryRevenue || "0.00"}
              </p>
              <p className="text-[10px] text-neutral-light mt-1">
                Your Delivery Share
              </p>
            </div>
            <div className="bg-neutral-dark p-5 rounded-lg shadow border-l-4 border-purple-400">
              <h4 className="text-neutral-light font-bold text-xs uppercase tracking-wider">
                Extra Charges
              </h4>
              <p className="text-xl font-bold text-purple-400 mt-1">
                + ₹{analytics.extraCharges || "0.00"}
              </p>
              <p className="text-[10px] text-neutral-light mt-1">
                Small Order Fee Share
              </p>
            </div>
            <div className="bg-neutral-dark p-5 rounded-lg shadow border-l-4 border-danger">
              <h4 className="text-neutral-light font-bold text-xs uppercase tracking-wider">
                Deducted Commission
              </h4>
              <p className="text-xl font-bold text-danger mt-1">
                - ₹{analytics.deductedCommission || "0.00"}
              </p>
              <p className="text-[10px] text-neutral-light mt-1">
                Platform Cut
              </p>
            </div>
            <div className="bg-neutral-dark p-5 rounded-lg shadow border-l-4 border-red-500">
              <h4 className="text-neutral-light font-bold text-xs uppercase tracking-wider">
                Shop Discounts
              </h4>
              <p className="text-xl font-bold text-red-500 mt-1">
                - ₹{analytics.totalShopDiscounts || "0.00"}
              </p>
              <p className="text-[10px] text-neutral-light mt-1">
                Shop Funded Promos
              </p>
            </div>
          </div>

          {/* 3. Order Statistics */}
          <h3 className="text-lg font-bold text-neutral-light mb-4 flex items-center gap-2">
            <span>📦</span> Order Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-neutral-dark p-4 rounded-xl shadow text-center border border-neutral-mid">
              <p className="text-3xl font-bold text-white">
                {analytics.totalOrders || 0}
              </p>
              <p className="text-xs text-neutral-light mt-1 uppercase tracking-wide">
                Total Orders
              </p>
            </div>
            <div className="p-4 rounded-xl shadow text-center border border-green-500/30 bg-green-900/10">
              <p className="text-3xl font-bold text-green-400">
                {analytics.completedOrders || 0}
              </p>
              <p className="text-xs text-green-200/70 mt-1 uppercase tracking-wide">
                Completed Orders
              </p>
            </div>
            <div className="p-4 rounded-xl shadow text-center border border-danger/30 bg-danger/10">
              <p className="text-3xl font-bold text-danger">
                {analytics.cancelledOrders || 0}
              </p>
              <p className="text-xs text-red-200/70 mt-1 uppercase tracking-wide">
                Cancelled Orders
              </p>
            </div>
            <div className="p-4 rounded-xl shadow text-center border border-warning/30 bg-warning/10">
              <p className="text-3xl font-bold text-warning">
                {analytics.failedOrders || 0}
              </p>
              <p className="text-xs text-yellow-200/70 mt-1 uppercase tracking-wide">
                Failed Orders
              </p>
            </div>
            <div className="p-4 rounded-xl shadow text-center border border-purple-500/30 bg-purple-900/10">
              <p className="text-3xl font-bold text-purple-400">
                {analytics.smallOrdersCount || 0}
              </p>
              <p className="text-xs text-purple-200/70 mt-1 uppercase tracking-wide">
                Small Orders
              </p>
            </div>
          </div>

          {/* 4. Performance Metrics */}
          <h3 className="text-lg font-bold text-neutral-light mb-4 flex items-center gap-2">
            <span>📈</span> Performance Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-linear-to-br from-neutral-dark to-primary p-6 rounded-xl shadow border border-neutral-mid flex justify-between items-center">
              <div>
                <h3 className="text-neutral-light font-bold text-sm uppercase tracking-wide">
                  AOV (Shop)
                </h3>
                <p className="text-3xl font-bold text-white mt-1">
                  ₹{analytics.aov || "0.00"}
                </p>
                <p className="text-xs text-neutral-light mt-1">
                  Average Order Value (Net)
                </p>
              </div>
              <div className="text-4xl opacity-50">🛒</div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Actions */}
      {shop.status !== "rejected" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-12 border-t border-neutral-mid pt-8">
          <Link
            to="/shop/products"
            className="bg-neutral-dark p-6 rounded-2xl border border-neutral-mid hover:border-accent hover:bg-neutral-mid/20 cursor-pointer transition-all group shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-neutral-mid p-4 rounded-full group-hover:bg-accent group-hover:text-primary transition-colors text-2xl shadow-inner">
                📦
              </div>
              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-accent transition-colors">
                  Products
                </h2>
                <p className="text-sm text-neutral-light">
                  Manage your inventory
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/shop/orders"
            className="bg-neutral-dark p-6 rounded-2xl border border-neutral-mid hover:border-warning hover:bg-neutral-mid/20 cursor-pointer transition-all group shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-neutral-mid p-4 rounded-full group-hover:bg-warning group-hover:text-primary transition-colors text-2xl shadow-inner">
                📝
              </div>
              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-warning transition-colors">
                  Orders
                </h2>
                <p className="text-sm text-neutral-light">
                  View incoming orders
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ShopDashboard;
