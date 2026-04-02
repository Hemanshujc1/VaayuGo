import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";

const XeroxServiceConfig = ({ shopId: propShopId, isXeroxEnabledInitial }) => {
  const [shopId, setShopId] = useState(propShopId);
  const [isEnabled, setIsEnabled] = useState(isXeroxEnabledInitial);
  const [config, setConfig] = useState({
    bw_single_price: 0,
    bw_double_price: 0,
    color_single_price: 0,
    color_double_price: 0,
  });
  const [bindings, setBindings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propShopId) {
      api.get("/shop/my-shop").then(res => {
        setShopId(res.data.id);
        setIsEnabled(res.data.is_xerox_enabled);
      }).catch(err => {
        console.error("Failed to fetch shop", err);
        setLoading(false);
      });
    }
  }, [propShopId]);

  useEffect(() => {
    if (shopId) {
      fetchXeroxData(shopId);
    }
  }, [shopId]);

  const fetchXeroxData = async (id) => {
    try {
      const [configRes, bindingsRes] = await Promise.all([
        api.get(`/xerox/${id}/xerox-config`),
        api.get(`/xerox/${id}/bindings`),
      ]);
      if (configRes.data.data) setConfig(configRes.data.data);
      if (bindingsRes.data.data) setBindings(bindingsRes.data.data);
    } catch (err) {
      console.error("Failed to fetch Xerox data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      const nextState = !isEnabled;
      await api.patch(`/xerox/${shopId}/toggle-xerox`, { is_enabled: nextState });
      setIsEnabled(nextState);
      toast.success(`Xerox service ${nextState ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error("Failed to toggle Xerox service");
    }
  };

  const handleSaveConfig = async () => {
    try {
      await api.post(`/xerox/${shopId}/xerox-config`, config);
      toast.success("Pricing configuration saved");
    } catch (err) {
      toast.error("Failed to save pricing configuration");
    }
  };

  const handleAddBinding = async () => {
    try {
      const res = await api.post(`/xerox/${shopId}/bindings`, {
        name: "New Binding",
        price: 0,
        price_type: "per_document",
      });
      setBindings([...bindings, res.data.data]);
      toast.success("Binding option added");
    } catch (err) {
      toast.error("Failed to add binding option");
    }
  };

  const handleUpdateBinding = async (id, updatedData) => {
    try {
      await api.put(`/xerox/bindings/${id}`, updatedData);
      setBindings(bindings.map((b) => (b.id === id ? { ...b, ...updatedData } : b)));
    } catch (err) {
      toast.error("Failed to update binding option");
    }
  };

  const handleDeleteBinding = async (id) => {
    try {
      await api.delete(`/xerox/bindings/${id}`);
      setBindings(bindings.filter((b) => b.id !== id));
      toast.success("Binding option deleted");
    } catch (err) {
      toast.error("Failed to delete binding option");
    }
  };

  if (loading) return <div className="text-white text-sm">Loading Xerox Settings...</div>;

  return (
    <div className="bg-neutral-dark p-4 md:p-6 rounded shadow border border-neutral-mid mt-8">
      <div className="flex justify-between items-center mb-6 border-b border-neutral-mid pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Xerox Services</h2>
          <p className="text-neutral-light text-sm">Configure your printing and binding services</p>
        </div>
        <button
          onClick={handleToggle}
          className={`px-4 py-2 rounded font-bold text-sm transition-all ${
            isEnabled ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-accent text-primary"
          }`}
        >
          {isEnabled ? "Disable Xerox Service" : "Enable Xerox Service"}
        </button>
      </div>

      {isEnabled && (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Pricing Config */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Printing Rates (₹)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <p className="text-neutral-light text-xs uppercase tracking-wider font-bold">Black & White</p>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-neutral-light block mb-1">Single Sided</label>
                    <input
                      type="number"
                      value={config.bw_single_price}
                      onChange={(e) => setConfig({ ...config, bw_single_price: e.target.value })}
                      className="w-full bg-primary/30 border border-neutral-mid rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-neutral-light block mb-1">Double Sided</label>
                    <input
                      type="number"
                      value={config.bw_double_price}
                      onChange={(e) => setConfig({ ...config, bw_double_price: e.target.value })}
                      className="w-full bg-primary/30 border border-neutral-mid rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-neutral-light text-xs uppercase tracking-wider font-bold">Color</p>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-neutral-light block mb-1">Single Sided</label>
                    <input
                      type="number"
                      value={config.color_single_price}
                      onChange={(e) => setConfig({ ...config, color_single_price: e.target.value })}
                      className="w-full bg-primary/30 border border-neutral-mid rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-neutral-light block mb-1">Double Sided</label>
                    <input
                      type="number"
                      value={config.color_double_price}
                      onChange={(e) => setConfig({ ...config, color_double_price: e.target.value })}
                      className="w-full bg-primary/30 border border-neutral-mid rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveConfig}
              className="mt-4 px-4 py-2 bg-neutral-mid text-white rounded text-sm hover:bg-neutral-light/20 transition-all font-bold"
            >
              Save Printing Rates
            </button>
          </div>

          {/* Binding Options */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Binding Options</h3>
              <button
                onClick={handleAddBinding}
                className="text-accent text-sm font-bold hover:underline"
              >
                + Add Binding Type
              </button>
            </div>
            
            <div className="space-y-3">
              {bindings.length === 0 ? (
                <p className="text-neutral-light text-sm italic">No binding options added yet.</p>
              ) : (
                bindings.map((b) => (
                  <div key={b.id} className="flex flex-col md:flex-row gap-3 items-center bg-primary/20 p-3 rounded border border-neutral-mid/30">
                    <input
                      type="text"
                      value={b.name}
                      placeholder="e.g. Spiral"
                      onChange={(e) => setBindings(bindings.map(item => item.id === b.id ? { ...item, name: e.target.value } : item))}
                      onBlur={() => handleUpdateBinding(b.id, { name: b.name, price: b.price, price_type: b.price_type })}
                      className="flex-1 bg-transparent border-b border-neutral-mid text-white px-2 py-1 focus:outline-none focus:border-accent"
                    />
                    <div className="flex items-center gap-2">
                       <span className="text-neutral-light text-sm">₹</span>
                       <input
                        type="number"
                        value={b.price}
                        onChange={(e) => setBindings(bindings.map(item => item.id === b.id ? { ...item, price: e.target.value } : item))}
                        onBlur={() => handleUpdateBinding(b.id, { name: b.name, price: b.price, price_type: b.price_type })}
                        className="w-20 bg-transparent border-b border-neutral-mid text-white px-2 py-1 focus:outline-none focus:border-accent"
                      />
                    </div>
                    <select
                      value={b.price_type}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        setBindings(bindings.map(item => item.id === b.id ? { ...item, price_type: nextType } : item));
                        handleUpdateBinding(b.id, { name: b.name, price: b.price, price_type: nextType });
                      }}
                      className="bg-neutral-dark border border-neutral-mid text-white rounded px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="per_document">Per Document</option>
                      <option value="per_page">Per Page</option>
                    </select>
                    <button
                      onClick={() => handleDeleteBinding(b.id)}
                      className="text-red-400 hover:text-red-500 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default XeroxServiceConfig;
