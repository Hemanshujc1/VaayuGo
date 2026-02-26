import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ShopProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCatIds, setSelectedCatIds] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    address: "",
    shopName: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, shopRes, catRes] = await Promise.all([
          api.get("/auth/me").catch(() => null),
          api.get("/shop/my-shop").catch(() => null),
          api.get("/public/categories").catch(() => []),
        ]);
        if (profileRes && profileRes.data) {
          setProfile(profileRes.data);
          setFormData((prev) => ({
            ...prev,
            name: profileRes.data.name,
            mobile_number: profileRes.data.mobile_number,
            address: profileRes.data.address,
          }));
        }
        if (shopRes && shopRes.data) {
          setShop(shopRes.data);
          setSelectedCatIds((shopRes.data.Categories || []).map((c) => c.id));
          setFormData((prev) => ({
            ...prev,
            shopName: shopRes.data.name,
          }));
        }
        if (catRes && catRes.data) setCategories(catRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    const toastId = toast.loading("Updating profile...");
    try {
      await api.put("/auth/profile", {
        ...formData,
        categoryIds: selectedCatIds,
      });
      toast.success("Profile updated successfully", { id: toastId });
      setIsEditing(false);

      // Refresh data
      const [profileRes, shopRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/shop/my-shop"),
      ]);
      setProfile(profileRes.data);
      setShop(shopRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile", {
        id: toastId,
      });
    }
  };

  const toggleCategory = (id) => {
    if (selectedCatIds.includes(id)) {
      setSelectedCatIds(selectedCatIds.filter((cid) => cid !== id));
    } else {
      setSelectedCatIds([...selectedCatIds, id]);
    }
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="text-primary-text max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">My Shop Profile</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded font-bold text-sm transition-all ${
            isEditing
              ? "bg-neutral-mid text-white hover:bg-neutral-light/20"
              : "bg-accent text-primary hover:bg-white"
          }`}
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {/* User Info Card */}
      <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid mb-8">
        <h2 className="text-xl font-bold mb-4 text-white border-b border-neutral-mid pb-2">
          Account Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-neutral-light text-sm block">Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-primary/30 border border-neutral-mid rounded px-3 py-1.5 text-white focus:outline-none focus:border-accent mt-1"
                maxLength={50}
              />
            ) : (
              <p className="text-white font-medium">
                {profile?.name || user?.name}
              </p>
            )}
          </div>
          <div>
            <label className="text-neutral-light text-sm block">Email</label>
            <p className="text-white font-medium">
              {profile?.email || user?.email}
            </p>
          </div>
          <div>
            <label className="text-neutral-light text-sm block">Role</label>
            <p className="text-white font-medium capitalize">
              {profile?.role || user?.role}
            </p>
          </div>
          <div>
            <label className="text-neutral-light text-sm block">
              Joined On
            </label>
            <p className="text-white font-medium">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-GB")
                : "N/A"}
            </p>
          </div>
          <div>
            <label className="text-neutral-light text-sm block">
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.mobile_number}
                onChange={(e) =>
                  setFormData({ ...formData, mobile_number: e.target.value })
                }
                className="w-full bg-primary/30 border border-neutral-mid rounded px-3 py-1.5 text-white focus:outline-none focus:border-accent mt-1"
                pattern="\d{10}"
                maxLength={10}
                minLength={10}
                title="Mobile number must be exactly 10 digits"
              />
            ) : (
              <p className="text-white font-medium">
                {profile?.mobile_number || "N/A"}
              </p>
            )}
          </div>
          <div>
            <label className="text-neutral-light text-sm block">Location</label>
            <p className="text-white font-medium">
              {profile?.location || "N/A"}
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="text-neutral-light text-sm block">
              Registered Address
            </label>
            {isEditing ? (
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full bg-primary/30 border border-neutral-mid rounded px-3 py-2 text-white focus:outline-none focus:border-accent mt-1 h-20 resize-none"
                maxLength={255}
              />
            ) : (
              <p className="text-white font-medium">
                {profile?.address || "N/A"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Shop Info Card */}
      <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
        <h2 className="text-xl font-bold mb-4 text-white border-b border-neutral-mid pb-2">
          Shop Details
        </h2>

        {shop ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {shop.image_url && (
                <img
                  src={`http://localhost:3001${shop.image_url}`}
                  alt={shop.name}
                  className="w-32 h-32 object-cover rounded border border-neutral-mid"
                />
              )}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-neutral-light text-sm block">
                    Shop Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.shopName}
                      onChange={(e) =>
                        setFormData({ ...formData, shopName: e.target.value })
                      }
                      className="w-full bg-primary/30 border border-neutral-mid rounded px-3 py-1.5 text-white focus:outline-none focus:border-accent mt-1"
                      maxLength={100}
                      minLength={3}
                    />
                  ) : (
                    <p className="text-white font-bold text-lg">{shop.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-neutral-light text-sm block mb-1">
                    Categories
                  </label>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5 p-3 bg-primary/30 rounded border border-neutral-mid/50">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                              selectedCatIds.includes(cat.id)
                                ? "bg-accent border-accent text-primary"
                                : "bg-neutral-mid border-neutral-light/10 text-neutral-light"
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(shop.Categories || []).length > 0 ? (
                        shop.Categories.map((cat) => (
                          <span
                            key={cat.id}
                            className="text-accent bg-neutral-mid px-2 py-1 rounded inline-block text-xs border border-neutral-mid"
                          >
                            {cat.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-neutral-light text-xs italic">
                          No categories assigned
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-neutral-light text-sm block">
                    Location
                  </label>
                  <p className="text-white">{shop.location_address || "N/A"}</p>
                </div>
                <div>
                  <label className="text-neutral-light text-sm block">
                    Status
                  </label>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold border ${
                      shop.status === "approved"
                        ? "bg-green-900/30 text-green-400 border-green-800"
                        : shop.status === "suspended"
                          ? "bg-red-900/30 text-red-400 border-red-800"
                          : "bg-yellow-900/30 text-yellow-400 border-yellow-800"
                    }`}
                  >
                    {shop.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-neutral-light text-sm block">
                    Open for Orders?
                  </label>
                  <span
                    className={shop.is_open ? "text-green-400" : "text-red-400"}
                  >
                    {shop.is_open
                      ? "Yes, currently open"
                      : "No, currently closed"}
                  </span>
                </div>
                <div>
                  <label className="text-neutral-light text-sm block">
                    Shop Rating
                  </label>
                  <p className="text-white font-bold flex items-center gap-1">
                    <span className="text-warning">★</span>
                    {shop.rating != null && shop.rating > 0
                      ? shop.rating.toFixed(1)
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-neutral-light text-sm block">
                    Delivery Rating
                  </label>
                  <p className="text-white font-bold flex items-center gap-1">
                    <span className="text-warning">★</span>
                    {shop.delivery_rating != null && shop.delivery_rating > 0
                      ? shop.delivery_rating.toFixed(1)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 pt-6 border-t border-neutral-mid flex justify-end gap-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 rounded font-bold text-sm bg-neutral-mid text-white hover:bg-neutral-light/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-6 py-2 rounded font-bold text-sm bg-accent text-primary hover:bg-white transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                >
                  Save All Changes
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-neutral-light mb-4">No shop registered yet.</p>
            <a href="/shop/register" className="text-accent hover:underline">
              Register your shop now →
            </a>
          </div>
        )}
      </div>
      <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid mt-8">
        <h2 className="text-xl font-bold mb-4 text-white border-b border-neutral-mid pb-2">
          Shop Images
        </h2>

        {shop ? (
          <div>
            <div className="mb-6">
              <p className="text-neutral-light text-sm mb-2">
                Display Images (Max 5)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {(shop.images || (shop.image_url ? [shop.image_url] : [])).map(
                  (img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={`http://localhost:3001${img}`}
                        alt={`Shop ${idx}`}
                        className="w-full h-32 object-cover rounded border border-neutral-mid"
                      />
                      <button
                        onClick={async () => {
                          if (!window.confirm("Delete this image?")) return;
                          try {
                            const res = await api.delete("/shop/images", {
                              data: { imageUrl: img },
                            });
                            setShop((prev) => ({
                              ...prev,
                              images: res.data.images,
                              image_url: res.data.image_url,
                            }));
                            toast.success("Image deleted");
                          } catch (error) {
                            console.error(error);
                            toast.error("Failed to delete image");
                          }
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="border border-dashed border-neutral-mid p-6 rounded text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={async (e) => {
                  const files = Array.from(e.target.files);
                  const currentImageCount = (shop.images || []).length;
                  if (currentImageCount + files.length > 5) {
                    toast.error(
                      `You can only upload up to 5 images. You already have ${currentImageCount}.`,
                    );
                    return;
                  }
                  if (files.length === 0) return;

                  const formData = new FormData();
                  files.forEach((file) => formData.append("images", file));

                  const toastId = toast.loading("Uploading & Optimizing...");
                  try {
                    const res = await api.post("/shop/images", formData, {
                      headers: { "Content-Type": "multipart/form-data" },
                    });
                    setShop((prev) => ({
                      ...prev,
                      images: res.data.images,
                      image_url: res.data.images[0],
                    }));
                    toast.success(res.data.message, { id: toastId });
                  } catch (error) {
                    console.error(error);
                    toast.error(
                      error.response?.data?.message || "Upload failed",
                      { id: toastId },
                    );
                  }
                }}
                disabled={(shop.images || []).length >= 5}
                className="block w-full text-sm text-neutral-light file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-accent file:text-primary hover:file:bg-secondary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-neutral-light mt-2">
                {(shop.images || []).length >= 5
                  ? "Limit Reached (5/5). Delete images to upload more."
                  : "Max 5 images • Auto-resized to 800px • WebP Optimized"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-neutral-light">Register shop to upload images.</p>
        )}
      </div>
    </div>
  );
};

export default ShopProfile;
