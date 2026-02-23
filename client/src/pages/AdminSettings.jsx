import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const AdminSettings = () => {
  // Slots State
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({
    name: "",
    start_time: "",
    end_time: "",
    cutoff_time: "",
  });

  // Config State
  const [configs, setConfigs] = useState([]);
  const [shops, setShops] = useState([]);
  const [newConfig, setNewConfig] = useState({
    shop_id: "", // Empty for Global
    category: "", // Empty for Global
    min_order_value: 0,
    delivery_fee: 20,
    commission_rate: 10,
    delivery_revenue_share: 10,
    is_prepaid_only: false,
  });

  const [loading, setLoading] = useState(true);

  const categories = ["Street Food", "Grocery", "Medical", "Xerox"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [slotsRes, configsRes, shopsRes] = await Promise.all([
        api.get("/admin/slots"),
        api.get("/admin/config"),
        api.get("/admin/shops/all"),
      ]);
      setSlots(slotsRes.data);
      setConfigs(configsRes.data);
      setShops(shopsRes.data);
    } catch (error) {
      toast.error("Failed to fetch settings data");
    } finally {
      setLoading(false);
    }
  };

  // --- Slot Handlers ---
  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/slots", newSlot);
      toast.success("Slot added successfully");
      setNewSlot({ name: "", start_time: "", end_time: "", cutoff_time: "" });
      fetchData(); // Refresh all
    } catch (error) {
      toast.error("Failed to add slot");
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm("Delete this slot?")) return;
    try {
      await api.delete(`/admin/slots/${id}`);
      toast.success("Slot deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete slot");
    }
  };

  // --- Config Handlers ---
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newConfig,
        shop_id: newConfig.shop_id || null,
        category: newConfig.category || null,
      };

      await api.post("/admin/config", payload);
      toast.success("Configuration saved successfully");
      // Reset form to default global values or keep as is? Let's reset to clean state
      setNewConfig({
        shop_id: "",
        category: "",
        min_order_value: 0,
        delivery_fee: 20,
        commission_rate: 10,
        delivery_revenue_share: 10,
        is_prepaid_only: false,
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to save configuration");
    }
  };

  const handleEditConfig = (config) => {
    setNewConfig({
      shop_id: config.shop_id || "",
      category: config.category || "",
      min_order_value: config.min_order_value,
      delivery_fee: config.delivery_fee,
      commission_rate: config.commission_rate,
      delivery_revenue_share: config.delivery_revenue_share,
      is_prepaid_only: config.is_prepaid_only,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-8 bg-primary min-h-screen text-primary-text pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">System Configuration</h1>
        <Link to="/admin/dashboard" className="text-accent hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {/* --- Service Configuration Section --- */}
      <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid mb-8">
        <h2 className="text-xl font-bold mb-6 text-white border-b border-neutral-mid pb-2">
          Service & Delivery Settings
        </h2>

        <p className="text-sm text-neutral-light mb-4">
          Configure fees and rules. <br />
          <strong>Hierarchy:</strong> Shop Specific &gt; Category Specific &gt;
          Global Default.
        </p>

        <form
          onSubmit={handleSaveConfig}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 items-end bg-neutral-mid/30 p-4 rounded"
        >
          {/* Scope Selection */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-neutral-mid pb-4 mb-2">
            <div>
              <label className="block text-sm font-bold text-neutral-light mb-1">
                Scope: Shop (Optional)
              </label>
              <select
                value={newConfig.shop_id}
                onChange={(e) =>
                  setNewConfig({ ...newConfig, shop_id: e.target.value })
                }
                className="w-full bg-neutral-mid border border-neutral-mid rounded p-2 text-white focus:ring-accent"
              >
                <option value="">All Shops (Global)</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name} ({shop.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-neutral-light mb-1">
                Scope: Category (Optional)
              </label>
              <select
                value={newConfig.category}
                onChange={(e) =>
                  setNewConfig({ ...newConfig, category: e.target.value })
                }
                className="w-full bg-neutral-mid border border-neutral-mid rounded p-2 text-white focus:ring-accent"
              >
                <option value="">All Categories (Global)</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Values */}
          <div>
            <label className="block text-sm font-bold text-neutral-light mb-1">
              Min Order Value (₹)
            </label>
            <input
              type="number"
              value={newConfig.min_order_value}
              onChange={(e) =>
                setNewConfig({
                  ...newConfig,
                  min_order_value: parseFloat(e.target.value),
                })
              }
              className="w-full bg-neutral-mid border border-neutral-mid rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-light mb-1">
              Delivery Fee (₹)
            </label>
            <input
              type="number"
              value={newConfig.delivery_fee}
              onChange={(e) =>
                setNewConfig({
                  ...newConfig,
                  delivery_fee: parseFloat(e.target.value),
                })
              }
              className="w-full bg-neutral-mid border border-neutral-mid rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-light mb-1">
              Commission Rate (%)
            </label>
            <input
              type="number"
              value={newConfig.commission_rate}
              onChange={(e) =>
                setNewConfig({
                  ...newConfig,
                  commission_rate: parseFloat(e.target.value),
                })
              }
              className="w-full bg-neutral-mid border border-neutral-mid rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-light mb-1">
              Del. Rev. Share (₹)
            </label>
            <input
              type="number"
              value={newConfig.delivery_revenue_share}
              onChange={(e) =>
                setNewConfig({
                  ...newConfig,
                  delivery_revenue_share: parseFloat(e.target.value),
                })
              }
              className="w-full bg-neutral-mid border border-neutral-mid rounded p-2 text-white"
              title="Amount shopkeeper keeps from delivery fee"
            />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="is_prepaid"
              checked={newConfig.is_prepaid_only}
              onChange={(e) =>
                setNewConfig({
                  ...newConfig,
                  is_prepaid_only: e.target.checked,
                })
              }
              className="w-5 h-5 accent-accent"
            />
            <label
              htmlFor="is_prepaid"
              className="text-sm font-bold text-white select-none"
            >
              Prepaid Only?
            </label>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end">
            <button
              type="submit"
              className="bg-accent text-primary font-bold px-6 py-2 rounded hover:bg-secondary hover:text-white transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>

        {/* Existing Configurations List */}
        <div className="space-y-4">
          <h3 className="font-bold text-neutral-light">
            Active Configurations
          </h3>
          {configs.length === 0 ? (
            <p className="text-neutral-light italic">
              No configurations found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-mid text-neutral-light uppercase font-bold">
                  <tr>
                    <th className="px-4 py-2">Scope</th>
                    <th className="px-4 py-2">Min Order</th>
                    <th className="px-4 py-2">Del. Fee</th>
                    <th className="px-4 py-2">Comm. %</th>
                    <th className="px-4 py-2">Rev. Share</th>
                    <th className="px-4 py-2">Prepaid?</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-mid">
                  {configs.map((conf) => {
                    const shopName = conf.shop_id
                      ? shops.find((s) => s.id === conf.shop_id)?.name
                      : null;
                    let scopeLabel = "Global Default";
                    if (shopName) scopeLabel = `Shop: ${shopName}`;
                    else if (conf.category)
                      scopeLabel = `Cat: ${conf.category}`;

                    return (
                      <tr key={conf.id} className="hover:bg-neutral-mid/30">
                        <td className="px-4 py-2 font-bold text-accent">
                          {scopeLabel}
                        </td>
                        <td className="px-4 py-2">₹{conf.min_order_value}</td>
                        <td className="px-4 py-2">₹{conf.delivery_fee}</td>
                        <td className="px-4 py-2">{conf.commission_rate}%</td>
                        <td className="px-4 py-2">
                          ₹{conf.delivery_revenue_share}
                        </td>
                        <td className="px-4 py-2">
                          {conf.is_prepaid_only ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleEditConfig(conf)}
                            className="text-accent hover:underline"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Slots Section */}
      <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid mb-8">
        <h2 className="text-xl font-bold mb-6 text-white border-b border-neutral-mid pb-2">
          Delivery Slots Management
        </h2>

        {/* Add Slot Form */}
        <form
          onSubmit={handleAddSlot}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 items-end"
        >
          <div>
            <label className="block text-sm font-bold text-neutral-light mb-1">
              Slot Name
            </label>
            <input
              type="text"
              placeholder="e.g. Lunch"
              value={newSlot.name}
              onChange={(e) => setNewSlot({ ...newSlot, name: e.target.value })}
              className="w-full bg-neutral-mid border border-neutral-mid rounded p-2 text-white focus:outline-none focus:ring-1 focus:ring-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-light mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={newSlot.start_time}
              onChange={(e) =>
                setNewSlot({ ...newSlot, start_time: e.target.value })
              }
              className="w-full bg-neutral-mid border border-neutral-mid rounded p-2 text-white focus:outline-none focus:ring-1 focus:ring-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-light mb-1">
              End Time
            </label>
            <input
              type="time"
              value={newSlot.end_time}
              onChange={(e) =>
                setNewSlot({ ...newSlot, end_time: e.target.value })
              }
              className="w-full bg-neutral-mid border border-neutral-mid rounded p-2 text-white focus:outline-none focus:ring-1 focus:ring-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-light mb-1">
              Cutoff Time
            </label>
            <input
              type="time"
              value={newSlot.cutoff_time}
              onChange={(e) =>
                setNewSlot({ ...newSlot, cutoff_time: e.target.value })
              }
              className="w-full bg-neutral-mid border border-neutral-mid rounded p-2 text-white focus:outline-none focus:ring-1 focus:ring-accent"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-accent text-primary font-bold px-4 py-2 rounded hover:bg-secondary hover:text-white transition-colors h-10"
          >
            Add Slot
          </button>
        </form>

        {/* Slots List */}
        <div className="space-y-4">
          <h3 className="font-bold text-neutral-light">Active Slots</h3>
          {slots.length === 0 ? (
            <p className="text-neutral-light italic">No slots configured.</p>
          ) : (
            slots.map((slot) => (
              <div
                key={slot.id}
                className="flex justify-between items-center bg-primary p-3 rounded border border-neutral-mid"
              >
                <div>
                  <span className="font-bold text-white text-lg mr-4">
                    {slot.name}
                  </span>
                  <span className="text-neutral-light">
                    {slot.start_time} - {slot.end_time} (Cutoff:{" "}
                    {slot.cutoff_time})
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteSlot(slot.id)}
                  className="text-danger hover:text-red-400 font-bold px-3 py-1 rounded hover:bg-neutral-dark transition-colors"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
