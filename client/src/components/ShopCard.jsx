import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const ShopCard = ({ shop }) => {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  let images = [];
  try {
    if (Array.isArray(shop.images)) {
      images = shop.images;
    } else if (typeof shop.images === "string") {
      images = JSON.parse(shop.images);
    }
  } catch (e) {
    console.error("Failed to parse shop images", e);
    // abnormal case fallbacks
    images = shop.images ? [shop.images] : [];
  }

  // Fallback to legacy image_url if images array is empty or invalid
  if (!images || images.length === 0) {
    if (shop.image_url) {
      images = [shop.image_url];
    } else {
      images = [];
    }
  }

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImgIdx((prev) => (prev + 1) % images.length);
    }, 3000); // 3 seconds slideshow

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <Link
      to={`/shop/${shop.id}`}
      className="bg-neutral-dark rounded-lg shadow hover:shadow-lg transition block overflow-hidden border border-neutral-mid hover:border-accent group"
    >
      <div className="h-40 bg-neutral-mid flex items-center justify-center text-neutral-light relative">
        {images.length > 0 ? (
          <img
            src={`http://localhost:3001${images[currentImgIdx]}`}
            alt={shop.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span>No Image</span>
        )}

        {/* Dots Indicator for Slideshow */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImgIdx ? "bg-accent" : "bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4">
        <h2 className="text-xl font-bold text-white group-hover:text-accent transition-colors">
          {shop.name}
        </h2>
        <div className="flex flex-wrap gap-1 mt-1 mb-2">
          {(shop.Categories || []).length > 0 ? (
            shop.Categories.map((cat) => (
              <span
                key={cat.id}
                className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20"
              >
                {cat.name}
              </span>
            ))
          ) : (
            <p className="text-xs text-neutral-light">
              {shop.category || "General"}
            </p>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="bg-green-900/30 text-green-400 border border-green-800 text-xs px-2 py-1 rounded">
            {shop.rating > 0 ? `${shop.rating} ★` : "New"}
          </span>
          <span className="text-xs text-neutral-light">
            {shop.location_address}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ShopCard;
