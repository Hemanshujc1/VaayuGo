import { useState, useEffect } from "react";
import api from "../api/axios";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";

const AdminShopDetails = () => {
  const { id } = useParams();
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        const res = await api.get(`/admin/shops/${id}`);
        setShopData(res.data);
      } catch (error) {
        toast.error("Failed to load shop details");
      } finally {
        setLoading(false);
      }
    };
    fetchShopDetails();
  }, [id]);

  if (loading)
    return <div className="text-white text-center mt-10">Loading...</div>;
  if (!shopData)
    return <div className="text-white text-center mt-10">Shop not found</div>;

  const { shop, products, orders, totalRevenue } = shopData;

  const handleBlockUnblock = async () => {
    const newStatus = shop.status === "suspended" ? "approved" : "suspended";
    const action = shop.status === "suspended" ? "Unblock" : "Block";

    if (!window.confirm(`Are you sure you want to ${action} this shop?`))
      return;

    try {
      await api.patch(`/admin/shops/${id}`, { status: newStatus });
      toast.success(`Shop ${action}ed Successfully`);
      setShopData({ ...shopData, shop: { ...shop, status: newStatus } });
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${action} shop`);
    }
  };

  return (
    <div className="p-8 bg-primary min-h-screen text-primary-text space-y-8">
      <Link to="/admin/shops" className="text-accent hover:underline">
        ← Back to Shops
      </Link>

      {/* Header / Shop Info */}
      <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{shop.name}</h1>
          <p className="text-neutral-light">
            Category:{" "}
            <span className="text-white font-medium">{shop.category}</span>
          </p>
          <p className="text-neutral-light">
            Location:{" "}
            <span className="text-white font-medium">
              {shop.location_address || "N/A"}
            </span>
          </p>
          <p className="text-neutral-light">
            Owner:{" "}
            <span className="text-white font-medium">
              {shop.User?.name || "N/A"} ({shop.User?.mobile_number} |{" "}
              {shop.User?.email})
            </span>
          </p>
          <div className="mt-4 flex gap-4">
            <span
              className={`px-3 py-1 rounded text-sm font-bold flex items-center ${shop.status === "approved" ? "bg-green-900 text-green-200" : shop.status === "suspended" ? "bg-red-900 text-red-200" : "bg-yellow-900 text-yellow-200"}`}
            >
              {shop.status.toUpperCase()}
            </span>

            {(shop.status === "approved" || shop.status === "suspended") && (
              <button
                onClick={handleBlockUnblock}
                className={`px-4 py-1 rounded text-sm font-bold transition-colors border ${
                  shop.status === "suspended"
                    ? "bg-green-900/50 text-green-200 border-green-900 hover:bg-green-900"
                    : "bg-red-900/50 text-red-200 border-red-900 hover:bg-red-900"
                }`}
              >
                {shop.status === "suspended" ? "Unblock Shop" : "Block Shop"}
              </button>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-neutral-light">Total Revenue generated</p>
          <p className="text-3xl font-bold text-accent">₹{totalRevenue}</p>
        </div>
      </div>

      {/* Shop Gallery */}
      {(() => {
        let parsedImages = [];
        try {
          if (Array.isArray(shop.images)) {
            parsedImages = shop.images;
          } else if (typeof shop.images === "string") {
            parsedImages = JSON.parse(shop.images);
          }
        } catch (e) {
          if (shop.image_url) parsedImages = [shop.image_url];
        }
        if (!parsedImages || parsedImages.length === 0) {
          if (shop.image_url) parsedImages = [shop.image_url];
        }

        if (parsedImages.length === 0) return null;

        return (
          <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
            <h3 className="text-xl font-bold text-white mb-4">Shop Photos</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {parsedImages.map((img, idx) => (
                <img
                  key={idx}
                  src={`http://localhost:3001${img}`}
                  alt={`${shop.name} ${idx + 1}`}
                  className="w-48 h-32 object-cover rounded-md shrink-0 border border-neutral-mid"
                />
              ))}
            </div>
          </div>
        );
      })()}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-blue-500">
          <h3 className="text-neutral-light font-bold">Total Orders</h3>
          <p className="text-2xl font-bold text-white">{orders.length}</p>
        </div>
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-purple-500">
          <h3 className="text-neutral-light font-bold">Total Products</h3>
          <p className="text-2xl font-bold text-white">{products.length}</p>
        </div>
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-green-500">
          <h3 className="text-neutral-light font-bold">Shop Rating</h3>
          <p className="text-2xl font-bold text-white flex items-center gap-1">
            <span className="text-warning text-lg">★</span>
            {shop.rating != null && shop.rating > 0
              ? shop.rating.toFixed(1)
              : "N/A"}
          </p>
        </div>
        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-yellow-500">
          <h3 className="text-neutral-light font-bold">Delivery Rating</h3>
          <p className="text-2xl font-bold text-white flex items-center gap-1">
            <span className="text-warning text-lg">★</span>
            {shop.delivery_rating != null && shop.delivery_rating > 0
              ? shop.delivery_rating.toFixed(1)
              : "N/A"}
          </p>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-neutral-dark rounded shadow border border-neutral-mid overflow-hidden">
        <div className="p-4 border-b border-neutral-mid">
          <h2 className="text-xl font-bold text-white">
            Products ({products.length})
          </h2>
        </div>
        <div className="overflow-x-auto max-h-64">
          <table className="min-w-full">
            <thead className="bg-neutral-mid">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-mid">
              {products.map((p) => {
                let imgPath = p.image_url;
                if (!imgPath && p.images) {
                  try {
                    const parsed =
                      typeof p.images === "string"
                        ? JSON.parse(p.images)
                        : p.images;
                    if (Array.isArray(parsed) && parsed.length > 0)
                      imgPath = parsed[0];
                  } catch (e) {
                    console.warn(
                      "Failed to parse images JSON for product",
                      p.id,
                    );
                  }
                }
                return (
                  <tr key={p.id}>
                    <td className="px-6 py-3">
                      {imgPath ? (
                        <img
                          src={`http://localhost:3001${imgPath}`}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded border border-neutral-mid"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-neutral-dark rounded flex items-center justify-center text-xs text-neutral-light border border-neutral-mid">
                          No Img
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-white">{p.name}</td>
                    <td className="px-6 py-3 text-white">₹{p.price}</td>
                    <td className="px-6 py-3 text-white">{p.stock_quantity}</td>
                    <td className="px-6 py-3 text-white">
                      {p.is_available ? "In Stock" : "Unavailable"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-neutral-dark rounded shadow border border-neutral-mid overflow-hidden">
        <div className="p-4 border-b border-neutral-mid">
          <h2 className="text-xl font-bold text-white">Order History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-neutral-mid">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-mid">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-mid/50">
                  <td className="px-6 py-4 text-white">#{order.id}</td>
                  <td className="px-6 py-4 text-white">
                    {order.User?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-white">₹{order.grand_total}</td>
                  <td className="px-6 py-4 text-neutral-light">
                    {new Date(order.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded ${
                        order.status === "delivered"
                          ? "bg-green-900 text-green-200"
                          : order.status === "cancelled"
                            ? "bg-red-900 text-red-200"
                            : "bg-blue-900 text-blue-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminShopDetails;
