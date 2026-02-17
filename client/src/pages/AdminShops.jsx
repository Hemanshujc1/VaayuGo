import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const AdminShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingShops();
  }, []);

  const fetchPendingShops = async () => {
    try {
      const res = await api.get("/admin/shops/pending");
      setShops(res.data);
    } catch (error) {
      toast.error("Failed to fetch pending shops");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.put(`/admin/shops/verify/${id}`);
      toast.success("Shop Verified Successfully");
      setShops(shops.filter((shop) => shop.id !== id));
    } catch (error) {
      toast.error("Failed to verify shop");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this shop?")) return;
    try {
      await api.patch(`/admin/shops/${id}/reject`);
      toast.success("Shop Rejected");
      setShops(shops.filter((shop) => shop.id !== id));
    } catch (error) {
      toast.error("Failed to reject shop");
    }
  };

  return (
    <div className="p-8 bg-primary min-h-screen text-primary-text">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          Pending Shop Approvals
        </h1>
        <Link to="/admin/dashboard" className="text-accent hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-white">Loading...</div>
      ) : shops.length === 0 ? (
        <div className="bg-neutral-dark p-8 rounded shadow text-center text-neutral-light border border-neutral-mid">
          <p className="text-xl">No pending approvals.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid flex flex-col md:flex-row justify-between items-start md:items-center"
            >
              <div>
                <h2 className="text-2xl font-bold text-white">{shop.name}</h2>
                <div className="text-neutral-light mt-2 space-y-1">
                  <p>
                    <span className="font-bold text-neutral-light">
                      Category:
                    </span>{" "}
                    {shop.category}
                  </p>
                  <p>
                    <span className="font-bold text-neutral-light">Owner:</span>{" "}
                    {shop.User?.username} ({shop.User?.email})
                  </p>
                  <p>
                    <span className="font-bold text-neutral-light">
                      Location:
                    </span>{" "}
                    {shop.location_address}
                  </p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex gap-4">
                <button
                  onClick={() => handleVerify(shop.id)}
                  className="bg-accent text-primary px-6 py-2 rounded font-bold hover:bg-secondary hover:text-white transition-colors shadow-md"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(shop.id)}
                  className="bg-neutral-mid text-danger px-6 py-2 rounded font-bold hover:bg-red-900/30 border border-neutral-mid hover:border-danger transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminShops;
