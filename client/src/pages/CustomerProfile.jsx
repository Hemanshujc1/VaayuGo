import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const CustomerProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    address: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");

        if (res.data) {
          setProfile(res.data);
          setFormData({
            name: res.data.name || "",
            mobile_number: res.data.mobile_number || "",
            address: res.data.address || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    const toastId = toast.loading("Updating profile...");
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

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)] bg-primary">
        <p className="text-xl font-medium text-neutral-light">
          Loading profile...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-white">My Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              isEditing
                ? "bg-neutral-mid text-white"
                : "bg-accent text-primary hover:scale-105"
            }`}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        <div className="bg-neutral-dark rounded-2xl shadow-xl overflow-hidden border border-neutral-light/20">
          <div className="bg-neutral-dark border-b border-neutral-light/10 px-8 py-10 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            <div className="relative z-10 flex items-center space-x-6">
              <div className="h-24 w-24 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center text-4xl font-bold uppercase shadow-lg">
                {profile?.name ? profile.name.charAt(0) : "U"}
              </div>
              <div>
                <h2 className="text-3xl font-bold">
                  {profile?.name || "Customer"}
                </h2>
                <p className="text-white/80 font-medium text-lg mt-1">
                  {profile?.email}
                </p>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-sm font-semibold border border-white/30">
                  {profile?.role
                    ? profile.role.charAt(0).toUpperCase() +
                      profile.role.slice(1)
                    : "Customer"}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h3 className="text-xl font-bold text-white border-b border-neutral-light/30 pb-4 mb-6">
              Account Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-light mb-1 uppercase tracking-wider">
                    Full Name
                  </p>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-primary/40 border border-neutral-light/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent mt-1"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-lg font-medium text-white">
                      {profile?.name || "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-light mb-1 uppercase tracking-wider">
                    Email Address
                  </p>
                  <p className="text-lg font-medium text-white">
                    {profile?.email || "N/A"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-light mb-1 uppercase tracking-wider">
                    Account Role
                  </p>
                  <p className="text-lg font-medium text-white capitalize">
                    {profile?.role || "Customer"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-light mb-1 uppercase tracking-wider">
                    Mobile Number
                  </p>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-primary/40 border border-neutral-light/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent mt-1"
                      value={formData.mobile_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mobile_number: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-lg font-medium text-white">
                      {profile?.mobile_number || "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-light mb-1 uppercase tracking-wider">
                    Location (Read-only)
                  </p>
                  <p className="text-lg font-medium text-white">
                    {profile?.location || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-neutral-light/30">
              <div className="grid grid-cols-1 gap-8">
                <div>
                  <p className="text-sm font-semibold text-neutral-light mb-1 uppercase tracking-wider">
                    Registered Address
                  </p>
                  {isEditing ? (
                    <textarea
                      className="w-full bg-primary/40 border border-neutral-light/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent mt-1 h-24 resize-none"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-lg font-medium text-white wrap-break-words">
                      {profile?.address || "N/A"}
                    </p>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex justify-end gap-4 pt-4">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 rounded-lg font-bold bg-neutral-mid text-white hover:bg-neutral-light/20"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-10 py-2 rounded-lg font-bold bg-accent text-primary hover:bg-white shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                    >
                      Save Profile
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-neutral-light mb-1 uppercase tracking-wider">
                      Actions
                    </p>
                    <Link
                      to="/my-orders"
                      className="inline-flex items-center text-accent hover:text-primary transition-colors font-semibold"
                    >
                      View My Orders &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
