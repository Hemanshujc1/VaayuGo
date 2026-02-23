import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

const AdminShops = () => {
  const [shops, setShops] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all', 'pending', 'approved'
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllShops();
  }, []);

  const fetchAllShops = async () => {
    try {
      const res = await api.get("/admin/shops/all");
      setShops(res.data);
    } catch (err) {
      toast.error("Failed to fetch shops");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.put(`/admin/shops/verify/${id}`);
      toast.success("Shop Verified Successfully");
      // Refresh local state
      setShops(
        shops.map((s) => (s.id === id ? { ...s, status: "approved" } : s)),
      );
    } catch (err) {
      toast.error("Failed to verify shop");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this shop?")) return;
    try {
      await api.patch(`/admin/shops/${id}/reject`);
      toast.success("Shop Rejected");
      setShops(
        shops.map((s) => (s.id === id ? { ...s, status: "rejected" } : s)),
      );
    } catch (err) {
      toast.error("Failed to reject shop");
    }
  };

  const handleBlockUnblock = async (id, currentStatus) => {
    const newStatus = currentStatus === "suspended" ? "approved" : "suspended";
    const action = currentStatus === "suspended" ? "Unblock" : "Block";

    if (!window.confirm(`Are you sure you want to ${action} this shop?`))
      return;

    try {
      await api.patch(`/admin/shops/${id}`, { status: newStatus });
      toast.success(`Shop ${action}ed Successfully`);
      setShops(
        shops.map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
      );
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${action} shop`);
    }
  };

  const filteredShops =
    filter === "all" ? shops : shops.filter((s) => s.status === filter);

  return (
    <div className="p-8 bg-primary min-h-screen text-primary-text">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Manage Shops</h1>

        {/* Tabs */}
        <div className="flex bg-neutral-dark rounded p-1 border border-neutral-mid">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1 rounded transition-colors ${filter === "all" ? "bg-accent text-primary font-bold" : "text-neutral-light hover:text-white"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-1 rounded transition-colors ${filter === "pending" ? "bg-accent text-primary font-bold" : "text-neutral-light hover:text-white"}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-1 rounded transition-colors ${filter === "approved" ? "bg-accent text-primary font-bold" : "text-neutral-light hover:text-white"}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("suspended")}
            className={`px-4 py-1 rounded transition-colors ${filter === "suspended" ? "bg-accent text-primary font-bold" : "text-neutral-light hover:text-white"}`}
          >
            Blocked
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-white">Loading...</div>
      ) : (
        <div className="grid gap-6">
          {filteredShops.length === 0 && (
            <div className="text-center text-neutral-light">
              No shops found.
            </div>
          )}

          {filteredShops.map((shop) => (
            <div
              key={shop.id}
              className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid flex flex-col md:flex-row justify-between items-start md:items-center"
            >
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {shop.name}
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${
                      shop.status === "approved"
                        ? "border-green-500 text-green-400"
                        : shop.status === "pending"
                          ? "border-yellow-500 text-yellow-400"
                          : shop.status === "suspended"
                            ? "border-red-500 text-red-400"
                            : "border-gray-500 text-gray-400"
                    }`}
                  >
                    {shop.status.toUpperCase()}
                  </span>
                </h2>
                <div className="text-neutral-light mt-2 space-y-1 text-sm">
                  <p>
                    Owner: {shop.User?.username} ({shop.User?.email})
                  </p>
                  <p>Category: {shop.category}</p>
                  <p>Location: {shop.location_address || "N/A"}</p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex gap-4">
                <button
                  onClick={() => navigate(`/admin/shops/${shop.id}`)}
                  className="bg-neutral-mid text-white px-4 py-2 rounded hover:bg-neutral-light transition-colors border border-neutral-light"
                >
                  View Details
                </button>

                {shop.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleVerify(shop.id)}
                      className="bg-accent text-primary px-4 py-2 rounded font-bold hover:bg-secondary transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(shop.id)}
                      className="bg-red-900/50 text-red-200 px-4 py-2 rounded font-bold hover:bg-red-900 border border-red-900 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}

                {(shop.status === "approved" ||
                  shop.status === "suspended") && (
                  <button
                    onClick={() => handleBlockUnblock(shop.id, shop.status)}
                    className={`px-4 py-2 rounded font-bold transition-colors border ${
                      shop.status === "suspended"
                        ? "bg-green-900/50 text-green-200 border-green-900 hover:bg-green-900"
                        : "bg-red-900/50 text-red-200 border-red-900 hover:bg-red-900"
                    }`}
                  >
                    {shop.status === "suspended" ? "Unblock" : "Block"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminShops;
