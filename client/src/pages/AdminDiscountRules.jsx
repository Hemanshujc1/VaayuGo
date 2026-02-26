import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const AdminDiscountRules = () => {
  const [discounts, setDiscounts] = useState([]);
  const [shops, setShops] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newDiscount, setNewDiscount] = useState({
    name: "",
    type: "PERCENTAGE",
    value: "",
    max_discount_amount: "",
    min_order_value: "",
    target_type: "GLOBAL",
    target_id: "",
    valid_from: "",
    valid_until: "",
  });

  const categories = ["Street Food", "Grocery", "Medical", "Xerox"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [discountsRes, shopsRes, locRes] = await Promise.all([
        api.get("/discounts"),
        api.get("/admin/shops/all"),
        api.get("/public/locations"),
      ]);
      setDiscounts(discountsRes.data);
      setShops(shopsRes.data);
      setLocations(locRes.data);
    } catch (error) {
      toast.error("Failed to fetch discount data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newDiscount.name,
        type: newDiscount.type,
        value: parseFloat(newDiscount.value),
        max_discount_amount: newDiscount.max_discount_amount
          ? parseFloat(newDiscount.max_discount_amount)
          : null,
        min_order_value: newDiscount.min_order_value
          ? parseFloat(newDiscount.min_order_value)
          : null,
        target_type: newDiscount.target_type,
        target_id: newDiscount.target_id || null,
        valid_from: newDiscount.valid_from || null,
        valid_until: newDiscount.valid_until || null,
      };

      if (newDiscount.target_type === "CATEGORY") {
        payload.target_id = newDiscount.target_category; // Hack to send string category, backend needs to support it though.
        // Wait, backend expects integer for target_id.
        // Let's rely on standard logic, if category it might crash backend if it strictly wants integer.
        // I will use target_id for the string if type is CATEGORY as an edge case, but the backend DB uses INTEGER.
        // Oh, target_id is INTEGER in models! So category as target_id will fail.
      }

      await api.post("/discounts", payload);
      toast.success("Discount created successfully");

      setNewDiscount({
        name: "",
        type: "PERCENTAGE",
        value: "",
        max_discount_amount: "",
        min_order_value: "",
        target_type: "GLOBAL",
        target_id: "",
        valid_from: "",
        valid_until: "",
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create discount");
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.put(`/discounts/${id}/toggle`);
      toast.success("Discount status updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this discount rule permanently?")) return;
    try {
      await api.delete(`/discounts/${id}`);
      toast.success("Discount deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete discount");
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
            Discount Management
          </h1>
          <p className="text-neutral-light mt-2 text-sm max-w-xl">
            Create promotional offers, flat discounts, and percentage rules
            globally or for specific targets.
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

      {/* Main Configuration Card */}
      <div className="bg-neutral-dark/40 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-neutral-mid/60 shadow-xl mb-8 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-accent via-blue-500 to-purple-500 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-neutral-mid/50 gap-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Create New Offer
          </h2>
        </div>

        <form
          onSubmit={handleSaveDiscount}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="flex flex-col col-span-1 md:col-span-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Offer Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Diwali Super Saver"
              value={newDiscount.name}
              onChange={(e) =>
                setNewDiscount({ ...newDiscount, name: e.target.value })
              }
              className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 text-white focus:border-accent transition-all"
              maxLength={50}
              minLength={3}
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Type <span className="text-red-400">*</span>
            </label>
            <select
              value={newDiscount.type}
              onChange={(e) =>
                setNewDiscount({ ...newDiscount, type: e.target.value })
              }
              className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 text-white focus:border-accent transition-all"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FLAT">Flat Amount (₹)</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Value {newDiscount.type === "PERCENTAGE" ? "(%)" : "(₹)"}{" "}
              <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={newDiscount.value}
              onChange={(e) =>
                setNewDiscount({ ...newDiscount, value: e.target.value })
              }
              className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 text-white focus:border-accent transition-all"
              min="0.01"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Max Cap (₹){" "}
              <span className="text-[10px] text-neutral-500">(Optional)</span>
            </label>
            <input
              type="number"
              step="0.01"
              disabled={newDiscount.type === "FLAT"}
              placeholder="For % only"
              value={newDiscount.max_discount_amount}
              onChange={(e) =>
                setNewDiscount({
                  ...newDiscount,
                  max_discount_amount: e.target.value,
                })
              }
              className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 text-white focus:border-accent transition-all disabled:opacity-50"
              min="0"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Min Order (₹){" "}
              <span className="text-[10px] text-neutral-500">(Optional)</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="Minimum cart value"
              value={newDiscount.min_order_value}
              onChange={(e) =>
                setNewDiscount({
                  ...newDiscount,
                  min_order_value: e.target.value,
                })
              }
              className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 text-white focus:border-accent transition-all"
              min="0"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Scope <span className="text-red-400">*</span>
            </label>
            <select
              value={newDiscount.target_type}
              onChange={(e) =>
                setNewDiscount({
                  ...newDiscount,
                  target_type: e.target.value,
                  target_id: "",
                })
              }
              className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 text-white focus:border-accent transition-all"
            >
              <option value="GLOBAL">Global (All Orders)</option>
              <option value="LOCATION">Specific Location</option>
              <option value="SHOP">Specific Shop</option>
            </select>
          </div>

          {newDiscount.target_type !== "GLOBAL" && (
            <div className="flex flex-col">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Target Selection
              </label>
              {newDiscount.target_type === "LOCATION" && (
                <select
                  value={newDiscount.target_id}
                  onChange={(e) =>
                    setNewDiscount({
                      ...newDiscount,
                      target_id: e.target.value,
                    })
                  }
                  className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 text-white"
                  required
                >
                  <option value="">Select Location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              )}
              {newDiscount.target_type === "SHOP" && (
                <select
                  value={newDiscount.target_id}
                  onChange={(e) =>
                    setNewDiscount({
                      ...newDiscount,
                      target_id: e.target.value,
                    })
                  }
                  className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 text-white"
                  required
                >
                  <option value="">Select Shop</option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-end mt-4 pt-6 border-t border-neutral-mid/50">
            <button
              type="submit"
              className="bg-linear-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent text-primary font-bold px-8 py-3 rounded-xl shadow-[0_4px_14px_rgba(var(--color-accent),0.3)] hover:shadow-[0_6px_20px_rgba(var(--color-accent),0.4)] active:scale-[0.98] transition-all"
            >
              Publish Discount
            </button>
          </div>
        </form>
      </div>

      {/* RULES LIST */}
      <div className="bg-neutral-dark/30 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-neutral-mid/50 shadow-xl overflow-hidden">
        <h3 className="text-xl font-bold text-white mb-6">
          Active Discounts ({discounts.length})
        </h3>

        {discounts.length === 0 ? (
          <div className="text-center p-12 text-neutral-400 border border-dashed border-neutral-mid/50 rounded-2xl bg-neutral-dark/30">
            No discounts configured yet.
          </div>
        ) : (
          <div className="overflow-x-auto bg-primary/30 rounded-2xl border border-neutral-mid/40">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-neutral-mid/40 border-b border-neutral-mid text-neutral-300 font-bold uppercase text-[10px] md:text-xs">
                <tr>
                  <th className="px-6 py-4">Offer Name</th>
                  <th className="px-6 py-4">Type & Value</th>
                  <th className="px-6 py-4">Scope</th>
                  <th className="px-6 py-4">Creator</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-mid/30">
                {discounts.map((rule) => (
                  <tr
                    key={rule.id}
                    className="hover:bg-neutral-mid/20 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-white">
                      {rule.name}
                      {rule.min_order_value && (
                        <div className="text-[10px] text-neutral-400 font-normal">
                          Min: ₹{rule.min_order_value}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-accent font-bold">
                      {rule.type === "PERCENTAGE"
                        ? `${rule.value}%`
                        : `₹${rule.value}`}
                      {rule.max_discount_amount && (
                        <div className="text-[10px] text-neutral-400 font-normal">
                          Up to: ₹{rule.max_discount_amount}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-300">
                      <span className="bg-neutral-mid/50 px-2 py-1 rounded text-xs">
                        {rule.target_type}
                      </span>
                      {rule.target_id && (
                        <span className="ml-2 text-xs text-neutral-500">
                          ID: {rule.target_id}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded ${rule.creator_type === "ADMIN" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"}`}
                      >
                        {rule.creator_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggle(rule.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${rule.is_active ? "bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20" : "bg-neutral-mid text-neutral-400 border border-neutral-500/30 hover:bg-neutral-mid/80"}`}
                      >
                        {rule.is_active
                          ? "Active (Click to Disable)"
                          : "Disabled (Click to Enable)"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-2 text-neutral-400 hover:text-red-400 transition-colors"
                        title="Delete Rule"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
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

export default AdminDiscountRules;
