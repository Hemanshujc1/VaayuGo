import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const AdminDeliverySlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({
    name: "",
    start_time: "",
    end_time: "",
    cutoff_time: "",
  });

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
            Delivery Slots Management
          </h1>
          <p className="text-neutral-light mt-2 text-sm max-w-xl">
            Configure the daily time windows for deliveries. These slots
            determine when orders can be fulfilled.
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

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* ADD SLOT FORM */}
        <div className="xl:col-span-2">
          <div className="bg-neutral-dark/50 backdrop-blur-xl p-6 rounded-2xl border border-neutral-mid/60 shadow-xl relative overflow-hidden group h-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-accent to-blue-500 opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>

            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-accent"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              Create New Slot
            </h2>

            <form onSubmit={handleAddSlot} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  Slot Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lunch (12 PM - 3 PM)"
                  value={newSlot.name}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, name: e.target.value })
                  }
                  className="w-full bg-primary/80 border border-neutral-mid rounded-xl p-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, start_time: e.target.value })
                  }
                  className="w-full bg-primary/80 border border-neutral-mid rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300 scheme-dark"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, end_time: e.target.value })
                  }
                  className="w-full bg-primary/80 border border-neutral-mid rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300 scheme-dark"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  Cutoff Time
                </label>
                <input
                  type="time"
                  value={newSlot.cutoff_time}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, cutoff_time: e.target.value })
                  }
                  className="w-full bg-primary-80 border border-neutral-mid rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300 scheme-dark"
                  required
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Orders cannot be placed for this slot after the cutoff.
                </p>
              </div>

              <button
                type="submit"
                className="mt-4 w-full bg-linear-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent text-primary font-bold px-6 py-3.5 rounded-xl shadow-[0_4px_14px_rgba(var(--color-accent),0.3)] hover:shadow-[0_6px_20px_rgba(var(--color-accent),0.4)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Slot
              </button>
            </form>
          </div>
        </div>

        {/* SLOTS LIST */}
        <div className="xl:col-span-3">
          <div className="bg-neutral-dark/40 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-neutral-mid/50 shadow-xl h-full flex flex-col">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 pb-4 border-b border-neutral-mid/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-neutral-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Active Delivery Shifts
              <span className="ml-2 bg-neutral-mid/50 text-neutral-300 text-xs py-1 px-3 rounded-full border border-neutral-mid">
                {slots.length}
              </span>
            </h3>

            <div className="flex-1">
              {slots.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 h-full border-2 border-dashed border-neutral-mid/50 rounded-xl bg-primary/20">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-neutral-400 font-medium text-lg">
                    No delivery slots configured
                  </p>
                  <p className="text-neutral-500 text-sm mt-1 text-center">
                    Add operational shifts from the panel.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 auto-rows-max">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="group relative bg-primary/40 border border-neutral-mid/50 hover:border-accent/40 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-accent/5 hover:-translate-y-1 flex flex-col"
                    >
                      <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-white text-lg tracking-wide flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--color-accent),0.8)]"></span>
                            {slot.name}
                          </h4>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Delete Slot"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
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

                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full bg-neutral-dark flex items-center justify-center text-neutral-400">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-neutral-500 font-medium text-xs uppercase tracking-wider">
                                Shift Duration
                              </p>
                              <p className="text-neutral-200 font-semibold">
                                {slot.start_time} - {slot.end_time}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-accent/80 font-medium text-xs uppercase tracking-wider">
                                Order Cutoff
                              </p>
                              <p className="text-accent font-bold">
                                {slot.cutoff_time}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-neutral-dark/30 backdrop-blur-sm px-5 py-3 border-t border-neutral-mid/50 text-xs text-neutral-500 flex justify-between">
                        <span>ID: #{slot.id}</span>
                        <span className="group-hover:text-accent transition-colors">
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDeliverySlots;
