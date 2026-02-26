import { useState, useEffect } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ProductCard from "./ProductCard";

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [shopId, setShopId] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    is_available: true,
    stock_quantity: 0,
    images: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [pendingImages, setPendingImages] = useState([]);

  const [productDiscount, setProductDiscount] = useState({
    enabled: false,
    type: "PERCENTAGE",
    value: "",
  });

  // Offer Modal State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerData, setOfferData] = useState({
    name: "",
    type: "PERCENTAGE",
    value: "",
    max_discount_amount: "",
    min_order_value: "",
    target_type: "SHOP",
    target_id: "",
    target_name: "Entire Store",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, shopRes, discRes] = await Promise.all([
        api.get("/products"),
        api.get("/shop/my-shop"),
        api.get("/discounts"),
      ]);
      setProducts(prodRes.data);
      if (shopRes.data) {
        setShopId(shopRes.data.id);
      }
      setDiscounts(discRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  // --- Product Management Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    let payload = { ...newProduct };
    if (parseInt(payload.stock_quantity) > 0) {
      payload.is_available = true;
    }

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.success("Product updated");
        setEditingId(null);
      } else {
        const res = await api.post("/products", payload);
        const newProductId = res.data.id;
        toast.success("Product added");

        if (productDiscount.enabled && productDiscount.value) {
          try {
            await api.post("/discounts", {
              name: `Launch Offer - ${payload.name}`,
              type: productDiscount.type,
              value: parseFloat(productDiscount.value),
              target_type: "PRODUCT",
              target_id: newProductId,
            });
          } catch (err) {
            toast.error("Product added, but failed to create discount.");
          }
        }

        if (pendingImages.length > 0) {
          const formData = new FormData();
          pendingImages.forEach((f) => formData.append("images", f));
          const toastId = toast.loading("Uploading images...");
          try {
            await api.post(`/products/${newProductId}/images`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Images uploaded!", { id: toastId });
          } catch (uploadErr) {
            console.error(uploadErr);
            toast.error("Product created but image upload failed", {
              id: toastId,
            });
          }
        }
      }
      setNewProduct({
        name: "",
        price: "",
        description: "",
        is_available: true,
        stock_quantity: 0,
        images: [],
      });
      setPendingImages([]);
      setProductDiscount({ enabled: false, type: "PERCENTAGE", value: "" });
      fetchData();
    } catch (error) {
      toast.error(editingId ? "Failed to update" : "Failed to add product");
    }
  };

  const handleEdit = (product) => {
    let imgs = [];
    if (Array.isArray(product.images)) imgs = product.images;
    else if (typeof product.images === "string") {
      try {
        imgs = JSON.parse(product.images);
      } catch (e) {
        imgs = [product.images];
      }
    } else if (product.image_url) {
      imgs = [product.image_url];
    }

    setNewProduct({
      name: product.name,
      price: product.price,
      description: product.description,
      is_available: product.is_available,
      stock_quantity: product.stock_quantity || 0,
      images: imgs,
    });
    setEditingId(product.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setNewProduct({
      name: "",
      price: "",
      description: "",
      is_available: true,
      stock_quantity: 0,
      images: [],
    });
    setEditingId(null);
    setProductDiscount({ enabled: false, type: "PERCENTAGE", value: "" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const toggleAvailability = async (product) => {
    const newStatus = !product.is_available;
    const updateData = {
      is_available: newStatus,
      name: product.name,
      price: product.price,
      stock_quantity: product.stock_quantity,
    };
    if (newStatus === false) updateData.stock_quantity = 0;

    try {
      await api.put(`/products/${product.id}`, updateData);
      fetchData();
      toast.success(
        newStatus
          ? "Product marked In Stock"
          : "Product marked Out of Stock (Qty reset to 0)",
      );
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // --- Discount Management Logic ---
  const openStoreOfferModal = () => {
    setOfferData({
      name: "",
      type: "PERCENTAGE",
      value: "",
      max_discount_amount: "",
      min_order_value: "",
      target_type: "SHOP",
      target_id: shopId,
      target_name: "Entire Store",
    });
    setShowOfferModal(true);
  };

  const openProductOfferModal = (product) => {
    setOfferData({
      name: "",
      type: "PERCENTAGE",
      value: "",
      max_discount_amount: "",
      min_order_value: "",
      target_type: "PRODUCT",
      target_id: product.id,
      target_name: product.name,
    });
    setShowOfferModal(true);
  };

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: offerData.name,
        type: offerData.type,
        value: parseFloat(offerData.value),
        max_discount_amount: offerData.max_discount_amount
          ? parseFloat(offerData.max_discount_amount)
          : null,
        min_order_value: offerData.min_order_value
          ? parseFloat(offerData.min_order_value)
          : null,
        target_type: offerData.target_type,
        target_id: offerData.target_id || null,
      };

      if (offerData.id) {
        await api.put(`/discounts/${offerData.id}`, payload);
        toast.success("Offer updated!");
      } else {
        await api.post("/discounts", payload);
        toast.success("Offer published!");
      }

      setShowOfferModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create offer");
    }
  };

  const handleToggleOffer = async (id) => {
    try {
      await api.put(`/discounts/${id}/toggle`);
      toast.success("Offer status updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update offer");
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm("Delete this promotional offer?")) return;
    try {
      await api.delete(`/discounts/${id}`);
      toast.success("Offer deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete offer");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-dark/40 backdrop-blur-xl p-6 rounded-3xl border border-neutral-mid shadow-lg">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Products & Offers
          </h1>
          <p className="text-neutral-light text-sm mt-1">
            Manage your catalog and drive sales with discounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openStoreOfferModal}
            className="bg-linear-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent text-primary px-4 py-2.5 rounded-xl font-bold shadow-[0_4px_14px_rgba(0,229,255,0.3)] transition-all active:scale-[0.98] flex items-center gap-2 text-sm"
          >
            <span>🏷️</span> Create Store Offer
          </button>
          <Link
            to="/shop/bulk-upload"
            className="bg-neutral-mid text-white hover:bg-neutral-light/50 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm font-bold border border-neutral-light/20"
          >
            <span>📤</span> Bulk Upload
          </Link>
        </div>
      </div>

      {/* 2. Active Offers Dashboard (Horizontal Scroll) */}
      {discounts.length > 0 && (
        <div className="bg-neutral-dark/30 border border-neutral-mid rounded-3xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-accent">🏷️</span> Active Promotional Offers
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x custom-scrollbar">
            {discounts.map((rule) => (
              <div
                key={rule.id}
                className="min-w-[280px] bg-primary/40 border border-neutral-mid rounded-2xl p-5 flex flex-col snap-start relative group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3
                    className="font-bold text-white max-w-[180px] truncate"
                    title={rule.name}
                  >
                    {rule.name}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${rule.is_active ? "bg-green-500/20 text-green-400" : "bg-neutral-mid text-neutral-400"}`}
                  >
                    {rule.is_active ? "Live" : "Paused"}
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-accent mb-1">
                  {rule.type === "PERCENTAGE"
                    ? `${rule.value}% OFF`
                    : `₹${rule.value} OFF`}
                </div>
                <div className="text-xs text-neutral-400 font-medium mb-4 flex-1">
                  {rule.target_type === "SHOP"
                    ? "Applies to Entire Store"
                    : "Product Specific"}
                  {rule.min_order_value && ` • Min: ₹${rule.min_order_value}`}
                </div>
                <div className="flex gap-2 mt-auto pt-4 border-t border-neutral-mid/50">
                  <button
                    onClick={() => {
                      setOfferData({
                        id: rule.id,
                        name: rule.name,
                        type: rule.type,
                        value: rule.value,
                        max_discount_amount: rule.max_discount_amount || "",
                        min_order_value: rule.min_order_value || "",
                        target_type: rule.target_type,
                        target_id: rule.target_id,
                        target_name:
                          rule.target_type === "SHOP"
                            ? "Entire Store"
                            : "Product Specific",
                      });
                      setShowOfferModal(true);
                    }}
                    className="flex-1 bg-accent/10 hover:bg-accent/20 text-accent text-xs py-2 rounded-lg font-bold transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleOffer(rule.id)}
                    className="flex-1 bg-neutral-mid hover:bg-neutral-light/20 text-white text-xs py-2 rounded-lg font-bold transition-all"
                  >
                    {rule.is_active ? "Pause" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDeleteOffer(rule.id)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-2 rounded-lg transition-all"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Add/Edit Product Form */}
      <div className="bg-neutral-dark/40 backdrop-blur-xl border border-neutral-mid p-6 rounded-3xl relative overflow-hidden">
        {editingId && (
          <div className="absolute top-0 right-0 bg-warning text-primary text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-md">
            EDITING MODE
          </div>
        )}
        <h2 className="text-xl font-bold text-white mb-6">
          {editingId ? "Edit Product Details" : "Add New Product"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start"
        >
          <div className="md:col-span-2 space-y-4">
            <input
              type="text"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              className="w-full bg-neutral-dark border border-neutral-mid text-white p-3 rounded-xl focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
              maxLength={100}
              required
            />
            <textarea
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
              className="w-full bg-neutral-dark border border-neutral-mid text-white p-3 rounded-xl focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none resize-none h-24"
              maxLength={1000}
            />
          </div>

          <div className="md:col-span-3 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Price (₹)"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
                className="w-full bg-neutral-dark border border-neutral-mid text-white p-3 rounded-xl focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
                min="0"
                step="0.01"
                required
              />
              <input
                type="number"
                placeholder="Stock Qty"
                value={newProduct.stock_quantity}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    stock_quantity: e.target.value,
                  })
                }
                className="w-full bg-neutral-dark border border-neutral-mid text-white p-3 rounded-xl focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
                min="0"
                required
              />
            </div>

            {/* Image Upload Section */}
            <div className="bg-primary/30 border border-neutral-mid/50 p-4 rounded-xl">
              <h3 className="text-white text-sm font-bold mb-3">
                {editingId ? "Current Images (Max 2)" : "Upload Images (Max 2)"}
              </h3>

              {/* Editing Existing Images */}
              {editingId && (
                <div className="flex gap-4 mb-4">
                  {newProduct.images.map((img, idx) => (
                    <div key={idx} className="relative group w-20 h-20">
                      <img
                        src={`http://localhost:3001${img}`}
                        alt="Product"
                        className="w-full h-full object-cover rounded-lg border border-neutral-mid"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm("Delete image?")) return;
                          try {
                            const res = await api.delete(
                              `/products/${editingId}/images`,
                              { data: { imageUrl: img } },
                            );
                            setNewProduct((prev) => ({
                              ...prev,
                              images: res.data.images,
                            }));
                            toast.success("Image deleted");
                          } catch (err) {
                            toast.error("Failed to delete image");
                          }
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity border border-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Adding Images */}
              {(!editingId || newProduct.images.length < 2) && (
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files);
                      if (files.length === 0) return;

                      if (editingId) {
                        if (newProduct.images.length + files.length > 2) {
                          toast.error(
                            `Max 2 images allowed. You have ${newProduct.images.length}.`,
                          );
                          return;
                        }
                        const formData = new FormData();
                        files.forEach((f) => formData.append("images", f));
                        const toastId = toast.loading("Uploading...");
                        try {
                          const res = await api.post(
                            `/products/${editingId}/images`,
                            formData,
                            {
                              headers: {
                                "Content-Type": "multipart/form-data",
                              },
                            },
                          );
                          setNewProduct((prev) => ({
                            ...prev,
                            images: res.data.images,
                          }));
                          toast.success("Uploaded!", { id: toastId });
                        } catch (err) {
                          toast.error("Upload failed", { id: toastId });
                        }
                      } else {
                        if (files.length > 2) {
                          toast.error("Max 2 images allowed");
                          e.target.value = "";
                          setPendingImages([]);
                          return;
                        }
                        setPendingImages(files);
                      }
                    }}
                    className="block w-full text-sm text-neutral-light file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-neutral-mid file:text-white hover:file:bg-neutral-light/20 cursor-pointer"
                  />
                  {pendingImages.length > 0 && (
                    <p className="text-xs text-accent mt-1">
                      {pendingImages.length} image(s) queued for upload
                    </p>
                  )}
                  <p className="text-xs text-neutral-500">
                    Auto-compressed to 150KB WebP format
                  </p>
                </div>
              )}
            </div>

            {/* Inline Discount Creation */}
            {!editingId && (
              <div className="bg-primary/30 border border-neutral-mid/50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="addDiscount"
                    checked={productDiscount.enabled}
                    onChange={(e) =>
                      setProductDiscount({
                        ...productDiscount,
                        enabled: e.target.checked,
                      })
                    }
                    className="accent-accent w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor="addDiscount"
                    className="text-white text-sm font-bold cursor-pointer"
                  >
                    Launch with Promotional Offer
                  </label>
                </div>
                {productDiscount.enabled && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <select
                      value={productDiscount.type}
                      onChange={(e) =>
                        setProductDiscount({
                          ...productDiscount,
                          type: e.target.value,
                        })
                      }
                      className="w-full bg-neutral-dark border border-neutral-mid text-white p-2 rounded-xl focus:ring-1 focus:ring-accent outline-none"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Flat Rate (₹)</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Discount Value"
                      value={productDiscount.value}
                      onChange={(e) =>
                        setProductDiscount({
                          ...productDiscount,
                          value: e.target.value,
                        })
                      }
                      className="w-full bg-neutral-dark border border-neutral-mid text-white p-2 rounded-xl focus:ring-1 focus:ring-accent outline-none"
                      min="0.01"
                      required={productDiscount.enabled}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className={`flex-1 font-bold px-6 py-3 rounded-xl transition-all shadow-md active:scale-[0.98] ${editingId ? "bg-warning hover:bg-orange-400 text-primary" : "bg-neutral-light hover:bg-white text-primary"}`}
              >
                {editingId ? "Update Product" : "Publish Product"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-neutral-dark border border-neutral-mid hover:bg-neutral-mid text-white px-6 py-3 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* 4. Product Catalog */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
          Your Catalog
          <span className="text-sm font-normal text-neutral-500 bg-neutral-dark px-3 py-1 rounded-full border border-neutral-mid">
            {products.length} Items
          </span>
        </h2>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-neutral-dark/20 rounded-3xl border border-dashed border-neutral-mid/50">
            <div className="text-6xl mb-4 opacity-50">🛍️</div>
            <p className="text-neutral-light text-lg font-bold">
              Your store is empty.
            </p>
            <p className="text-sm text-neutral-500 mt-2">
              Add your first product above to start selling.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const activeDiscount = discounts.find(
                (d) =>
                  d.target_type === "PRODUCT" &&
                  d.target_id === product.id &&
                  d.is_active,
              );
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  isShopkeeper={true}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={toggleAvailability}
                  onAddDiscount={openProductOfferModal}
                  activeDiscount={activeDiscount}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Offer */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-dark border border-neutral-mid w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-neutral-mid/40 p-6 border-b border-neutral-mid flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-accent">🏷️</span> Create Offer
              </h2>
              <button
                onClick={() => setShowOfferModal(false)}
                className="text-neutral-400 hover:text-white transition-colors p-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="bg-primary/50 border border-neutral-mid rounded-xl p-4 flex items-center gap-4 mb-6">
                <div className="bg-accent/10 p-3 rounded-full text-accent">
                  🎯
                </div>
                <div>
                  <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                    Target Audience
                  </p>
                  <p className="text-white font-bold text-lg">
                    {offerData.target_name}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveOffer} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400 block mb-1">
                    Offer Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Clearance Sale 20%"
                    value={offerData.name}
                    onChange={(e) =>
                      setOfferData({ ...offerData, name: e.target.value })
                    }
                    className="w-full bg-primary/50 border border-neutral-mid text-white p-3 rounded-xl focus:ring-1 focus:ring-accent outline-none"
                    maxLength={50}
                    minLength={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1">
                      Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={offerData.type}
                      onChange={(e) =>
                        setOfferData({ ...offerData, type: e.target.value })
                      }
                      className="w-full bg-primary/50 border border-neutral-mid text-white p-3 rounded-xl focus:ring-1 focus:ring-accent outline-none"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Flat Rate (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1">
                      Value <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={
                        offerData.type === "PERCENTAGE" ? "e.g. 10" : "e.g. 100"
                      }
                      value={offerData.value}
                      onChange={(e) =>
                        setOfferData({ ...offerData, value: e.target.value })
                      }
                      className="w-full bg-primary/50 border border-neutral-mid text-white p-3 rounded-xl focus:ring-1 focus:ring-accent outline-none"
                      min="0.01"
                      required
                    />
                  </div>
                </div>

                {offerData.type === "PERCENTAGE" && (
                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1">
                      Max Discount Cap (₹) - Optional
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Maximum amount to discount"
                      value={offerData.max_discount_amount}
                      onChange={(e) =>
                        setOfferData({
                          ...offerData,
                          max_discount_amount: e.target.value,
                        })
                      }
                      className="w-full bg-primary/50 border border-neutral-mid text-white p-3 rounded-xl focus:ring-1 focus:ring-accent outline-none"
                      min="0"
                    />
                  </div>
                )}

                {offerData.target_type === "SHOP" && (
                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1">
                      Minimum Order Value (₹) - Storewide Only
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Cart minimum amount"
                      value={offerData.min_order_value}
                      onChange={(e) =>
                        setOfferData({
                          ...offerData,
                          min_order_value: e.target.value,
                        })
                      }
                      className="w-full bg-primary/50 border border-neutral-mid text-white p-3 rounded-xl focus:ring-1 focus:ring-accent outline-none"
                    />
                  </div>
                )}

                <div className="pt-4 mt-2 border-t border-neutral-mid flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowOfferModal(false)}
                    className="px-6 py-3 rounded-xl font-bold text-white bg-neutral-mid hover:bg-neutral-mid/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-accent text-primary px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] active:scale-[0.98] transition-all"
                  >
                    {offerData.id ? "Save Changes" : "Launch Offer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles appended globally just for this container */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(51, 51, 51, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 229, 255, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 229, 255, 0.8); }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `,
        }}
      />
    </div>
  );
};

export default ProductManager;
