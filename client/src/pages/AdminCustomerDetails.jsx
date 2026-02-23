import { useState, useEffect } from "react";
import api from "../api/axios";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";

const AdminCustomerDetails = () => {
  const { id } = useParams();
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const res = await api.get(`/admin/customers/${id}`);
        setCustomerData(res.data);
      } catch (error) {
        toast.error("Failed to load customer details");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerDetails();
  }, [id]);

  if (loading)
    return <div className="text-white text-center mt-10">Loading...</div>;
  if (!customerData)
    return (
      <div className="text-white text-center mt-10">Customer not found</div>
    );

  const { user, orders, totalSpent } = customerData;

  return (
    <div className="p-8 bg-primary min-h-screen text-primary-text space-y-8">
      <Link to="/admin/customers" className="text-accent hover:underline">
        ← Back to Customers
      </Link>

      <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-primary text-3xl font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{user.username}</h1>
            <p className="text-neutral-light">{user.email}</p>
            <p className="text-sm text-neutral-light">
              Joined: {new Date(user.createdAt).toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>

        <div className="mt-6 md:mt-0 text-right">
          <p className="text-neutral-light">Total Lifetime Spend</p>
          <p className="text-3xl font-bold text-accent">₹{totalSpent}</p>
        </div>
      </div>

      {/* Orders History */}
      <div className="bg-neutral-dark rounded shadow border border-neutral-mid overflow-hidden">
        <div className="p-4 border-b border-neutral-mid flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            Order History ({orders.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-neutral-mid">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-light uppercase">
                  Shop
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
                    {order.Shop?.name || "Unknown Shop"}
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
          {orders.length === 0 && (
            <div className="p-8 text-center text-neutral-light">
              No orders found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerDetails;
