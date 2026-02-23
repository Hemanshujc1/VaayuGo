import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ShopRegister = () => {
  const [formData, setFormData] = useState({
    name: "",
    category: "Street Food",
    location_address: "",
  });

  const navigate = useNavigate();

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

          {/* Category */}
          <div>
            <label className="block text-neutral-light text-sm font-semibold mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-3 rounded-lg border border-neutral-mid bg-neutral-mid text-white focus:outline-none focus:ring-2 focus:ring-accent transition"
            >
              <option value="Street Food">Street Food</option>
              <option value="Grocery">Grocery</option>
              <option value="Medical">Medical</option>
              <option value="Xerox">Xerox</option>
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block text-neutral-light text-sm font-semibold mb-2">
              Address
            </label>
            <textarea
              rows="3"
              value={formData.location_address}
              onChange={(e) =>
                setFormData({ ...formData, location_address: e.target.value })
              }
              placeholder="Enter full shop address"
              className="w-full px-4 py-3 rounded-lg border border-neutral-mid bg-neutral-mid text-white placeholder-neutral-light focus:outline-none focus:ring-2 focus:ring-accent transition resize-none"
              required
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg font-bold text-primary bg-accent hover:bg-secondary hover:text-white transition-all duration-300 shadow-lg hover:shadow-accent/40 active:scale-95"
          >
            Create Shop
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShopRegister;
