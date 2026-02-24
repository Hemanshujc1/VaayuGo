import { useState, useEffect } from "react";
import api from "../api/axios";
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
    <div className="p-8 bg-primary min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-8">
        Admin Dashboard - Revenue Analytics
      </h1>

      {/* Overview Metrics */}
      <h2 className="text-xl font-bold text-white mb-4">Revenue Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-accent col-span-1">
          <h3 className="text-neutral-light font-bold text-sm">Total Orders</h3>
          <p className="text-2xl font-bold text-white mt-1">
            {analytics?.orders || 0}
          </p>
        </div>
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-white col-span-2">
          <h3 className="text-neutral-light font-bold text-sm">
            Total Order Value
          </h3>
          <p className="text-2xl font-bold text-white mt-1">
            ₹{analytics?.totalOrderValue || 0}
          </p>
          <p className="text-xs text-neutral-light mt-1">
            Gross sum of all products sold
          </p>
        </div>
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-blue-400 col-span-1">
          <h3 className="text-neutral-light font-bold text-sm">
            Total Delivery Rev
          </h3>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            ₹{analytics?.totalDeliveryRevenue || 0}
          </p>
        </div>
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-indigo-400 col-span-2">
          <h3 className="text-neutral-light font-bold text-sm">
            VaayuGo Delivery Share
          </h3>
          <p className="text-2xl font-bold text-indigo-400 mt-1">
            ₹{analytics?.totalVaayugoDeliveryShare || 0}
          </p>
          <p className="text-xs text-neutral-light mt-1">
            Platform's cut of delivery fee
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-warning">
          <h3 className="text-neutral-light font-bold text-sm">
            Commission Revenue
          </h3>
          <p className="text-3xl font-bold text-warning mt-2">
            ₹{analytics?.totalCommissionRevenue || 0}
          </p>
          <p className="text-xs text-neutral-light mt-1">
            Pure profit from order values
          </p>
        </div>
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-green-500 lg:col-span-2">
          <h3 className="text-neutral-light font-bold text-sm">
            Total VaayuGo Revenue
          </h3>
          <p className="text-4xl font-bold text-green-400 mt-2">
            ₹{analytics?.totalVaayugoRevenue || 0}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs font-mono bg-primary/50 p-2 rounded text-neutral-light">
            <span className="text-green-400 font-bold">VaayuGo Rev</span>
            <span>=</span>
            <span className="text-warning">Commission</span>
            <span>+</span>
            <span className="text-indigo-400">VaayuGo Delivery Share</span>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <h2 className="text-xl font-bold text-white mb-4">Detailed Breakdown</h2>

      {/* AOV & Per Order */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-linear-to-br from-neutral-dark to-primary p-6 rounded shadow border border-neutral-mid flex justify-between items-center">
          <div>
            <h3 className="text-neutral-light font-bold text-sm">
              Average Order Value (AOV)
            </h3>
            <p className="text-2xl font-bold text-white mt-1">
              ₹{analytics?.avgOrderValue || 0}
            </p>
          </div>
          <div className="text-4xl">🛒</div>
        </div>
        <div className="bg-linear-to-br from-neutral-dark to-primary p-6 rounded shadow border border-neutral-mid flex justify-between items-center">
          <div>
            <h3 className="text-neutral-light font-bold text-sm">
              Avg Platform Revenue per Order
            </h3>
            <p className="text-2xl font-bold text-green-400 mt-1">
              ₹{analytics?.revenuePerOrder || 0}
            </p>
          </div>
          <div className="text-4xl">📈</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Locations */}
        <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
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

        {/* Top Categories */}
        <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
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

        {/* Top Shops */}
        <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
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

      {/* Daily Revenue Trend */}
      <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid mb-8">
        <h3 className="text-white font-bold mb-4 border-b border-neutral-mid pb-2">
          Recent Daily Revenue (VaayuGo Share)
        </h3>
        {analytics?.revenueByDay?.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-4">
              {analytics.revenueByDay
                .slice(0, 7)
                .reverse()
                .map((day, idx) => (
                  <div
                    key={idx}
                    className="bg-primary p-4 rounded min-w-[120px] text-center border border-neutral-mid"
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
        <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid hover:border-accent transition-colors">
          <h2 className="text-lg font-bold mb-2 text-white">Shops</h2>
          <button
            onClick={() => navigate("/admin/shops")}
            className="text-accent text-sm hover:underline"
          >
            Manage Shops →
          </button>
        </div>
        <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid hover:border-accent transition-colors">
          <h2 className="text-lg font-bold mb-2 text-white">Users</h2>
          <button
            onClick={() => navigate("/admin/users")}
            className="text-accent text-sm hover:underline"
          >
            Manage Users →
          </button>
        </div>
        <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid hover:border-accent transition-colors">
          <h2 className="text-lg font-bold mb-2 text-white">System Config</h2>
          <button
            onClick={() => navigate("/admin/rules")}
            className="text-accent text-sm hover:underline"
          >
            Go to Service Rules →
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
