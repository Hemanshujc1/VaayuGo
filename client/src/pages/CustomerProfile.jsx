import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../api/axios";

const CustomerProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        setProfile(res.data);
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
        <h1 className="text-4xl font-extrabold text-white mb-8">My Profile</h1>

        <div className="bg-neutral-dark rounded-2xl shadow-xl overflow-hidden border border-neutral-light/20">
          <div className="bg-linear-to-r from-primary to-accent px-8 py-10 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            <div className="relative z-10 flex items-center space-x-6">
              <div className="h-24 w-24 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center text-4xl font-bold uppercase shadow-lg">
                {user.username ? user.username.charAt(0) : "U"}
              </div>
              <div>
                <h2 className="text-3xl font-bold">
                  {profile?.name || user.username || "Customer"}
                </h2>
                <p className="text-white/80 font-medium text-lg mt-1">
                  {user.email}
                </p>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-sm font-semibold border border-white/30">
                  {user.role
                    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
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
                  <p className="text-lg font-medium text-white">
                    {profile?.name || user.username || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-light mb-1 uppercase tracking-wider">
                    Email Address
                  </p>
                  <p className="text-lg font-medium text-white">
                    {user.email || "N/A"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-light mb-1 uppercase tracking-wider">
                    Account Role
                  </p>
                  <p className="text-lg font-medium text-white capitalize">
                    {user.role || "Customer"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-light mb-1 uppercase tracking-wider">
                    Mobile Number
                  </p>
                  <p className="text-lg font-medium text-white">
                    {profile?.mobile_number || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-light mb-1 uppercase tracking-wider">
                    Location
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
                  <p className="text-lg font-medium text-white wrap-break-words">
                    {profile?.address || "N/A"}
                  </p>
                </div>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
