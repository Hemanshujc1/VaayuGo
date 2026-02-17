import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";

const XeroxOrderForm = ({ shop }) => {
  const { addToCart } = useCart();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [options, setOptions] = useState({
    copies: 1,
    color: "bw", // bw, color
    sides: "single", // single, double
    binding: "none", // none, spiral, hard
  });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleAddToCart = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    try {
      // 1. Upload File
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await api.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fileUrl = uploadRes.data.fileUrl;

      // 2. Calculate Price (Mock Logic)
      // Rate: B/W = 2, Color = 10. Binding: Spiral = 30.
      let rate = options.color === "bw" ? 2 : 10;
      if (options.sides === "double") rate = rate * 1.5; // Discount for double? Or 2x? Usually double is cheaper per side, but let's say 1.5x page cost

      // Mock page count estimation (since we can't parse PDF easily on frontend without heavy libs) -> User Input or Assume 10 pages for demo
      const estimatedPages = 1;
      let itemPrice = rate * estimatedPages * options.copies;

      if (options.binding === "spiral") itemPrice += 30;
      if (options.binding === "hard") itemPrice += 50;

      // 3. Add to Cart
      const cartItem = {
        id: Date.now(), // Temp ID for cart
        name: `Doc: ${file.name}`,
        price: itemPrice,
        description: `${options.color}, ${options.sides}, Binding: ${options.binding}`,
        file_url: fileUrl,
        options: options,
        is_xerox: true,
      };

      addToCart(cartItem, shop);
      setFile(null);
      toast.success("Document added to cart");
    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-neutral-dark p-6 rounded shadow mt-6 border border-neutral-mid">
      <h2 className="text-xl font-bold mb-4 text-white">
        Upload Document for Printing
      </h2>

      <div className="space-y-4">
        {/* File Input */}
        <div>
          <label className="block text-sm font-medium mb-1 text-neutral-light">
            Select File (PDF, DOC, Images)
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-neutral-light file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-accent file:text-primary hover:file:bg-secondary cursor-pointer"
          />
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-light">
              Copies
            </label>
            <input
              type="number"
              min="1"
              value={options.copies}
              onChange={(e) =>
                setOptions({ ...options, copies: parseInt(e.target.value) })
              }
              className="border border-neutral-mid bg-neutral-mid text-white p-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-light">
              Color
            </label>
            <select
              value={options.color}
              onChange={(e) =>
                setOptions({ ...options, color: e.target.value })
              }
              className="border border-neutral-mid bg-neutral-mid text-white p-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="bw">Black & White (₹2/page)</option>
              <option value="color">Color (₹10/page)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-light">
              Sides
            </label>
            <select
              value={options.sides}
              onChange={(e) =>
                setOptions({ ...options, sides: e.target.value })
              }
              className="border border-neutral-mid bg-neutral-mid text-white p-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="single">Single Side</option>
              <option value="double">Double Side</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-light">
              Binding
            </label>
            <select
              value={options.binding}
              onChange={(e) =>
                setOptions({ ...options, binding: e.target.value })
              }
              className="border border-neutral-mid bg-neutral-mid text-white p-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="none">None</option>
              <option value="spiral">Spiral (₹30)</option>
              <option value="hard">Hard Binding (₹50)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={uploading}
          className={`w-full text-primary py-3 rounded font-bold transition-colors ${uploading ? "bg-neutral-light cursor-not-allowed" : "bg-accent hover:bg-secondary hover:text-white"}`}
        >
          {uploading ? "Uploading..." : "Add Document to Basket"}
        </button>
      </div>
    </div>
  );
};

export default XeroxOrderForm;
