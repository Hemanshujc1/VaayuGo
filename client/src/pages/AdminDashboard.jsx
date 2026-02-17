import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/admin/analytics");
        setAnalytics(res.data);
      } catch (error) {
        console.error("Error fetching analytics", error);
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

  return (
    <div className="p-8 bg-primary min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-accent">
          <h3 className="text-neutral-light font-bold">Total Users</h3>
          <p className="text-2xl font-bold text-white">
            {analytics?.users || 0}
          </p>
        </div>
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-secondary">
          <h3 className="text-neutral-light font-bold">Active Shops</h3>
          <p className="text-2xl font-bold text-white">
            {analytics?.shops || 0}
          </p>
        </div>
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-warning">
          <h3 className="text-neutral-light font-bold">Total Orders</h3>
          <p className="text-2xl font-bold text-white">
            {analytics?.orders || 0}
          </p>
        </div>
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-purple-500">
          <h3 className="text-neutral-light font-bold">Total Gross Volume</h3>
          <p className="text-2xl font-bold text-white">
            ₹{analytics?.grossVolume || 0}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
          <h2 className="text-xl font-bold mb-4 text-white">Shop Management</h2>
          <p className="text-neutral-light mb-4">
            Manage shops, approvals, and suspensions
          </p>
          <button
            onClick={() => navigate("/admin/shops")}
            className="bg-accent text-primary px-4 py-2 rounded font-bold hover:bg-secondary hover:text-white transition-colors"
          >
            Manage Shops
          </button>
        </div>

        <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
          <h2 className="text-xl font-bold mb-4 text-white">User Management</h2>
          <p className="text-neutral-light mb-4">
            View users and manage access (block/unblock)
          </p>
          <button
            onClick={() => navigate("/admin/users")}
            className="bg-accent text-primary px-4 py-2 rounded font-bold hover:bg-secondary hover:text-white transition-colors"
          >
            Manage Users
          </button>
        </div>

        <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
          <h2 className="text-xl font-bold mb-4 text-white">
            System Configuration
          </h2>
          <p className="text-neutral-light mb-4">
            Manage delivery slots and fees
          </p>
          <button
            onClick={() => navigate("/admin/settings")}
            className="bg-neutral-mid text-white px-4 py-2 rounded hover:bg-neutral-light transition-colors border border-neutral-light"
          >
            Go to Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
