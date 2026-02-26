import { useState, useEffect } from "react";

const ProductCard = ({
  product,
  isShopkeeper = false,
  onEdit,
  onDelete,
  onToggle,
  onAddToCart,
  shopIsOpen = true,
  cartItem,
  onUpdateQuantity,
  onAddDiscount,
  activeDiscount,
}) => {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  let images = [];
  try {
    if (Array.isArray(product.images)) {
      images = product.images;
    } else if (typeof product.images === "string") {
      images = JSON.parse(product.images);
    }
  } catch (e) {
    console.error("Failed to parse product images", e);
    images = product.images ? [product.images] : [];
  }

  // Fallback
  if (!images || images.length === 0) {
    if (product.image_url) {
      images = [product.image_url];
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
    <div className="bg-neutral-mid/30 border border-neutral-mid rounded-lg overflow-hidden flex flex-col hover:border-accent transition-colors group relative">
      {/* Image Area */}
      <div className="h-48 bg-neutral-dark flex items-center justify-center relative overflow-hidden">
        {images.length > 0 ? (
          <img
            src={`http://localhost:3001${images[currentImgIdx]}`}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="text-4xl text-neutral-light opacity-50">📦</div>
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

        {/* Status Badge (Shopkeeper Only) */}
        {isShopkeeper && (
          <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-1 rounded text-xs font-bold shadow-md backdrop-blur-sm ${
                product.is_available
                  ? "bg-green-900/80 text-green-400 border border-green-700"
                  : "bg-red-900/80 text-red-400 border border-red-700"
              }`}
            >
              {product.is_available ? "In Stock" : "Out of Stock"}
            </span>
          </div>
        )}

        {/* Discount Badge */}
        {activeDiscount && (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-accent text-primary px-2 py-1 rounded text-xs font-black shadow-[0_2px_10px_rgba(0,229,255,0.4)]">
              {activeDiscount.type === "PERCENTAGE"
                ? `${Math.round(activeDiscount.value)}% OFF`
                : `₹${Math.round(activeDiscount.value)} OFF`}
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3
            className="font-bold text-white text-lg line-clamp-1 flex-1 pr-2"
            title={product.name}
          >
            {product.name}
          </h3>
          <div className="flex flex-col items-end whitespace-nowrap">
            {activeDiscount ? (
              <>
                <span className="text-neutral-500 line-through text-xs font-bold">
                  ₹{product.price}
                </span>
                <span className="text-accent font-extrabold text-lg">
                  ₹
                  {activeDiscount.type === "PERCENTAGE"
                    ? (
                        product.price -
                        (product.price * activeDiscount.value) / 100
                      ).toFixed(2)
                    : Math.max(0, product.price - activeDiscount.value).toFixed(
                        2,
                      )}
                </span>
              </>
            ) : (
              <span className="text-accent font-bold text-lg">
                ₹{product.price}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-neutral-light mb-4 line-clamp-2 flex-1">
          {product.description || "No description provided."}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-mid/50">
          {isShopkeeper ? (
            <>
              <span className="text-xs text-neutral-light bg-neutral-dark px-2 py-1 rounded">
                Qty: {product.stock_quantity || 0}
              </span>

              <div className="flex gap-2">
                {product.is_available && (
                  <button
                    onClick={() => onToggle(product)}
                    className="bg-neutral-dark hover:bg-warning/50 text-warning px-2 rounded transition-colors text-xs font-bold border border-warning/30"
                    title="Quick mark as Out of Stock (sets Qty to 0)"
                  >
                    Set Out of Stock
                  </button>
                )}
                <button
                  onClick={() => onAddDiscount(product)}
                  className="bg-neutral-dark hover:bg-accent/20 text-accent p-2 rounded transition-colors"
                  title="Create Offer / Discount for this Product"
                >
                  🏷️
                </button>
                <button
                  onClick={() => onEdit(product)}
                  className="bg-neutral-dark hover:bg-neutral-mid text-white p-2 rounded transition-colors"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(product.id)}
                  className="bg-neutral-dark hover:bg-red-900/50 text-red-400 p-2 rounded transition-colors"
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </>
          ) : cartItem ? (
            <div className="flex items-center justify-between w-full bg-neutral-dark rounded overflow-hidden border border-neutral-mid">
              <button
                onClick={() => onUpdateQuantity(product.id, -1)}
                className="px-3 py-2 bg-neutral-mid text-white hover:bg-accent hover:text-primary transition-colors font-bold"
              >
                -
              </button>
              <span className="font-bold text-white px-4">
                {cartItem.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(product.id, 1)}
                className="px-3 py-2 bg-neutral-mid text-white hover:bg-accent hover:text-primary transition-colors font-bold"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(product)}
              disabled={!shopIsOpen}
              className={`w-full py-2 px-4 rounded font-bold transition-colors ${
                shopIsOpen
                  ? "bg-accent text-primary hover:bg-secondary hover:text-white"
                  : "bg-neutral-mid text-neutral-light cursor-not-allowed opacity-50"
              }`}
            >
              {shopIsOpen ? "Add to Cart" : "Shop Closed"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
