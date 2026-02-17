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
    <div className="flex justify-center items-center h-screen bg-primary">
      <div className="w-full max-w-md bg-neutral-dark p-8 rounded shadow-md border-t-4 border-accent">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">
          Register Your Shop
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-neutral-light text-sm font-bold mb-2">
              Shop Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-mid rounded focus:outline-none focus:ring-2 focus:ring-accent bg-neutral-mid text-white placeholder-neutral-light"
              required
            />
          </div>
          <div>
            <label className="block text-neutral-light text-sm font-bold mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-mid rounded focus:outline-none focus:ring-2 focus:ring-accent bg-neutral-mid text-white"
            >
              <option value="Street Food">Street Food</option>
              <option value="Grocery">Grocery</option>
              <option value="Medical">Medical</option>
              <option value="Xerox">Xerox</option>
            </select>
          </div>
          <div>
            <label className="block text-neutral-light text-sm font-bold mb-2">
              Address
            </label>
            <textarea
              value={formData.location_address}
              onChange={(e) =>
                setFormData({ ...formData, location_address: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-mid rounded focus:outline-none focus:ring-2 focus:ring-accent bg-neutral-mid text-white placeholder-neutral-light"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-accent text-primary font-bold py-2 rounded hover:bg-secondary hover:text-white transition duration-200"
          >
            Create Shop
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShopRegister;
