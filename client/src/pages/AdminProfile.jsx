import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

const AdminProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    location: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, locationsRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/public/locations").catch(() => ({ data: [] })), // Fallback if no specific locations API
        ]);

        if (profileRes.data) {
          setProfile(profileRes.data);
          setFormData({
            name: profileRes.data.name || "",
            mobile_number: profileRes.data.mobile_number || "",
            location: profileRes.data.location || "",
          });
        }

        if (locationsRes && locationsRes.data) {
          setLocations(locationsRes.data);
        }
      } catch (err) {
        console.error("Failed to load admin profile data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    const toastId = toast.loading("Updating admin profile...");
    try {
      await api.put("/auth/profile", formData);
      toast.success("Profile updated successfully", { id: toastId });
      setIsEditing(false);

      const res = await api.get("/auth/me");
      setProfile(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile", {
        id: toastId,
      });
    }
  };

  if (loading)
    return <div className="text-white text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Profile</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded font-bold text-sm transition-all ${
            isEditing
              ? "bg-neutral-mid text-white"
              : "bg-accent text-primary hover:bg-white"
          }`}
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      <div className="bg-neutral-dark p-8 rounded shadow border border-neutral-mid">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Profile Avatar */}
          <div className="w-32 h-32 rounded-full bg-accent flex items-center justify-center text-primary text-5xl font-bold border-4 border-neutral-mid shrink-0">
            {profile?.name?.charAt(0).toUpperCase() || "A"}
          </div>

          {/* Profile Details */}
          <div className="flex-1 space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-neutral-light text-sm mb-1 uppercase tracking-wider font-semibold">
                  Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full text-white text-lg font-medium p-3 bg-primary/30 rounded border border-neutral-mid focus:outline-none focus:border-accent"
                  />
                ) : (
                  <div className="text-white text-lg font-medium p-3 bg-primary/50 rounded border border-neutral-mid">
                    {profile?.name || "N/A"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-neutral-light text-sm mb-1 uppercase tracking-wider font-semibold">
                  Email Address
                </label>
                <div className="text-white/60 text-lg font-medium p-3 bg-primary/30 rounded border border-neutral-mid cursor-not-allowed">
                  {profile?.email || "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-neutral-light text-sm mb-1 uppercase tracking-wider font-semibold">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.mobile_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mobile_number: e.target.value,
                      })
                    }
                    className="w-full text-white text-lg font-medium p-3 bg-primary/30 rounded border border-neutral-mid focus:outline-none focus:border-accent"
                  />
                ) : (
                  <div className="text-white text-lg font-medium p-3 bg-primary/50 rounded border border-neutral-mid">
                    {profile?.mobile_number || "N/A"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-neutral-light text-sm mb-1 uppercase tracking-wider font-semibold">
                  Location
                </label>
                {isEditing ? (
                  <select
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full text-white text-lg font-medium p-3 bg-primary/30 rounded border border-neutral-mid focus:outline-none focus:border-accent appearance-none"
                  >
                    <option value="" className="bg-primary">
                      Select Location
                    </option>
                    {locations.map((loc) => (
                      <option
                        key={loc.id}
                        value={loc.name}
                        className="bg-primary"
                      >
                        {loc.name}
                      </option>
                    ))}
                    {!locations.some((l) => l.name === formData.location) &&
                      formData.location && (
                        <option
                          value={formData.location}
                          className="bg-primary"
                        >
                          {formData.location}
                        </option>
                      )}
                  </select>
                ) : (
                  <div className="text-white text-lg font-medium p-3 bg-primary/50 rounded border border-neutral-mid">
                    {profile?.location || "N/A"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-neutral-light text-sm mb-1 uppercase tracking-wider font-semibold">
                  Joined On
                </label>
                <div className="text-white text-lg font-medium p-3 bg-primary/50 rounded border border-neutral-mid">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("en-GB")
                    : "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-neutral-light text-sm mb-1 uppercase tracking-wider font-semibold">
                  Role
                </label>
                <div className="text-accent font-bold p-3 bg-primary/50 rounded border border-neutral-mid capitalize">
                  {profile?.role || "Admin"}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="pt-6 border-t border-neutral-mid flex justify-end gap-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 rounded font-bold bg-neutral-mid text-white hover:bg-neutral-light"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-8 py-2 rounded font-bold bg-accent text-primary hover:bg-white shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                >
                  Save Profile Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
