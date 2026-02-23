import { useState, useEffect } from "react";
import api from "../api/axios";
import { Link, useNavigate } from "react-router-dom";

const ShopDashboard = () => {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchShop();
  }, []);

  const fetchShop = async () => {
    try {
      const res = await api.get("/shop/my-shop");
      setShop(res.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setShop(null);
      } else {
        console.error("Error fetching shop:", error);
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
            className="inline-block bg-accent text-primary font-bold px-8 py-3 rounded-full hover:bg-secondary hover:text-white transition-all transform hover:scale-105 shadow-md"
          >
            Register Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{shop.name}</h1>
          <p className="text-neutral-light flex items-center gap-2">
            <span className="bg-neutral-mid px-2 py-1 rounded text-xs text-accent border border-neutral-mid">
              {shop.category}
            </span>
            <span>📍 {shop.location_address}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Shop Open/Close Toggle */}
          {shop.status === "approved" && (
            <button
              onClick={async () => {
                try {
                  const res = await api.patch("/shop/status");
                  setShop((prev) => ({ ...prev, is_open: res.data.is_open }));
                  // toast.success(res.data.message); // If you have toast imported
                } catch (error) {
                  console.error("Error toggling status:", error);
                }
              }}
              className={`px-6 py-2 rounded-full font-bold text-white transition-all transform hover:scale-105 shadow-lg ${
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

      {/* Dashboard Actions */}
      {shop.status !== "rejected" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Manage Products Card */}
          <Link
            to="/shop/products"
            className="bg-neutral-dark p-6 rounded-xl border border-neutral-mid hover:border-accent hover:bg-neutral-mid/20 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-neutral-mid p-3 rounded-full group-hover:bg-accent group-hover:text-primary transition-colors text-2xl">
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

          {/* Manage Orders Card */}
          <Link
            to="/shop/orders"
            className="bg-neutral-dark p-6 rounded-xl border border-neutral-mid hover:border-warning hover:bg-neutral-mid/20 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-neutral-mid p-3 rounded-full group-hover:bg-warning group-hover:text-primary transition-colors text-2xl">
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
