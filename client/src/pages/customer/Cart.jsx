import { useCart } from "../../context/CartContext";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";

const Cart = () => {
  const { cartItems, cartShop, updateQuantity, getCartTotal, clearCart } =
    useCart();
  const total = getCartTotal();

  const [calculation, setCalculation] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState("");

  useEffect(() => {
    if (cartItems.length > 0 && cartShop) {
      calculateCart();
    }
  }, [cartItems, cartShop]);

  const calculateCart = async () => {
    setCalcLoading(true);
    setCalcError("");
    try {
      // The backend expects `location_name` to lookup the delivery rules dynamically
      const res = await api.post("/cart/calculate", {
        items: cartItems.map((i) => ({
          id: i.id,
          price: i.price,
          quantity: i.quantity,
          is_xerox: i.is_xerox,
        })),
        shop_id: cartShop.id,
        category: cartShop.category,
      });
      setCalculation(res.data);
    } catch (err) {
      setCalcError(
        err.response?.data?.error ||
          "Error calculating cart total - Does this region deliver here?",
      );
    } finally {
      setCalcLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-primary text-primary-text">
        <div className="p-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Your Cart is Empty
          </h2>
          <Link to="/" className="text-accent hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-primary-text pb-20">
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6 text-white ">Your Basket</h1>

        <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid mb-6">
          <div className="flex justify-between items-center border-b border-neutral-mid pb-4 mb-4">
            <h2 className="text-lg font-bold text-white">
              Ordering from:{" "}
              <span className="text-accent">{cartShop?.name}</span>
            </h2>
            <button
              onClick={clearCart}
              className="text-danger text-sm hover:underline"
            >
              Clear Cart
            </button>
          </div>

          {cartItems.map((item) => {
            let discountedPrice = item.price;
            if (item.activeDiscount && item.activeDiscount.is_active) {
              if (item.activeDiscount.type === "PERCENTAGE") {
                discountedPrice =
                  item.price - (item.price * item.activeDiscount.value) / 100;
              } else {
                discountedPrice = Math.max(
                  0,
                  item.price - item.activeDiscount.value,
                );
              }
            }
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-3 border-b border-neutral-mid last:border-0"
              >
                <div>
                  <p className="font-semibold text-white">
                    {item.is_xerox ? <span>📄 {item.name}</span> : item.name}
                  </p>
                  <div className="text-sm text-neutral-light">
                    {item.is_xerox && (
                      <p className="text-accent text-xs mb-1 italic">
                        {item.description}
                      </p>
                    )}
                    {item.price !== discountedPrice ? (
                      <span className="flex gap-2 items-center flex-wrap">
                        <span className="line-through opacity-50">
                          ₹{item.price}
                        </span>
                        <span className="text-accent font-bold">
                          ₹{discountedPrice.toFixed(2)}
                        </span>
                        <span>x {item.quantity}</span>
                      </span>
                    ) : (
                      <span>
                        ₹{item.price} x {item.quantity}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="bg-neutral-mid text-white px-2 rounded hover:bg-neutral-light"
                  >
                    -
                  </button>
                  <span className="text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="bg-neutral-mid text-white px-2 rounded hover:bg-neutral-light"
                  >
                    +
                  </button>
                  <p className="font-bold w-20 text-right text-white">
                    ₹{(discountedPrice * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
          <h2 className="text-lg font-bold mb-4 text-white">Bill Details</h2>

          {calcLoading ? (
            <div className="text-accent italic text-sm my-4">
              Calculating fees...
            </div>
          ) : calcError ? (
            <div className="text-danger font-bold text-sm my-4 p-2 bg-red-500/10 rounded border border-red-500/20">
              {calcError}
            </div>
          ) : calculation ? (
            <>
              <div className="flex justify-between mb-2 text-neutral-light">
                <span>Item Total</span>
                <span>₹{calculation.subtotal_amount.toFixed(2)}</span>
              </div>
              {calculation.product_discount_amount > 0 && (
                <div className="flex justify-between mb-2 text-accent">
                  <span>Product Discount</span>
                  <span>
                    - ₹{calculation.product_discount_amount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between mb-4 pt-2 border-t border-neutral-mid font-medium text-white">
                <span>Subtotal</span>
                <span>
                  ₹
                  {(
                    calculation.subtotal_amount -
                    calculation.product_discount_amount
                  ).toFixed(2)}
                </span>
              </div>

              {calculation.shop_discount_amount > 0 && (
                <div className="flex justify-between mb-2 text-accent">
                  <span>Shop Discount</span>
                  <span>- ₹{calculation.shop_discount_amount.toFixed(2)}</span>
                </div>
              )}
              {calculation.platform_discount_amount > 0 && (
                <div className="flex justify-between mb-2 text-accent">
                  <span>Platform Discount</span>
                  <span>
                    - ₹{calculation.platform_discount_amount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between mb-2 text-neutral-light">
                <span>Delivery Fee</span>
                <span>₹{calculation.delivery_fee?.toFixed(2)}</span>
              </div>
              {calculation.is_small_order && (
                <>
                  <div className="flex justify-between mb-2 text-orange-400">
                    <span>Min Order Extra Charge</span>
                    <span>₹{calculation.extra_charge?.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-orange-400 mb-4 bg-orange-400/10 p-2 rounded">
                    ⚠️ An extra charge applies because the order value does not
                    meet the minimum requirement.
                  </p>
                </>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-neutral-mid pt-2 text-white">
                <span>Grand Total</span>
                <span>₹{calculation.total_payable?.toFixed(2)}</span>
              </div>
            </>
          ) : null}

          <Link
            to="/checkout"
            className="block w-full bg-secondary text-white text-center py-3 rounded mt-6 font-bold hover:bg-accent hover:text-primary transition-colors"
          >
            Proceed to Pay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
