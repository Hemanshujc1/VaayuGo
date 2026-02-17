import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import XeroxOrderForm from "../components/XeroxOrderForm";

import Navbar from "../components/Navbar";

const ShopDetails = () => {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, cartItems } = useCart();

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await api.get(`/public/shops/${id}`);
        setShop(res.data);
      } catch (error) {
        console.error("Error fetching shop details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [id]);

  if (loading) return <div className="text-white p-8">Loading Shop...</div>;
  if (!shop) return <div className="text-white p-8">Shop not found</div>;

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-primary text-primary-text pb-20">
      <Navbar />

      <div className="container mx-auto p-4 md:p-8">
        {/* Floating Cart Button */}
        {cartCount > 0 && (
          <Link
            to="/cart"
            className="fixed bottom-6 right-6 bg-secondary text-white px-6 py-3 rounded-full shadow-lg font-bold z-50 hover:bg-accent hover:text-primary transition-colors"
          >
            View Cart ({cartCount})
          </Link>
        )}

        <div className="bg-neutral-dark p-6 rounded shadow border-l-4 border-accent mb-6">
          <h1 className="text-3xl font-bold text-white">{shop.name}</h1>
          <p className="text-neutral-light">
            {shop.category} | {shop.location_address}
          </p>
        </div>

        {shop.category === "Xerox" ? (
          <XeroxOrderForm shop={shop} />
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">Menu / Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shop.Products && shop.Products.length > 0 ? (
                shop.Products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-neutral-dark p-4 rounded shadow flex justify-between items-center border border-neutral-mid hover:border-accent transition-colors"
                  >
                    <div>
                      <h3 className="font-bold text-white text-lg">
                        {product.name}
                      </h3>
                      <p className="text-sm text-neutral-light">
                        {product.description}
                      </p>
                      <p className="font-bold mt-1 text-accent">
                        ₹{product.price}
                      </p>
                    </div>
                    <button
                      className="bg-accent text-primary font-bold px-4 py-2 rounded hover:bg-secondary hover:text-white transition-colors"
                      onClick={() => addToCart(product, shop)}
                    >
                      Add
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-neutral-light">No products available.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShopDetails;
