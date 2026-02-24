import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const AdminGlobalRules = () => {
  const [rules, setRules] = useState([]);
  const [shops, setShops] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newRule, setNewRule] = useState({
    location_id: "",
    shop_id: "",
    category: "",
    min_order_value: 0,
    delivery_fee: 20,
    shop_delivery_share: 10,
    vaayugo_delivery_share: 10,
    commission_percent: 10,
    small_order_delivery_fee: "",
    is_active: true,
  });

  const categories = ["Street Food", "Grocery", "Medical", "Xerox"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, shopsRes, locRes] = await Promise.all([
        api.get("/admin/delivery-rules"),
        api.get("/admin/shops/all"),
        api.get("/public/locations"),
      ]);
      setRules(rulesRes.data);
      setShops(shopsRes.data);
      setLocations(locRes.data);

      if (locRes.data.length > 0) {
        setNewRule((prev) => ({ ...prev, location_id: locRes.data[0].id }));
      }
    } catch (error) {
      toast.error("Failed to fetch rule engine data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      const totalShare =
        Number(newRule.shop_delivery_share) +
        Number(newRule.vaayugo_delivery_share);
      if (Number(newRule.delivery_fee) !== totalShare) {
        toast.error("Delivery fee must equal shop share + vaayugo share");
        return;
      }

      if (
        newRule.small_order_delivery_fee !== "" &&
        newRule.small_order_delivery_fee !== null
      ) {
        if (
          Number(newRule.small_order_delivery_fee) <
          Number(newRule.delivery_fee)
        ) {
          toast.error(
            "Small order fee cannot be less than standard delivery fee",
          );
          return;
        }
      }

      const payload = {
        ...newRule,
        shop_id: newRule.shop_id || null,
        category: newRule.category || null,
        small_order_delivery_fee:
          newRule.small_order_delivery_fee === ""
            ? null
            : newRule.small_order_delivery_fee,
      };

      if (newRule.id) {
        await api.put(`/admin/delivery-rules/${newRule.id}`, payload);
        toast.success("Delivery rule updated successfully");
      } else {
        await api.post("/admin/delivery-rules", payload);
        toast.success("Delivery rule saved successfully");
      }

      setNewRule({
        location_id: locations.length > 0 ? locations[0].id : "",
        shop_id: "",
        category: "",
        min_order_value: 0,
        delivery_fee: 20,
        shop_delivery_share: 10,
        vaayugo_delivery_share: 10,
        commission_percent: 10,
        small_order_delivery_fee: "",
        is_active: true,
      });
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save delivery rule",
      );
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm("Delete this rule?")) return;
    try {
      await api.delete(`/admin/delivery-rules/${id}`);
      toast.success("Delivery rule deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete delivery rule");
    }
  };

  const handleEditRule = (rule) => {
    setNewRule({
      id: rule.id,
      location_id: rule.location_id,
      shop_id: rule.shop_id || "",
      category: rule.category || "",
      min_order_value: rule.min_order_value || 0,
      delivery_fee: rule.delivery_fee,
      shop_delivery_share: rule.shop_delivery_share,
      vaayugo_delivery_share: rule.vaayugo_delivery_share,
      commission_percent: rule.commission_percent,
      small_order_delivery_fee: rule.small_order_delivery_fee || "",
      is_active: rule.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            Delivery Rules Engine
          </h1>
          <p className="text-neutral-light mt-2 text-sm max-w-xl">
            Configure delivery fees, minimum orders, and split payouts.
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Service & Fee Configuration
          </h2>
          <div className="bg-primary/50 text-neutral-300 text-xs py-1.5 px-4 rounded-full border border-neutral-mid/50 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Hierarchy: Shop &gt; Category &gt; Global
          </div>
        </div>

        <form
          onSubmit={handleSaveRule}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6 lg:gap-y-8"
        >
          {/* SCOPE SELECTION (Full Width) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6 bg-primary/30 p-5 rounded-2xl border border-neutral-mid/40 shadow-inner">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-accent uppercase tracking-wider mb-2 flex">
                Scope: Location <span className="text-red-400">*</span>
              </label>
              <select
                value={newRule.location_id}
                onChange={(e) =>
                  setNewRule({ ...newRule, location_id: e.target.value })
                }
                className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 text-white focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none"
                required
              >
                <option value="" disabled>
                  Select Location
                </option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Scope: Shop{" "}
                <span className="text-[10px] ml-1 text-neutral-500 opacity-70">
                  (Optional)
                </span>
              </label>
              <select
                value={newRule.shop_id}
                onChange={(e) =>
                  setNewRule({
                    ...newRule,
                    shop_id: e.target.value,
                    category: "",
                  })
                }
                className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 text-white focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all appearance-none"
              >
                <option value="">All Shops</option>
                {shops
                  .filter((shop) => {
                    if (!newRule.location_id) return true;
                    const loc = locations.find(
                      (l) => l.id === Number(newRule.location_id),
                    );
                    return loc ? shop.location_address === loc.name : true;
                  })
                  .map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name} ({shop.category})
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Scope: Category{" "}
                <span className="text-[10px] ml-1 text-neutral-500 opacity-70">
                  (Optional)
                </span>
              </label>
              <select
                value={newRule.category}
                onChange={(e) =>
                  setNewRule({
                    ...newRule,
                    category: e.target.value,
                    shop_id: "",
                  })
                }
                className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 text-white focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all disabled:opacity-50 appearance-none"
                disabled={!!newRule.shop_id}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FINANCIAL VALUES */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Total Delivery Fee (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-neutral-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                value={newRule.delivery_fee}
                onChange={(e) =>
                  setNewRule({
                    ...newRule,
                    delivery_fee: parseFloat(e.target.value),
                  })
                }
                className="w-full bg-primary/80 border border-neutral-mid rounded-xl p-3 pl-8 text-white focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                required
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Shop Delivery Share (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-neutral-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                value={newRule.shop_delivery_share}
                onChange={(e) =>
                  setNewRule({
                    ...newRule,
                    shop_delivery_share: parseFloat(e.target.value),
                  })
                }
                className="w-full bg-primary/80 border border-neutral-mid rounded-xl p-3 pl-8 text-white focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all"
                required
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              VaayuGO Share (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-neutral-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                value={newRule.vaayugo_delivery_share}
                onChange={(e) =>
                  setNewRule({
                    ...newRule,
                    vaayugo_delivery_share: parseFloat(e.target.value),
                  })
                }
                className="w-full bg-primary/80 border border-neutral-mid rounded-xl p-3 pl-8 text-white focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
                required
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Commission Percent
            </label>
            <div className="relative">
              <span className="absolute right-4 top-3 text-neutral-400 font-bold">
                %
              </span>
              <input
                type="number"
                value={newRule.commission_percent}
                onChange={(e) =>
                  setNewRule({
                    ...newRule,
                    commission_percent: parseFloat(e.target.value),
                  })
                }
                className="w-full bg-primary/80 border border-neutral-mid rounded-xl p-3 pr-8 text-white focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 transition-all"
                required
              />
            </div>
          </div>

          {/* MINIMUMS AND SMALL ORDERS (Full Width) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-primary/20 border border-neutral-mid/30 rounded-2xl p-6 mt-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Minimum Order Value (₹){" "}
                <span className="text-[10px] ml-1 text-neutral-500 opacity-70">
                  (Optional)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-neutral-400 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={newRule.min_order_value}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      min_order_value:
                        e.target.value === "" ? "" : parseFloat(e.target.value),
                    })
                  }
                  className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 pl-8 text-white focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Small Order Fee (₹){" "}
                <span className="text-[10px] ml-1 text-neutral-500 opacity-70">
                  (Optional)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-neutral-400 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  placeholder="Leave blank to strictly block orders below minimum"
                  value={newRule.small_order_delivery_fee}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      small_order_delivery_fee:
                        e.target.value === "" ? "" : parseFloat(e.target.value),
                    })
                  }
                  className="w-full bg-neutral-dark border border-neutral-mid rounded-xl p-3 pl-8 text-white focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all"
                />
              </div>
              <p className="text-xs text-orange-400/80 mt-2 flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                If blank, orders below minimum order value are blocked.
              </p>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-col md:flex-row justify-between items-center gap-6 mt-4 pt-6 border-t border-neutral-mid/50">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={newRule.is_active}
                  onChange={(e) =>
                    setNewRule({ ...newRule, is_active: e.target.checked })
                  }
                  className="sr-only"
                />
                <div
                  className={`block w-14 h-8 rounded-full transition-colors ${newRule.is_active ? "bg-accent" : "bg-neutral-mid"}`}
                ></div>
                <div
                  className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform transform ${newRule.is_active ? "translate-x-6" : ""}`}
                ></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white group-hover:text-accent transition-colors">
                  Rule is Active
                </span>
                <span className="text-xs text-neutral-500">
                  Toggle to enable or disable target
                </span>
              </div>
            </label>

            <div className="flex w-full md:w-auto gap-4">
              {newRule.id && (
                <button
                  type="button"
                  onClick={() => {
                    setNewRule({
                      location_id: locations.length > 0 ? locations[0].id : "",
                      shop_id: "",
                      category: "",
                      min_order_value: 0,
                      delivery_fee: 20,
                      shop_delivery_share: 10,
                      vaayugo_delivery_share: 10,
                      commission_percent: 10,
                      small_order_delivery_fee: "",
                      is_active: true,
                    });
                  }}
                  className="flex-1 md:flex-none border border-neutral-mid bg-transparent text-white font-bold px-6 py-3 rounded-xl hover:bg-neutral-mid transition-all"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="flex-1 md:flex-none bg-linear-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent text-primary font-bold px-8 py-3 rounded-xl shadow-[0_4px_14px_rgba(var(--color-accent),0.3)] hover:shadow-[0_6px_20px_rgba(var(--color-accent),0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {newRule.id ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Update Rule
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Save Rule
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* RULES LIST */}
      <div className="bg-neutral-dark/30 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-neutral-mid/50 shadow-xl overflow-hidden">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-neutral-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Active Delivery Rules
        </h3>

        {rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 h-64 border-2 border-dashed border-neutral-mid/50 rounded-2xl bg-primary/20">
            <div className="w-16 h-16 bg-neutral-dark rounded-full flex items-center justify-center mb-4 shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-neutral-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-neutral-400 font-medium text-lg">
              No delivery rules found.
            </p>
            <p className="text-neutral-500 text-sm mt-1">
              Configure your first rule above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-primary/30 rounded-2xl border border-neutral-mid/40">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-neutral-mid/40 border-b border-neutral-mid text-neutral-300 font-bold tracking-wider uppercase text-[10px] md:text-xs">
                <tr>
                  <th className="px-6 py-4">Scope</th>
                  <th className="px-6 py-4">Min Order</th>
                  <th className="px-6 py-4">Structure</th>
                  <th className="px-6 py-4 text-center">Comm. %</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-mid/30">
                {rules.map((rule) => {
                  const locName =
                    locations.find((l) => l.id === rule.location_id)?.name ||
                    rule.location_id;
                  let scopeBadge = (
                    <span className="text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded border border-blue-400/20">
                      Global
                    </span>
                  );
                  let scopeLabel = "";
                  if (rule.shop_id && rule.Shop) {
                    scopeBadge = (
                      <span className="text-green-400 bg-green-400/10 px-2.5 py-1 rounded border border-green-400/20">
                        Shop
                      </span>
                    );
                    scopeLabel = rule.Shop.name;
                  } else if (rule.category) {
                    scopeBadge = (
                      <span className="text-purple-400 bg-purple-400/10 px-2.5 py-1 rounded border border-purple-400/20">
                        Category
                      </span>
                    );
                    scopeLabel = rule.category;
                  }

                  return (
                    <tr
                      key={rule.id}
                      className="hover:bg-neutral-mid/20 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {scopeBadge}
                            <span className="font-bold text-white text-base truncate max-w-[200px]">
                              {scopeLabel || "All Shops"}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-500 font-semibold uppercase tracking-widest pl-1">
                            LOC: {locName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {rule.min_order_value ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-white">
                              ₹{rule.min_order_value}
                            </span>
                            {rule.small_order_delivery_fee !== null ? (
                              <span className="text-xs text-orange-400/80 bg-orange-400/10 px-1.5 py-0.5 rounded mt-1 inline-block w-max">
                                +₹{rule.small_order_delivery_fee} fee if below
                              </span>
                            ) : (
                              <span className="text-xs text-red-400/80 bg-red-400/10 px-1.5 py-0.5 rounded mt-1 inline-block w-max">
                                Strict cutoff
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-500 italic">
                            No Min Order
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-accent">
                            ₹{rule.delivery_fee}{" "}
                            <span className="text-neutral-500 font-normal">
                              Total
                            </span>
                          </span>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span
                              className="bg-green-400/10 text-green-400 border border-green-400/20 px-1.5 py-0.5 rounded"
                              title="Shop Share"
                            >
                              S: ₹{rule.shop_delivery_share}
                            </span>
                            <span
                              className="bg-blue-400/10 text-blue-400 border border-blue-400/20 px-1.5 py-0.5 rounded"
                              title="VaayuGO Share"
                            >
                              V: ₹{rule.vaayugo_delivery_share}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-white text-lg bg-primary/50 px-3 py-1 rounded inline-block">
                          {rule.commission_percent}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold ${rule.is_active ? "bg-green-500/10 text-green-400 border border-green-500/30" : "bg-neutral-mid text-neutral-400 border border-neutral-500/30"}`}
                        >
                          {rule.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditRule(rule)}
                            className="p-2 bg-neutral-dark hover:bg-accent/20 text-neutral-300 hover:text-accent rounded-lg border border-neutral-mid hover:border-accent/40 transition-all"
                            title="Edit Rule"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-2 bg-neutral-dark hover:bg-red-500/20 text-neutral-300 hover:text-red-400 rounded-lg border border-neutral-mid hover:border-red-500/40 transition-all"
                            title="Delete Rule"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
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
  );
};

export default AdminGlobalRules;
