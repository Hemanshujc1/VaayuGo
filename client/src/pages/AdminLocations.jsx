import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const AdminLocations = () => {
  const [locations, setLocations] = useState([]);
  const [newLocationName, setNewLocationName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await api.get("/public/locations");
      setLocations(res.data);
    } catch (error) {
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocationName.trim()) return;
    try {
      await api.post("/admin/locations", { name: newLocationName });
      toast.success("Location added successfully");
      setNewLocationName("");
      fetchLocations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add location");
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
            Locations Management
          </h1>
          <p className="text-neutral-light mt-2 text-sm max-w-xl">
            Configure the operational zones. Adding a location allows shops and
            customers to select it during registration and checkout.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ADD LOCATION CARD */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-dark/50 backdrop-blur-xl p-6 rounded-2xl border border-neutral-mid/60 shadow-xl relative overflow-hidden group">
            {/* Top accent line */}
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
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              Add New Region
            </h2>
            <form onSubmit={handleAddLocation} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  Location Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Navsari, Surat"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    className="w-full bg-primary/80 border border-neutral-mid rounded-xl p-3.5 pl-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-linear-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent text-primary font-bold px-6 py-3.5 rounded-xl shadow-[0_4px_14px_rgba(var(--color-accent),0.3)] hover:shadow-[0_6px_20px_rgba(var(--color-accent),0.4)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
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
                Create Location
              </button>
            </form>
          </div>
        </div>

        {/* LOCATIONS LIST CARD */}
        <div className="lg:col-span-2">
          <div className="bg-neutral-dark/40 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-neutral-mid/50 shadow-xl h-full flex flex-col">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 pb-4 border-b border-neutral-mid/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-neutral-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
              Active Zones
              <span className="ml-2 bg-neutral-mid/50 text-neutral-300 text-xs py-1 px-3 rounded-full border border-neutral-mid">
                {locations.length}
              </span>
            </h3>

            <div className="flex-1">
              {locations.length === 0 ? (
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-neutral-400 font-medium text-lg">
                    No locations configured
                  </p>
                  <p className="text-neutral-500 text-sm mt-1 text-center">
                    Add your first operational zone from the panel.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max">
                  {locations.map((loc) => (
                    <div
                      key={loc.id}
                      className="group bg-primary/40 border border-neutral-mid/50 hover:border-accent/40 p-4 rounded-xl flex items-center gap-3 transition-all duration-300 hover:shadow-[0_4px_15px_rgba(var(--color-accent),0.1)] hover:-translate-y-1"
                    >
                      <div className="w-10 h-10 shrink-0 rounded-full bg-neutral-dark border border-neutral-mid/50 flex items-center justify-center text-accent group-hover:bg-accent/10 transition-colors duration-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span
                        className="text-white font-medium truncate flex-1"
                        title={loc.name}
                      >
                        {loc.name}
                      </span>
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

export default AdminLocations;
