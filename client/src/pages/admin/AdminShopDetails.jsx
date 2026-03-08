import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import api from "../../api/axios";

const AdminShopDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [shop, setShop] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  // Still fetching the overview data here. The arrays (products, orders) will be fetched in child routes.
  useEffect(() => {
    fetchShopOverview();
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

  const fetchShopOverview = async () => {
    try {
      const { data } = await api.get(`/admin/shops/${id}`);
      setShop(data.shop);
      setMetrics(data.metrics || null);
    } catch (error) {
      console.error("Error fetching shop details", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="text-white text-center mt-20">
        Loading Shop Details...
      </div>
    );
  if (!shop)
    return <div className="text-danger text-center mt-20">Shop Not Found</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* 1. Header & Identity */}
      <div className="relative rounded-2xl overflow-hidden mb-12 shadow-2xl border border-white/10 group bg-neutral-dark">
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

            if (images.length > 0 && images[currentImgIdx]) {
              const imgSrc = images[currentImgIdx].startsWith("http")
                ? images[currentImgIdx]
                : `http://localhost:3001${images[currentImgIdx]}`;
              return (
                <div className="relative w-full h-full bg-neutral-dark">
                  <img
                    src={imgSrc}
                    alt="Background"
                    className="w-full h-full object-cover scale-110 blur-xl opacity-40 transition-opacity duration-1000"
                  />
                  <div className="absolute inset-0 bg-linear-to-b from-primary/20 via-primary/60 to-primary"></div>
                </div>
              );
            }
            return <div className="absolute inset-0 bg-neutral-dark"></div>;
          })()}
        </div>

        <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="w-full md:w-64 h-64 relative rounded-2xl overflow-hidden shrink-0 border-2 border-white/20 shadow-2xl group-hover:border-accent/40 transition-colors duration-500 bg-neutral-mid/10">
            {(() => {
              let images = [];
              if (shop.images) {
                images = Array.isArray(shop.images)
                  ? shop.images
                  : JSON.parse(shop.images || "[]");
              }
              if (images.length === 0 && shop.image_url)
                images = [shop.image_url];

              if (images.length > 0 && images[currentImgIdx]) {
                const imgSrc = images[currentImgIdx].startsWith("http")
                  ? images[currentImgIdx]
                  : `http://localhost:3001${images[currentImgIdx]}`;
                return (
                  <>
                    <img
                      src={imgSrc}
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
                <div className="w-full h-full flex flex-col items-center justify-center text-5xl">
                  🏪
                  <span className="text-sm text-neutral-light mt-4">
                    No Image
                  </span>
                </div>
              );
            })()}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${
                    shop.status === "approved"
                      ? "bg-green-900/40 text-green-400 border-green-800"
                      : shop.status === "rejected"
                        ? "bg-red-900/40 text-red-400 border-red-800"
                        : "bg-yellow-900/40 text-yellow-400 border-yellow-800"
                  }`}
                >
                  {shop.status.toUpperCase()}
                </span>

                {shop.is_open ? (
                  <span className="relative flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] font-black tracking-widest uppercase text-green-400">
                      Now Open
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                    <span className="text-[10px] font-black tracking-widest uppercase text-red-400">
                      Currently Closed
                    </span>
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg tracking-tight">
                {shop.name}
              </h1>

              <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                {(shop.Categories || []).length > 0 ? (
                  shop.Categories.map((cat) => (
                    <span
                      key={cat.id}
                      className="bg-white/5 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-accent border border-white/10"
                    >
                      {cat.name}
                    </span>
                  ))
                ) : shop.category ? (
                  <span className="bg-white/5 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-accent border border-white/10">
                    {shop.category}
                  </span>
                ) : null}
              </div>
            </div>

            <p className="text-neutral-light text-base font-medium flex items-center justify-center md:justify-start gap-2">
              <span className="opacity-60 text-accent">📍</span>
              {shop.location_address}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="bg-white/5 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 flex flex-col gap-1 shadow-xl">
                <span className="text-[10px] font-bold text-neutral-light uppercase tracking-tighter">
                  Owner
                </span>
                <span className="text-white font-bold">
                  {shop.User?.name || "Unknown"}
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 flex flex-col gap-1 shadow-xl">
                <span className="text-[10px] font-bold text-neutral-light uppercase tracking-tighter">
                  Contact
                </span>
                <span className="text-white font-bold">
                  📞 {shop.User?.mobile_number || "N/A"}
                </span>
                <span className="text-white font-bold text-sm">
                  ✉️ {shop.User?.email || "N/A"}
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 flex flex-col gap-1 shadow-xl">
                <span className="text-[10px] font-bold text-neutral-light uppercase tracking-tighter">
                  Shop ID
                </span>
                <span className="font-bold text-accent">
                  #{shop.id}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 mt-4 md:mt-0">
            <button
              onClick={() => navigate("/admin/shops")}
              className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-6 py-3 rounded-full hover:bg-white/20 hover:border-white/40 transition-all font-bold text-sm shadow-xl flex items-center gap-2"
            >
              <span>←</span> Back to Shops
            </button>
          </div>
        </div>
      </div>

      {metrics && (
        <>
          {/* SECTION 1: SALES */}
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🛒</span> 1. Sales Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-neutral-dark p-5 rounded-lg shadow border-l-4 border-white hover:border-neutral-light transition-colors">
              <h3 className="text-neutral-light font-bold text-xs uppercase tracking-wide">
                Shop GMV
              </h3>
              <p className="text-2xl font-bold text-white mt-1">
                ₹{metrics.shopGmv || "0.00"}
              </p>
              <p className="text-[10px] text-neutral-500 mt-1">
                Gross Merchandise Value before total discounts
              </p>
            </div>
            <div className="bg-neutral-dark p-5 rounded-lg shadow border-l-4 border-blue-400 hover:border-blue-300 transition-colors">
              <h3 className="text-neutral-light font-bold text-xs uppercase tracking-wide">
                Net GMV
              </h3>
              <p className="text-2xl font-bold text-blue-400 mt-1">
                ₹{metrics.shopNetGmv || "0.00"}
              </p>
              <p className="text-[10px] text-neutral-500 mt-1">
                Value after ALL discounts
              </p>
            </div>
            <div className="bg-neutral-dark p-5 rounded-lg shadow border-l-4 border-secondary hover:border-secondary/80 transition-colors">
              <h3 className="text-neutral-light font-bold text-xs uppercase tracking-wide">
                Total Delivered
              </h3>
              <p className="text-2xl font-bold text-secondary mt-1">
                {metrics.totalCompletedOrders || 0}
              </p>
              <p className="text-[10px] text-neutral-500 mt-1">
                Successfully completed orders
              </p>
            </div>
            <div className="bg-neutral-dark p-5 rounded-lg shadow border-l-4 border-accent hover:border-accent/80 transition-colors">
              <h3 className="text-neutral-light font-bold text-xs uppercase tracking-wide">
                AOV (Avg Order Value)
              </h3>
              <p className="text-2xl font-bold text-accent mt-1">
                ₹{metrics.aov || "0.00"}
              </p>
              <p className="text-[10px] text-neutral-500 mt-1">
                Net GMV / Completed Orders
              </p>
            </div>
          </div>

          {/* SECTION 2: PLATFORM REVENUE */}
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>📈</span> 2. Platform Revenue from this Shop
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="col-span-1 lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-primary p-4 rounded-lg shadow border border-neutral-mid flex justify-between items-center">
                <span className="text-neutral-light text-sm">
                  Total Commission
                </span>
                <span className="text-white font-bold text-lg">
                  ₹{metrics.totalCommission || "0.00"}
                </span>
              </div>
              <div className="bg-primary p-4 rounded-lg shadow border border-neutral-mid flex justify-between items-center">
                <span className="text-neutral-light text-sm">
                  Delivery Rev (Platform)
                </span>
                <span className="text-white font-bold text-lg">
                  ₹{metrics.deliveryRevenuePlatformShare || "0.00"}
                </span>
              </div>
              <div className="bg-primary p-4 rounded-lg shadow border border-neutral-mid flex justify-between items-center">
                <span className="text-neutral-light text-sm">
                  Small Order (Platform)
                </span>
                <span className="text-white font-bold text-lg">
                  ₹{metrics.smallOrderRevenuePlatformShare || "0.00"}
                </span>
              </div>
              <div className="bg-primary p-4 rounded-lg shadow border border-warning/50 flex justify-between items-center">
                <span className="text-warning text-sm">Gross Platform Rev</span>
                <span className="text-warning font-bold text-lg">
                  ₹{metrics.grossPlatformRevenue || "0.00"}
                </span>
              </div>
              <div className="bg-primary p-4 rounded-lg shadow border border-danger/50 flex justify-between items-center col-span-2">
                <span className="text-danger text-sm">
                  Platform Discounts Supplied
                </span>
                <span className="text-danger font-bold text-lg">
                  - ₹{metrics.platformDiscounts || "0.00"}
                </span>
              </div>
            </div>

            <div className="bg-linear-to-br from-neutral-dark to-primary p-6 rounded-xl shadow-lg border border-green-500/50 flex flex-col justify-center items-center relative overflow-hidden text-center">
              <div className="absolute -left-10 -bottom-10 text-green-500/10 text-9xl">
                💰
              </div>
              <h3 className="text-green-400 font-bold text-sm uppercase tracking-wider mb-2 z-10">
                Net Platform Revenue
              </h3>
              <p className="text-5xl font-black text-green-400 mt-2 z-10">
                ₹{metrics.netPlatformRevenue || "0.00"}
              </p>
              <p className="text-xs text-green-200/60 mt-4 max-w-[200px] z-10 leading-relaxed">
                Actual Earnings from this shop after all funded discounts
              </p>
            </div>
          </div>

          {/* SECTION 3: SHOP EARNINGS */}
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🏪</span> 3. Shop Earnings & Settlement
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-linear-to-bl from-neutral-dark to-primary p-6 rounded-xl shadow-lg border border-accent/50 flex flex-col justify-center items-center relative overflow-hidden text-center order-last lg:order-first">
              <div className="absolute -right-6 -bottom-6 text-accent/10 text-9xl">
                🏛️
              </div>
              <h3 className="text-accent font-bold text-sm uppercase tracking-wider mb-2 z-10">
                Shop Final Settlement
              </h3>
              <p className="text-5xl font-black text-accent mt-2 z-10">
                ₹{metrics.shopNetRevenueFinalSettlement || "0.00"}
              </p>
              <p className="text-xs text-accent/60 mt-4 max-w-[200px] z-10 leading-relaxed">
                The net payout to this shopkeeper
              </p>
            </div>

            <div className="col-span-1 lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-primary p-4 rounded-lg shadow border border-neutral-mid flex justify-between items-center">
                <span className="text-neutral-light text-sm">
                  Shop Net Sale
                </span>
                <span className="text-white font-bold text-lg">
                  ₹{metrics.shopNetSale || "0.00"}
                </span>
              </div>
              <div className="p-4 rounded-lg shadow border border-danger/50 flex justify-between items-center bg-danger/5">
                <span className="text-danger text-sm">Shop Paid Discounts</span>
                <span className="text-danger font-bold text-lg">
                  - ₹{metrics.totalShopDiscounts || "0.00"}
                </span>
              </div>
              <div className="p-4 rounded-lg shadow border border-danger/50 flex justify-between items-center bg-danger/5">
                <span className="text-danger text-sm">Commission Deducted</span>
                <span className="text-danger font-bold text-lg">
                  - ₹{metrics.commissionDeducted || "0.00"}
                </span>
              </div>
              <div className="bg-primary p-4 rounded-lg shadow border border-neutral-mid flex justify-between items-center">
                <span className="text-neutral-light text-sm">
                  Delivery Rev (Shop)
                </span>
                <span className="text-white font-bold text-lg">
                  + ₹{metrics.deliveryRevenueShopShare || "0.00"}
                </span>
              </div>
              <div className="bg-primary p-4 rounded-lg shadow border border-neutral-mid flex justify-between items-center">
                <span className="text-neutral-light text-sm">
                  Small Order (Shop)
                </span>
                <span className="text-white font-bold text-lg">
                  + ₹{metrics.smallOrderRevenueShopShare || "0.00"}
                </span>
              </div>
              <div className="bg-primary p-4 rounded-lg shadow border border-warning/50 flex justify-between items-center">
                <span className="text-warning text-sm">Shop Gross Rev</span>
                <span className="text-warning font-bold text-lg">
                  ₹{metrics.shopGrossRevenue || "0.00"}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Navigation Links */}
      <div className="mt-8 flex gap-4 border-t border-neutral-mid pt-8">
        <Link
          to={`/admin/shops/${id}/products`}
          className="flex-1 bg-neutral-dark border border-teal-500/30 text-teal-400 font-bold text-center py-4 rounded-xl hover:bg-teal-500 hover:text-primary transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <span>📦</span> View All Products
        </Link>
        <Link
          to={`/admin/shops/${id}/orders`}
          className="flex-1 bg-neutral-dark border border-amber-500/30 text-amber-400 font-bold text-center py-4 rounded-xl hover:bg-amber-500 hover:text-primary transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <span>🧾</span> View All Orders
        </Link>
      </div>
    </div>
  );
};

export default AdminShopDetails;
