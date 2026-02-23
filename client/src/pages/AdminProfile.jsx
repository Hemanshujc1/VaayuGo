import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const AdminProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to load admin profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading)
    return <div className="text-white text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Profile</h1>

      <div className="bg-neutral-dark p-8 rounded shadow border border-neutral-mid">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Profile Avatar */}
          <div className="w-32 h-32 rounded-full bg-accent flex items-center justify-center text-primary text-5xl font-bold border-4 border-neutral-mid">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>

          {/* Profile Details */}
          <div className="flex-1 space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-neutral-light text-sm mb-1">
                  Name
                </label>
                <div className="text-white text-lg font-medium p-3 bg-primary/50 rounded border border-neutral-mid">
                  {profile?.name || user?.name || "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-neutral-light text-sm mb-1">
                  Email Address
                </label>
                <div className="text-white text-lg font-medium p-3 bg-primary/50 rounded border border-neutral-mid">
                  {profile?.email || user?.email || "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-neutral-light text-sm mb-1">
                  Phone Number
                </label>
                <div className="text-white text-lg font-medium p-3 bg-primary/50 rounded border border-neutral-mid">
                  {profile?.mobile_number || "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-neutral-light text-sm mb-1">
                  Location
                </label>
                <div className="text-white text-lg font-medium p-3 bg-primary/50 rounded border border-neutral-mid">
                  {profile?.location || "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-neutral-light text-sm mb-1">
                  Joined On
                </label>
                <div className="text-white text-lg font-medium p-3 bg-primary/50 rounded border border-neutral-mid">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("en-GB")
                    : "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-neutral-light text-sm mb-1">
                  Role
                </label>
                <div className="text-accent font-bold p-3 bg-primary/50 rounded border border-neutral-mid capitalize">
                  {profile?.role || user?.role || "Admin"}
                </div>
              </div>

              <div>
                <label className="block text-neutral-light text-sm mb-1">
                  Account Status
                </label>
                <div className="text-success font-bold p-3 bg-primary/50 rounded border border-neutral-mid">
                  Active
                </div>
              </div>
            </div>

            {/* Account Actions Section (Placeholder) */}
            <div className="pt-6 border-t border-neutral-mid">
              <h3 className="text-white font-bold mb-4">Account Actions</h3>
              <div className="flex gap-4">
                <button className="px-4 py-2 bg-neutral-mid text-white rounded hover:bg-neutral-light transition-colors">
                  Change Password
                </button>
                {/* Add more actions if needed */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
