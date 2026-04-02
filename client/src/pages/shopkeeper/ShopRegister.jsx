import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ShopRegister = () => {
  const [formData, setFormData] = useState({
    name: "",
    location_address: "",
    categoryIds: [],
    opening_time: "09:00",
    closing_time: "21:00",
    break_start: "",
    break_end: "",
    closed_days: [],
    is_xerox_enabled: false,
  });

  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const toggleClosedDay = (day) => {
    setFormData((prev) => {
      const currentDays = prev.closed_days || [];
      if (currentDays.includes(day)) {
        return {
          ...prev,
          closed_days: currentDays.filter((d) => d !== day),
        };
      } else {
        return { ...prev, closed_days: [...currentDays, day] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post("/shop/register", formData);
      toast.success("Shop registered! Waiting for approval.");
      navigate("/shop/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
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
            
            {/* Xerox Toggle */}
            <div className="mt-4 flex items-center gap-3 bg-neutral-mid/50 p-3 rounded-lg border border-neutral-light/20">
              <input 
                type="checkbox"
                id="is_xerox_enabled"
                checked={formData.is_xerox_enabled}
                onChange={(e) => setFormData({...formData, is_xerox_enabled: e.target.checked})}
                className="w-5 h-5 accent-accent"
              />
              <label htmlFor="is_xerox_enabled" className="text-white text-sm font-semibold cursor-pointer">
                Will your shop provide Xerox/Printing services?
              </label>
            </div>
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

          {/* Business Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-light text-sm font-semibold mb-2">
                Opening Time
              </label>
              <input
                type="time"
                value={formData.opening_time}
                onChange={(e) =>
                  setFormData({ ...formData, opening_time: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border border-neutral-mid bg-neutral-mid text-white focus:outline-none focus:ring-2 focus:ring-accent transition"
                required
              />
            </div>
            <div>
              <label className="block text-neutral-light text-sm font-semibold mb-2">
                Closing Time
              </label>
              <input
                type="time"
                value={formData.closing_time}
                onChange={(e) =>
                  setFormData({ ...formData, closing_time: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border border-neutral-mid bg-neutral-mid text-white focus:outline-none focus:ring-2 focus:ring-accent transition"
                required
              />
            </div>
          </div>

          {/* Break Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-light text-sm font-semibold mb-2">
                Break Start (Optional)
              </label>
              <input
                type="time"
                value={formData.break_start}
                onChange={(e) =>
                  setFormData({ ...formData, break_start: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border border-neutral-mid bg-neutral-mid text-white focus:outline-none focus:ring-2 focus:ring-accent transition"
              />
            </div>
            <div>
              <label className="block text-neutral-light text-sm font-semibold mb-2">
                Break End (Optional)
              </label>
              <input
                type="time"
                value={formData.break_end}
                onChange={(e) =>
                  setFormData({ ...formData, break_end: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border border-neutral-mid bg-neutral-mid text-white focus:outline-none focus:ring-2 focus:ring-accent transition"
              />
            </div>
          </div>

          {/* Closed Days */}
          <div>
            <label className="block text-neutral-light text-sm font-semibold mb-3">
              Weekly Closed Days (If any)
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleClosedDay(day)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                    formData.closed_days.includes(day)
                      ? "bg-red-900/40 border-red-500 text-red-200"
                      : "bg-neutral-mid border-neutral-light/20 text-neutral-light hover:border-neutral-light hover:text-white"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={formData.categoryIds.length === 0 || isLoading}
            className="w-full flex justify-center items-center py-3 rounded-lg font-bold text-primary bg-accent hover:bg-secondary hover:text-white transition-all duration-300 shadow-lg hover:shadow-accent/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Registering...
              </>
            ) : (
              "Create Shop"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShopRegister;
