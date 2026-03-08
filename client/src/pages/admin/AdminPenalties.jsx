import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useConfirm } from "../../context/ConfirmContext";

const AdminPenalties = () => {
  const [penalties, setPenalties] = useState([]);
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  const [newPenalty, setNewPenalty] = useState({
    target_type: "customer",
    target_id: "",
    amount: "",
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [penaltiesRes, usersRes, shopsRes] = await Promise.all([
        api.get("/admin/penalties"),
        api.get("/admin/users"),
        api.get("/admin/shops/all", { params: { limit: 1000 } }),
      ]);
      setPenalties(penaltiesRes.data);
      setUsers(usersRes.data.filter((u) => u.role === "customer"));
      setShops(shopsRes.data.shops);
    } catch (error) {
      toast.error("Failed to fetch penalty data");
    } finally {
      setLoading(false);
    }
  };

  const handleIssuePenalty = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/penalties", {
        ...newPenalty,
        amount: parseFloat(newPenalty.amount),
      });
      toast.success("Penalty issued successfully");
      setNewPenalty({ ...newPenalty, target_id: "", amount: "", reason: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to issue penalty");
    }
  };

  const handleReversePenalty = async (id) => {
    const acknowledged = await confirm({
      title: "Reverse Penalty?",
      message:
        "Are you sure you want to reverse this penalty? This will prevent it from being applied in future settlements or orders.",
      confirmText: "Reverse",
      cancelText: "Cancel",
      type: "danger",
    });

    if (!acknowledged) return;

    try {
      await api.patch(`/admin/penalties/${id}/reverse`);
      toast.success("Penalty reversed successfully");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reverse penalty");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );

  return (
    <div className="p-4 md:p-8 bg-primary min-h-screen text-primary-text font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-white to-neutral-400 tracking-tight">
            Penalty Management
          </h1>
          <p className="text-neutral-light mt-2 text-sm max-w-xl">
            Issue and manage financial penalties for customers and shopkeepers.
            Penalties are deducted during settlements or added to checkout.
          </p>
        </div>
        <Link
          to="/admin/dashboard"
          className="group flex items-center gap-2 px-5 py-2.5 bg-neutral-dark/80 backdrop-blur-md rounded-full border border-neutral-mid hover:border-accent/50 hover:bg-neutral-dark transition-all duration-300 text-sm font-medium text-white shadow-lg shrink-0"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-300">
            ←
          </span>{" "}
          Back to Dashboard
        </Link>
      </div>

      {/* Issue Penalty Form */}
      <div className="bg-neutral-dark/40 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-neutral-mid/60 shadow-xl mb-8 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>

        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="text-red-500 text-2xl">⚖️</span> Issue New Penalty
        </h2>

        <form
          onSubmit={handleIssuePenalty}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="flex flex-col">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Target Type
            </label>
            <select
              value={newPenalty.target_type}
              onChange={(e) =>
                setNewPenalty({
                  ...newPenalty,
                  target_type: e.target.value,
                  target_id: "",
                })
              }
              className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 text-white focus:border-accent transition-all"
            >
              <option value="customer">Customer</option>
              <option value="shopkeeper">Shopkeeper</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Select Target
            </label>
            <select
              value={newPenalty.target_id}
              onChange={(e) =>
                setNewPenalty({ ...newPenalty, target_id: e.target.value })
              }
              className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 text-white focus:border-accent transition-all"
              required
            >
              <option value="">
                Select {newPenalty.target_type === "customer" ? "User" : "Shop"}
              </option>
              {newPenalty.target_type === "customer"
                ? users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))
                : shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={newPenalty.amount}
              onChange={(e) =>
                setNewPenalty({ ...newPenalty, amount: e.target.value })
              }
              className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 text-white focus:border-accent transition-all"
              placeholder="e.g. 100"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Reason
            </label>
            <input
              type="text"
              value={newPenalty.reason}
              onChange={(e) =>
                setNewPenalty({ ...newPenalty, reason: e.target.value })
              }
              className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 text-white focus:border-accent transition-all"
              placeholder="Reason for penalty"
              required
            />
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all active:scale-95"
            >
              Issue Penalty
            </button>
          </div>
        </form>
      </div>

      {/* Penalty Ledger */}
      <div className="bg-neutral-dark/30 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-neutral-mid/50 shadow-xl overflow-hidden">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-accent">📋</span> Penalty Ledger
        </h3>

        {penalties.length === 0 ? (
          <div className="text-center p-12 text-neutral-400 border border-dashed border-neutral-mid/50 rounded-2xl">
            No penalties recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-neutral-mid/40">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-neutral-mid/40 border-b border-neutral-mid text-neutral-300 font-bold uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-mid/30">
                {penalties.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-neutral-mid/20 transition-colors"
                  >
                    <td className="px-6 py-4 text-white">
                      <div className="font-bold">{p.target?.name || "N/A"}</div>
                      <div className="text-[10px] text-neutral-400">
                        {p.target?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 uppercase">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${p.target_type === "customer" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"}`}
                      >
                        {p.target_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-red-400">
                      ₹{p.amount}
                    </td>
                    <td
                      className="px-6 py-4 text-neutral-300 max-w-xs truncate"
                      title={p.reason}
                    >
                      {p.reason}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          p.status === "pending"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : p.status === "applied"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {p.status.toUpperCase()}
                      </span>
                      {p.reference_id && (
                        <div className="text-[10px] text-neutral-500 mt-1">
                          Ref: {p.reference_id}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === "pending" && (
                        <button
                          onClick={() => handleReversePenalty(p.id)}
                          className="text-red-500 hover:text-red-400 text-xs font-bold underline transition-colors"
                        >
                          Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPenalties;
