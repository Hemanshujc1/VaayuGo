import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (id) => {
    try {
      const res = await api.patch(`/admin/users/${id}/block`);
      toast.success(res.data.message);

      // Update local state
      setUsers(
        users.map((user) =>
          user.id === id ? { ...user, is_blocked: !user.is_blocked } : user,
        ),
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update user status",
      );
    }
  };

  const filteredUsers =
    filterRole === "all"
      ? users
      : users.filter((user) => user.role === filterRole);

  return (
    <div className="p-8 bg-primary min-h-screen text-primary-text">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        <Link to="/admin/dashboard" className="text-accent hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setFilterRole("all")}
          className={`px-4 py-2 rounded font-bold ${filterRole === "all" ? "bg-accent text-primary" : "bg-neutral-mid text-neutral-light border border-neutral-mid"}`}
        >
          All
        </button>
        <button
          onClick={() => setFilterRole("customer")}
          className={`px-4 py-2 rounded font-bold ${filterRole === "customer" ? "bg-accent text-primary" : "bg-neutral-mid text-neutral-light border border-neutral-mid"}`}
        >
          Customers
        </button>
        <button
          onClick={() => setFilterRole("shopkeeper")}
          className={`px-4 py-2 rounded font-bold ${filterRole === "shopkeeper" ? "bg-accent text-primary" : "bg-neutral-mid text-neutral-light border border-neutral-mid"}`}
        >
          Shopkeepers
        </button>
      </div>

      {loading ? (
        <div className="text-center text-white">Loading users...</div>
      ) : (
        <div className="bg-neutral-dark rounded shadow overflow-hidden border border-neutral-mid">
          <table className="min-w-full">
            <thead className="bg-neutral-mid">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-light uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-light uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-light uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-light uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-light uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-mid">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-neutral-mid/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-light">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        user.role === "admin"
                          ? "bg-purple-900 text-purple-200"
                          : user.role === "shopkeeper"
                            ? "bg-blue-900 text-blue-200"
                            : "bg-green-900 text-green-200"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_blocked ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900 text-red-200">
                        Blocked
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-200">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user.role !== "admin" && (
                      <button
                        onClick={() => toggleBlock(user.id)}
                        className={`font-bold px-3 py-1 rounded transition-colors ${
                          user.is_blocked
                            ? "bg-neutral-mid text-white hover:bg-neutral-light"
                            : "bg-danger text-white hover:bg-red-700"
                        }`}
                      >
                        {user.is_blocked ? "Unblock" : "Block"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-neutral-light">
              No users found for this filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
