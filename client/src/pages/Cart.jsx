import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/axios";
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

          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center py-3 border-b border-neutral-mid last:border-0"
            >
              <div>
                <p className="font-semibold text-white">{item.name}</p>
                <p className="text-sm text-neutral-light">
                  ₹{item.price} x {item.quantity}
                </p>
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
                <p className="font-bold w-16 text-right text-white">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid">
          <h2 className="text-lg font-bold mb-4 text-white">Bill Details</h2>
          <div className="flex justify-between mb-2 text-neutral-light">
            <span>Item Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>

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
                <span>Delivery Fee</span>
                <span>₹{calculation.delivery_fee}</span>
              </div>
              {calculation.is_small_order && (
                <p className="text-xs text-orange-400 mb-4 bg-orange-400/10 p-2 rounded">
                  ⚠️ A Small Order Delivery Fee has been applied because the
                  order value does not meet the minimum requirement.
                </p>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-neutral-mid pt-2 text-white">
                <span>Grand Total</span>
                <span>₹{calculation.total_payable}</span>
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
