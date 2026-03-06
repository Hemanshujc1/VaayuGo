import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import XeroxOrderForm from "../components/XeroxOrderForm";
import ProductCard from "../components/ProductCard";

const ShopDetails = () => {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
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

  useEffect(() => {
    let images = [];
    if (shop?.images) {
      images = Array.isArray(shop.images)
        ? shop.images
        : JSON.parse(shop.images || "[]");
    }
    if (images.length === 0 && shop?.image_url) images = [shop.image_url];

    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImgIdx((prev) => (prev + 1) % images.length);
    }, 4000); // 4 seconds slideshow

    return () => clearInterval(interval);
  }, [shop?.images, shop?.image_url]);

  if (loading) return <div className="text-white p-8">Loading Shop...</div>;
  if (!shop) return <div className="text-white p-8">Shop not found</div>;

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const products = shop.Products || [];

  return (
    <div className="min-h-screen bg-primary text-primary-text pb-20">
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
        {/* Shop Header & Hero Section */}
        <div className="relative rounded-2xl overflow-hidden mb-12 shadow-2xl border border-white/10 group">
          {/* Hero Background with Blur */}
          <div className="absolute inset-0 z-0">
            {(() => {
              let images = [];
              if (shop.images) {
                images = Array.isArray(shop.images)
                  ? shop.images
                  : JSON.parse(shop.images || "[]");
              }
              if (images.length === 0 && shop.image_url)
                images = [shop.image_url];

              return (
                <div className="relative w-full h-full">
                  <img
                    src={`http://localhost:3001${images[currentImgIdx]}`}
                    alt="Background"
                    className="w-full h-full object-cover scale-110 blur-xl opacity-40 transition-opacity duration-1000"
                  />
                  <div className="absolute inset-0 bg-linear-to-b from-primary/20 via-primary/60 to-primary"></div>
                </div>
              );
            })()}
          </div>

          <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Slideshow Card */}
            <div className="w-full md:w-64 h-64 relative rounded-2xl overflow-hidden shrink-0 border-2 border-white/20 shadow-2xl group-hover:border-accent/40 transition-colors duration-500">
              {(() => {
                let images = [];
                if (shop.images) {
                  images = Array.isArray(shop.images)
                    ? shop.images
                    : JSON.parse(shop.images || "[]");
                }
                if (images.length === 0 && shop.image_url)
                  images = [shop.image_url];

                if (images.length > 0) {
                  return (
                    <>
                      <img
                        src={`http://localhost:3001${images[currentImgIdx]}`}
                        alt={shop.name}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      {images.length > 1 && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                          {images.map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImgIdx ? "w-6 bg-accent" : "w-1.5 bg-white/40"}`}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  );
                }
                return (
                  <div className="w-full h-full flex items-center justify-center text-neutral-light bg-neutral-dark">
                    No Image
                  </div>
                );
              })()}
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            {/* Shop Info Glass Card */}
            <div className="flex-1 space-y-6 w-full text-center md:text-left">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                  {shop.is_open ? (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                  ) : (
                    <span className="h-3 w-3 rounded-full bg-red-500"></span>
                  )}
                  <span
                    className={`text-xs font-black tracking-widest uppercase ${shop.is_open ? "text-green-400" : "text-red-400"}`}
                  >
                    {shop.is_open ? "Now Open" : "Currently Closed"}
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg tracking-tight">
                  {shop.name}
                </h1>

                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                  {(shop.Categories || []).length > 0 ? (
                    shop.Categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="bg-white/5 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-accent border border-white/10"
                      >
                        {cat.name}
                      </span>
                    ))
                  ) : (
                    <span className="bg-white/5 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-accent border border-white/10">
                      {shop.category || "General"}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-neutral-light text-lg font-medium flex items-center justify-center md:justify-start gap-2">
                <span className="opacity-60 text-accent">📍</span>
                {shop.location_address}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="bg-white/5 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-neutral-light uppercase tracking-tighter">
                      Shop Rating
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-yellow-400 text-lg">★</span>
                      <span className="text-white text-xl font-black">
                        {shop.rating ? Number(shop.rating).toFixed(1) : "0.0"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-neutral-light uppercase tracking-tighter">
                      Delivery
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-secondary text-lg">★</span>
                      <span className="text-white text-xl font-black">
                        {shop.delivery_rating
                          ? Number(shop.delivery_rating).toFixed(1)
                          : "0.0"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {!shop.is_open && (
                <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-300 p-4 rounded-2xl inline-block max-w-sm text-sm">
                  <p className="font-bold flex items-center gap-2">
                    <span>🚫</span> Shop is currently closed
                  </p>
                  <p className="opacity-80">
                    We aren't accepting orders right now. Check back soon!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {shop.category === "Xerox" ? (
          <XeroxOrderForm shop={shop} />
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-6">Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.length > 0 ? (
                products.map((product) => {
                  const activeDiscount = (shop.Discounts || []).find(
                    (d) =>
                      d.target_type === "PRODUCT" &&
                      d.target_id === product.id &&
                      d.is_active,
                  );
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isShopkeeper={false}
                      onAddToCart={(p) =>
                        addToCart({ ...p, activeDiscount }, shop)
                      }
                      shopIsOpen={shop.is_open}
                      cartItem={cartItems.find(
                        (item) => item.id === product.id,
                      )}
                      onUpdateQuantity={updateQuantity}
                      activeDiscount={activeDiscount}
                    />
                  );
                })
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
