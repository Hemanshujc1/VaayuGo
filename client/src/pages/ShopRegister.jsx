import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ShopRegister = () => {
  const [formData, setFormData] = useState({
    name: "",
    location_address: "",
    categoryIds: [],
  });

  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [locRes, catRes] = await Promise.all([
          api.get("/public/locations"),
          api.get("/public/categories"),
        ]);

        setLocations(locRes.data);
        setCategories(catRes.data);

        if (locRes.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            location_address: locRes.data[0].name,
          }));
        }
      } catch (err) {
        console.error("Error fetching registration data", err);
      }
    };
    fetchInitialData();
  }, []);

  const toggleCategory = (id) => {
    setFormData((prev) => {
      const currentIds = prev.categoryIds || [];
      if (currentIds.includes(id)) {
        return {
          ...prev,
          categoryIds: currentIds.filter((catId) => catId !== id),
        };
      } else {
        return { ...prev, categoryIds: [...currentIds, id] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/shop/register", formData);
      toast.success("Shop registered! Waiting for approval.");
      navigate("/shop/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      {/* Card */}
      <div className="w-full max-w-lg bg-neutral-dark/90 backdrop-blur-lg p-10 rounded-2xl shadow-2xl border border-neutral-mid relative overflow-hidden">
        {/* Accent Top Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-accent"></div>

        <h2 className="text-3xl font-bold text-center text-white mb-2">
          Register Your Shop
        </h2>
        <p className="text-center text-neutral-light text-sm mb-8">
          Join the platform and start selling instantly 🚀
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Name */}
          <div>
            <label className="block text-neutral-light text-sm font-semibold mb-2">
              Shop Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter your shop name"
              className="w-full px-4 py-3 rounded-lg border border-neutral-mid bg-neutral-mid text-white placeholder-neutral-light focus:outline-none focus:ring-2 focus:ring-accent transition"
              required
            />
          </div>

          {/* Category Multi-Select */}
          <div>
            <label className="block text-neutral-light text-sm font-semibold mb-3">
              Store Categories (Select Multiple)
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    formData.categoryIds.includes(cat.id)
                      ? "bg-accent border-accent text-primary shadow-lg shadow-accent/20"
                      : "bg-neutral-mid border-neutral-light/20 text-neutral-light hover:border-neutral-light hover:text-white"
                  }`}
                >
                  {cat.name}
                  {formData.categoryIds.includes(cat.id) && (
                    <span className="ml-2">✓</span>
                  )}
                </button>
              ))}
            </div>
            {formData.categoryIds.length === 0 && (
              <p className="text-[10px] text-danger/80 italic">
                Please select at least one category
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-neutral-light text-sm font-semibold mb-2">
              Delivery Zone (Location)
            </label>
            <select
              value={formData.location_address}
              onChange={(e) =>
                setFormData({ ...formData, location_address: e.target.value })
              }
              className="w-full px-4 py-3 rounded-lg border border-neutral-mid bg-neutral-mid text-white focus:outline-none focus:ring-2 focus:ring-accent transition"
              required
            >
              <option value="" disabled>
                Select a location
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={formData.categoryIds.length === 0}
            className="w-full py-3 rounded-lg font-bold text-primary bg-accent hover:bg-secondary hover:text-white transition-all duration-300 shadow-lg hover:shadow-accent/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Shop
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShopRegister;
