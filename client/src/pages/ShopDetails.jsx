import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import XeroxOrderForm from "../components/XeroxOrderForm";
import ProductCard from "../components/ProductCard";

import Navbar from "../components/Navbar";

const ShopDetails = () => {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, cartItems, updateQuantity } = useCart();

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
  const products = shop.Products || [];

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
        {/* Shop Header */}
        <div className="bg-neutral-dark p-6 rounded-lg shadow-md mb-6 border border-neutral-mid flex flex-col md:flex-row gap-6">
          <img
            src={`http://localhost:3001${shop.image_url}`}
            alt={shop.name}
            className="w-full md:w-48 h-48 object-cover rounded-md"
          />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {shop.name}
                </h1>
                <p className="text-neutral-light mb-1">
                  <span className="bg-neutral-mid px-2 py-1 rounded text-xs text-accent border border-neutral-mid mr-2">
                    {shop.category}
                  </span>
                  {shop.location_address}
                </p>
                <div className="flex items-center gap-1 mb-4">
                  <span className="text-yellow-400">★</span>
                  <span className="text-white font-bold">{shop.rating}</span>
                  <span className="text-neutral-light text-sm">
                    (50+ ratings)
                  </span>
                </div>
              </div>
              {/* Open/Closed Badge */}
              <div
                className={`px-4 py-2 rounded-full font-bold text-white ${
                  shop.is_open ? "bg-green-600" : "bg-red-600"
                }`}
              >
                {shop.is_open ? "OPEN" : "CLOSED"}
              </div>
            </div>

            {!shop.is_open && (
              <div className="bg-red-900/20 border-l-4 border-red-500 text-red-300 p-4 mb-4 rounded-r">
                <p className="font-bold">Shop is currently closed.</p>
                <p className="text-sm">
                  You cannot place orders at this moment. Please check back
                  later.
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Shop Gallery */}
        {shop.images && shop.images.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Photos</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {shop.images.map((img, idx) => (
                <img
                  key={idx}
                  src={`http://localhost:3001${img}`}
                  alt={`${shop.name} ${idx + 1}`}
                  className="w-48 h-32 object-cover rounded-md shrink-0 border border-neutral-mid"
                />
              ))}
            </div>
          </div>
        )}

        {shop.category === "Xerox" ? (
          <XeroxOrderForm shop={shop} />
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-6">Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.length > 0 ? (
                products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isShopkeeper={false}
                    onAddToCart={addToCart}
                    shopIsOpen={shop.is_open}
                    cartItem={cartItems.find((item) => item.id === product.id)}
                    onUpdateQuantity={updateQuantity}
                  />
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
