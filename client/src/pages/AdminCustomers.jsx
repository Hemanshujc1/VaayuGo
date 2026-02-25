import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import SearchBar from "../components/common/SearchBar";
import FilterDropdown from "../components/common/FilterDropdown";
import SortDropdown from "../components/common/SortDropdown";
import Pagination from "../components/common/Pagination";

const AdminCustomers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Data Table States
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/admin/users"); // Reuse existing endpoint, filter on frontend or backend?
      // Optimized: Backend returns all, we filter here.
      // Better to have dedicated endpoint but reuse is okay for now as per plan to clone AdminUsers logic.
      const customers = res.data.filter((u) => u.role === "customer");
      setUsers(customers);
    } catch (error) {
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (id) => {
    try {
      const res = await api.patch(`/admin/users/${id}/block`);
      toast.success(res.data.message);
      setUsers(
        users.map((user) =>
          user.id === id ? { ...user, is_blocked: !user.is_blocked } : user,
        ),
      );
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // 1. Filter
  let processedData = users.filter((user) => {
    if (filter === "active" && user.is_blocked) return false;
    if (filter === "blocked" && !user.is_blocked) return false;

    // 2. Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesName = user.name?.toLowerCase().includes(term);
      const matchesEmail = user.email?.toLowerCase().includes(term);
      const matchesPhone = user.mobile_number?.includes(term);
      return matchesName || matchesEmail || matchesPhone;
    }
    return true;
  });

  // 3. Sort
  processedData.sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortOrder === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortOrder === "name_asc") {
      return (a.name || "").localeCompare(b.name || "");
    } else if (sortOrder === "name_desc") {
      return (b.name || "").localeCompare(a.name || "");
    }
    return 0;
  });

  // 4. Paginate
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = processedData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Reset page if data changes dramatically
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, sortOrder]);

  return (
    <div className="p-8 bg-primary min-h-screen text-primary-text">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">Manage Customers</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or mobile..."
          />
          <div className="flex gap-3">
            <FilterDropdown
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="All Statuses"
              options={[
                { label: "Active", value: "active" },
                { label: "Blocked", value: "blocked" },
              ]}
            />
            <SortDropdown
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              options={[
                { label: "Newest First", value: "newest" },
                { label: "Oldest First", value: "oldest" },
                { label: "Name (A-Z)", value: "name_asc" },
                { label: "Name (Z-A)", value: "name_desc" },
              ]}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-white">Loading...</div>
      ) : (
        <div className="bg-neutral-dark rounded shadow overflow-x-auto border border-neutral-mid">
          <table className="min-w-full">
            <thead className="bg-neutral-mid">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-light uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-light uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-light uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-light uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-light uppercase tracking-wider">
                  Address
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
              {paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-neutral-mid/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-light">
                    {user.name || "N/A"}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-neutral-light">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                    {user.mobile_number || "N/A"}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-neutral-light">
                    {user.location || "N/A"}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-neutral-light truncate max-w-[150px]"
                    title={user.address}
                  >
                    {user.address || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_blocked ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-900 text-red-200">
                        Blocked
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-900 text-green-200">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                    <button
                      onClick={() => navigate(`/admin/customers/${user.id}`)}
                      className="text-accent hover:text-white transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => toggleBlock(user.id)}
                      className={`${user.is_blocked ? "text-green-400" : "text-danger"} hover:underline`}
                    >
                      {user.is_blocked ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paginatedUsers.length === 0 && (
            <div className="p-8 text-center text-neutral-light border-b border-t border-neutral-mid">
              No customers match your criteria.
            </div>
          )}

          {paginatedUsers.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
