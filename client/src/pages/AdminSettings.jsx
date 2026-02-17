import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const AdminSettings = () => {
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({
    name: "",
    start_time: "",
    end_time: "",
    cutoff_time: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const res = await api.get("/admin/slots");
      setSlots(res.data);
    } catch (error) {
      toast.error("Failed to fetch slots");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/slots", newSlot);
      toast.success("Slot added successfully");
      setNewSlot({ name: "", start_time: "", end_time: "", cutoff_time: "" });
      fetchSlots();
    } catch (error) {
      toast.error("Failed to add slot");
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm("Delete this slot?")) return;
    try {
      await api.delete(`/admin/slots/${id}`);
      toast.success("Slot deleted");
      fetchSlots();
    } catch (error) {
      toast.error("Failed to delete slot");
    }
  };

  return (
    <div className="p-8 bg-primary min-h-screen text-primary-text">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">System Configuration</h1>
        <Link to="/admin/dashboard" className="text-accent hover:underline">
          ← Back to Dashboard
        </Link>
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

      {/* TODO: Add Global Config Section (Fees, Commissions) if needed */}
    </div>
  );
};

export default AdminSettings;
