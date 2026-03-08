import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/admin/analytics");
        setAnalytics(res.data);
      } catch (error) {
        console.error("Error fetching analytics", error);
        setError(error.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading)
    return (
      <div className="text-white text-center mt-20">Loading Dashboard...</div>
    );

  if (error)
    return (
      <div className="text-danger text-center mt-20">
        <h2 className="text-2xl font-bold">Error Loading Dashboard</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-neutral-mid px-4 py-2 rounded text-white"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-4 sm:p-8 bg-black min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-8">
        Admin Dashboard - Revenue Analytics
      </h1>

      {/* 1. Platform Revenue Summary */}
      <h2 className="text-xl font-bold text-white mb-4">
        1. Platform Revenue Summary
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-900/10 p-6 rounded shadow border-l-4 border-white">
          <h3 className="text-neutral-light font-bold text-sm">
            GMV (Gross Merchandise Value)
          </h3>
          <p className="text-3xl font-bold text-white mt-2">
            ₹{analytics?.gmv || "0.00"}
          </p>
          <p className="text-xs text-neutral-light mt-1">
            Total subtotal without any discounts or fees
          </p>
        </div>
        <div className="bg-green-900/10 p-6 rounded shadow border-l-4 border-blue-400">
          <h3 className="text-neutral-light font-bold text-sm">Net GMV</h3>
          <p className="text-3xl font-bold text-blue-400 mt-2">
            ₹{analytics?.netGmv || "0.00"}
          </p>
          <p className="text-xs text-neutral-light mt-1">
            Subtotal minus all shop and platform discounts
          </p>
        </div>
        <div className="bg-green-900/10 p-6 rounded shadow border-l-4 border-green-500 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-green-500/10 text-8xl">
            ₹
          </div>
          <h3 className="text-neutral-light font-bold text-sm relative z-10">
            Net Revenue
          </h3>
          <p className="text-4xl font-bold text-green-400 mt-2 relative z-10">
            ₹{analytics?.netRevenue || "0.00"}
          </p>
          <p className="text-xs text-neutral-light mt-1 relative z-10">
            Final platform earnings after all discounts
          </p>
        </div>
      </div>

      {/* 2. Earnings Breakdown */}
      <h2 className="text-xl font-bold text-white mb-4">
        2. Earnings Breakdown
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-green-900/10 p-5 rounded shadow border-l-4 border-indigo-400">
          <h3 className="text-neutral-light font-bold text-xs">
            Total Commission
          </h3>
          <p className="text-xl font-bold text-indigo-400 mt-1">
            ₹{analytics?.totalCommission || "0.00"}
          </p>
          <p className="text-[10px] text-neutral-light mt-1">
            Platform Commission
          </p>
        </div>
        <div className="bg-green-900/10 p-5 rounded shadow border-l-4 border-secondary">
          <h3 className="text-neutral-light font-bold text-xs">
            Delivery Revenue
          </h3>
          <p className="text-xl font-bold text-secondary mt-1">
            ₹{analytics?.deliveryRevenue || "0.00"}
          </p>
          <p className="text-[10px] text-neutral-light mt-1">
            Platform Delivery Share
          </p>
        </div>
        <div className="bg-green-900/10 p-5 rounded shadow border-l-4 border-purple-400">
          <h3 className="text-neutral-light font-bold text-xs">
            Extra Charges
          </h3>
          <p className="text-xl font-bold text-purple-400 mt-1">
            ₹{analytics?.extraCharges || "0.00"}
          </p>
          <p className="text-[10px] text-neutral-light mt-1">
            Small Order Fee Share
          </p>
        </div>
        <div className="bg-green-900/10 p-5 rounded shadow border-l-4 border-warning">
          <h3 className="text-neutral-light font-bold text-xs">
            Gross Revenue
          </h3>
          <p className="text-xl font-bold text-warning mt-1">
            ₹{analytics?.grossRevenue || "0.00"}
          </p>
          <p className="text-[10px] text-neutral-light mt-1">
            Before Platform Discounts
          </p>
        </div>
        <div className="bg-green-900/10 p-5 rounded shadow border-l-4 border-danger">
          <h3 className="text-neutral-light font-bold text-xs">
            Platform Discount
          </h3>
          <p className="text-xl font-bold text-danger mt-1">
            - ₹{analytics?.platformDiscount || "0.00"}
          </p>
          <p className="text-[10px] text-neutral-light mt-1">
            Platform Funded Promos
          </p>
        </div>
      </div>

      {/* 3. Order Statistics */}
      <h2 className="text-xl font-bold text-white mb-4">3. Order Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-green-900/10 p-4 rounded shadow text-center border border-neutral-mid">
          <p className="text-3xl font-bold text-white">
            {analytics?.totalOrders || 0}
          </p>
          <p className="text-xs text-neutral-light mt-1 uppercase tracking-wide">
            Total Orders
          </p>
        </div>
        <div className="p-4 rounded shadow text-center border border-green-500/30 bg-green-900/10">
          <p className="text-3xl font-bold text-green-400">
            {analytics?.completedOrders || 0}
          </p>
          <p className="text-xs text-green-200/70 mt-1 uppercase tracking-wide">
            Completed Orders
          </p>
        </div>
        <div className="p-4 rounded shadow text-center border border-danger/30 bg-danger/10">
          <p className="text-3xl font-bold text-danger">
            {analytics?.cancelledOrders || 0}
          </p>
          <p className="text-xs text-red-200/70 mt-1 uppercase tracking-wide">
            Cancelled Orders
          </p>
        </div>
        <div className="p-4 rounded shadow text-center border border-warning/30 bg-warning/10">
          <p className="text-3xl font-bold text-warning">
            {analytics?.failedOrders || 0}
          </p>
          <p className="text-xs text-yellow-200/70 mt-1 uppercase tracking-wide">
            Failed Orders
          </p>
        </div>
        <div className="p-4 rounded shadow text-center border border-purple-500/30 bg-purple-900/10">
          <p className="text-3xl font-bold text-purple-400">
            {analytics?.smallOrderCount || 0}
          </p>
          <p className="text-xs text-purple-200/70 mt-1 uppercase tracking-wide">
            Small Orders
          </p>
        </div>
      </div>

      {/* 4. Shop & Performance Metrics */}
      <h2 className="text-xl font-bold text-white mb-4">
        4. Shop & Performance Metrics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-linear-to-br from-neutral-dark to-primary p-6 rounded shadow border border-neutral-mid flex justify-between items-center">
          <div>
            <h3 className="text-neutral-light font-bold text-sm uppercase tracking-wide">
              Total Registered Shops
            </h3>
            <p className="text-3xl font-bold text-white mt-1">
              {analytics?.totalShops || 0}
            </p>
          </div>
          <div className="text-4xl opacity-50">🏪</div>
        </div>
        <div className="bg-linear-to-br from-neutral-dark to-primary p-6 rounded shadow border border-green-500/50 flex justify-between items-center">
          <div>
            <h3 className="text-green-400 font-bold text-sm uppercase tracking-wide">
              Active Shops
            </h3>
            <p className="text-3xl font-bold text-green-400 mt-1">
              {analytics?.activeShops || 0}
            </p>
            <p className="text-xs text-neutral-light mt-1">Approved for sale</p>
          </div>
          <div className="text-4xl opacity-50">✅</div>
        </div>
        <div className="bg-linear-to-br from-neutral-dark to-primary p-6 rounded shadow border border-neutral-mid flex justify-between items-center">
          <div>
            <h3 className="text-neutral-light font-bold text-sm uppercase tracking-wide">
              AOV (Average Order Value)
            </h3>
            <p className="text-3xl font-bold text-white mt-1">
              ₹{analytics?.aov || "0.00"}
            </p>
            <p className="text-xs text-neutral-light mt-1">
              Net GMV / Completed Orders
            </p>
          </div>
          <div className="text-4xl opacity-50">🛒</div>
        </div>
      </div>

      {/* Breakdowns */}
      <h2 className="text-xl font-bold text-white mb-4">
        Top Performing Entities
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-900/10 p-6 rounded shadow border border-neutral-mid">
          <h3 className="text-white font-bold mb-4 border-b border-neutral-mid pb-2">
            Revenue by Location
          </h3>
          {analytics?.revenueByLocation?.length > 0 ? (
            <ul className="space-y-3">
              {analytics.revenueByLocation.map((loc, idx) => (
                <li key={idx} className="flex justify-between items-center">
                  <span className="text-neutral-light text-sm truncate pr-2">
                    {loc.location || "Unknown"}
                  </span>
                  <span className="text-green-400 font-bold text-sm">
                    ₹{loc.revenue}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-light text-sm italic">
              No location data
            </p>
          )}
        </div>

        <div className="bg-green-900/10 p-6 rounded shadow border border-neutral-mid">
          <h3 className="text-white font-bold mb-4 border-b border-neutral-mid pb-2">
            Revenue by Category
          </h3>
          {analytics?.revenueByCategory?.length > 0 ? (
            <ul className="space-y-3">
              {analytics.revenueByCategory.map((cat, idx) => (
                <li key={idx} className="flex justify-between items-center">
                  <span className="bg-neutral-mid text-accent px-2 py-0.5 rounded text-xs truncate max-w-[120px]">
                    {cat.category || "General"}
                  </span>
                  <span className="text-green-400 font-bold text-sm">
                    ₹{cat.revenue}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-light text-sm italic">
              No category data
            </p>
          )}
        </div>

        <div className="bg-green-900/10 p-6 rounded shadow border border-neutral-mid">
          <h3 className="text-white font-bold mb-4 border-b border-neutral-mid pb-2">
            Top Grossing Shops
          </h3>
          {analytics?.revenueByShop?.length > 0 ? (
            <ul className="space-y-3">
              {analytics.revenueByShop.map((shop, idx) => (
                <li key={idx} className="flex justify-between items-center">
                  <span className="text-neutral-light text-sm truncate pr-2">
                    {idx + 1}. {shop.shopName || "Unnamed"}
                  </span>
                  <span className="text-green-400 font-bold text-sm">
                    ₹{shop.revenue}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-light text-sm italic">No shop data</p>
          )}
        </div>
      </div>

      <div className="bg-green-900/10 p-6 rounded shadow border border-neutral-mid mb-8">
        <h3 className="text-white font-bold mb-4 border-b border-neutral-mid pb-2">
          Recent Daily Revenue (Net Revenue)
        </h3>
        {analytics?.revenueByDay?.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-4">
              {analytics.revenueByDay
                .slice(0, 10)
                .reverse()
                .map((day, idx) => (
                  <div
                    key={idx}
                    className="bg-danger/5 p-4 rounded min-w-[120px] text-center border border-neutral-mid"
                  >
                    <p className="text-xs text-neutral-light mb-1">
                      {day.date}
                    </p>
                    <p className="text-lg font-bold text-green-400">
                      ₹{day.revenue}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <p className="text-neutral-light text-sm italic">
            No daily trend data
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold text-white mb-4">
        Quick Management Links
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          className="bg-green-900/10 p-6 rounded shadow border border-neutral-mid hover:border-accent transition-colors cursor-pointer"
          onClick={() => navigate("/admin/shops")}
        >
          <h2 className="text-lg font-bold mb-2 text-white">Shops</h2>
          <span className="text-accent text-sm hover:underline">
            Manage Shops →
          </span>
        </div>
        <div
          className="bg-green-900/10 p-6 rounded shadow border border-neutral-mid hover:border-accent transition-colors cursor-pointer"
          onClick={() => navigate("/admin/users")}
        >
          <h2 className="text-lg font-bold mb-2 text-white">Users</h2>
          <span className="text-accent text-sm hover:underline">
            Manage Users →
          </span>
        </div>
        <div
          className="bg-green-900/10 p-6 rounded shadow border border-neutral-mid hover:border-accent transition-colors cursor-pointer"
          onClick={() => navigate("/admin/rules")}
        >
          <h2 className="text-lg font-bold mb-2 text-white">System Config</h2>
          <span className="text-accent text-sm hover:underline">
            Go to Service Rules →
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
