import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    is_available: true,
    stock_quantity: 0,
  });
  const [editingId, setEditingId] = useState(null);

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
        await api.post("/products", payload);
        toast.success("Product added");
      }
      setNewProduct({
        name: "",
        price: "",
        description: "",
        is_available: true,
        stock_quantity: 0,
      });
      fetchProducts();
    } catch (error) {
      toast.error(editingId ? "Failed to update" : "Failed to add product");
    }
  };

  const handleEdit = (product) => {
    setNewProduct({
      name: product.name,
      price: product.price,
      description: product.description,
      is_available: product.is_available,
      stock_quantity: product.stock_quantity || 0,
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
      <h2 className="text-xl font-bold mb-4 text-white">Product Management</h2>

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
        <div className="flex gap-2">
          <button
            type="submit"
            className={`flex-1 font-bold px-4 py-2 rounded transition-colors ${editingId ? "bg-warning text-primary hover:bg-orange-400" : "bg-accent text-primary hover:bg-secondary hover:text-white"}`}
          >
            {editingId ? "Update" : "Add"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-neutral-mid text-white px-3 py-2 rounded hover:bg-neutral-light"
            >
              ✕
            </button>
          )}
        </div>
      </form>

      {/* Product List */}
      <div className="space-y-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex flex-col md:flex-row justify-between items-center border border-neutral-mid p-3 rounded hover:bg-neutral-mid transition-colors gap-4"
          >
            <div className="flex-1">
              <h3 className="font-bold text-white flex items-center gap-2">
                {product.name}
                <span className="text-accent">₹{product.price}</span>
                <span className="text-xs text-neutral-light bg-neutral-dark px-2 py-1 rounded border border-neutral-mid">
                  Qty: {product.stock_quantity || 0}
                </span>
              </h3>
              <p className="text-sm text-neutral-light">
                {product.description || "No description"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Stock Toggle */}
              <button
                onClick={() =>
                  product.is_available && toggleAvailability(product)
                }
                disabled={!product.is_available}
                className={`px-3 py-1 rounded text-xs font-bold transition-all border ${
                  product.is_available
                    ? "bg-green-900/30 text-green-400 border-green-800 hover:bg-green-900/50 cursor-pointer"
                    : "bg-red-900/30 text-red-500 border-red-900 opacity-70 cursor-not-allowed"
                }`}
                title={
                  product.is_available
                    ? "Click to mark Out of Stock"
                    : "Update Stock Qty to enable"
                }
              >
                {product.is_available ? "● In Stock" : "○ Out of Stock"}
              </button>

              {/* Edit Button */}
              <button
                onClick={() => handleEdit(product)}
                className="text-white hover:text-accent transition-colors p-2"
                title="Edit Product"
              >
                ✎
              </button>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(product.id)}
                className="text-neutral-light hover:text-danger transition-colors p-2"
                title="Delete Product"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="text-neutral-light text-center py-8">
            No products added yet. Use the form above to add your first item.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductManager;
