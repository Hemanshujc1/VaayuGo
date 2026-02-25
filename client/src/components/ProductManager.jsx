import { useState, useEffect } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ProductCard from "./ProductCard";

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    is_available: true,
    stock_quantity: 0,
    images: [], // Store existing images
  });
  const [editingId, setEditingId] = useState(null);
  const [pendingImages, setPendingImages] = useState([]); // Images for new product

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Auto-update status based on stock
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

        // Upload pending images if any
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
      fetchProducts();
    } catch (error) {
      toast.error(editingId ? "Failed to update" : "Failed to add product");
    }
  };

  const handleEdit = (product) => {
    // Parse images if string
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
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const toggleAvailability = async (product) => {
    const newStatus = !product.is_available;
    const updateData = {
      is_available: newStatus,
      name: product.name,
      price: product.price, // Send required fields
      stock_quantity: product.stock_quantity, // Keep existing quantity by default
    };

    // If marking as Out of Stock, set quantity to 0
    if (newStatus === false) {
      updateData.stock_quantity = 0;
    }

    try {
      await api.put(`/products/${product.id}`, updateData);
      fetchProducts();
      toast.success(
        newStatus
          ? "Product marked In Stock"
          : "Product marked Out of Stock (Qty reset to 0)",
      );
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="mt-8 bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Product Management</h2>
        <Link
          to="/shop/bulk-upload"
          className="bg-neutral-mid text-white px-4 py-2 rounded-lg hover:bg-neutral-light transition-colors flex items-center gap-2 text-sm font-bold"
        >
          <span>📤</span>
          Bulk Upload
        </Link>
      </div>

      {/* Add/Edit Product Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-primary p-4 rounded border border-neutral-mid relative"
      >
        {editingId && (
          <div className="absolute -top-3 left-4 bg-accent text-primary text-xs font-bold px-2 py-1 rounded">
            EDITING MODE
          </div>
        )}
        <input
          type="text"
          placeholder="Product Name"
          value={newProduct.name}
          onChange={(e) =>
            setNewProduct({ ...newProduct, name: e.target.value })
          }
          className="border border-neutral-mid bg-neutral-mid text-white p-2 rounded focus:outline-none focus:ring-1 focus:ring-accent placeholder-neutral-light"
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={newProduct.price}
          onChange={(e) =>
            setNewProduct({ ...newProduct, price: e.target.value })
          }
          className="border border-neutral-mid bg-neutral-mid text-white p-2 rounded focus:outline-none focus:ring-1 focus:ring-accent placeholder-neutral-light"
          required
        />
        <input
          type="number"
          placeholder="Stock Qty"
          value={newProduct.stock_quantity}
          onChange={(e) =>
            setNewProduct({ ...newProduct, stock_quantity: e.target.value })
          }
          className="border border-neutral-mid bg-neutral-mid text-white p-2 rounded focus:outline-none focus:ring-1 focus:ring-accent placeholder-neutral-light"
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={newProduct.description}
          onChange={(e) =>
            setNewProduct({ ...newProduct, description: e.target.value })
          }
          className="border border-neutral-mid bg-neutral-mid text-white p-2 rounded focus:outline-none focus:ring-1 focus:ring-accent placeholder-neutral-light"
        />
        {/* Image Upload Section - Only in Edit Mode */}
        {editingId && (
          <div className="col-span-1 md:col-span-5 border-t border-neutral-mid pt-4 mt-2">
            <h3 className="text-white text-sm font-bold mb-2">
              Product Images (Max 2)
            </h3>

            <div className="flex flex-wrap gap-4 mb-4">
              {newProduct.images.map((img, idx) => (
                <div key={idx} className="relative group w-20 h-20">
                  <img
                    src={`http://localhost:3001${img}`}
                    alt="Product"
                    className="w-full h-full object-cover rounded border border-neutral-mid"
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
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {newProduct.images.length < 2 && (
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length === 0) return;

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
                          headers: { "Content-Type": "multipart/form-data" },
                        },
                      );
                      setNewProduct((prev) => ({
                        ...prev,
                        images: res.data.images,
                      }));
                      toast.success("Uploaded!", { id: toastId });
                    } catch (err) {
                      toast.error(
                        err.response?.data?.message || "Upload failed",
                        { id: toastId },
                      );
                    }
                  }}
                  className="block w-full text-sm text-neutral-light file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-neutral-dark file:text-white hover:file:bg-neutral-mid cursor-pointer"
                />
                <span className="text-xs text-neutral-light">
                  Max 150KB (Auto-compressed)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Image Entry for New Product (Not Editing) */}
        {!editingId && (
          <div className="col-span-1 md:col-span-5 pt-2 border-t border-neutral-mid mt-2">
            <label className="block text-white text-sm font-bold mb-2">
              Product Images (Max 2)
            </label>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  if (files.length > 2) {
                    toast.error("Max 2 images allowed");
                    e.target.value = ""; // clear input
                    setPendingImages([]);
                    return;
                  }
                  setPendingImages(files);
                }}
                className="block w-full text-sm text-neutral-light file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-neutral-dark file:text-white hover:file:bg-neutral-mid cursor-pointer"
              />
              {pendingImages.length > 0 && (
                <span className="text-xs text-accent">
                  {pendingImages.length} image(s) selected - will be uploaded on
                  submit
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 col-span-1 md:col-span-5 mt-4">
          <button
            type="submit"
            className={`flex-1 font-bold px-4 py-2 rounded transition-colors ${editingId ? "bg-warning text-primary hover:bg-orange-400" : "bg-accent text-primary hover:bg-secondary hover:text-white"}`}
          >
            {editingId ? "Update Product Details" : "Add Product"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-neutral-mid text-white px-3 py-2 rounded hover:bg-neutral-light"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isShopkeeper={true}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle={toggleAvailability}
          />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 bg-neutral-mid/10 rounded border border-dashed border-neutral-mid">
          <p className="text-neutral-light text-lg">No products yet.</p>
          <p className="text-sm text-neutral-light opacity-70">
            Add your first product above to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
