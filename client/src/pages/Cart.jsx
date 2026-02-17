import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";

const Cart = () => {
  const { cartItems, cartShop, updateQuantity, getCartTotal, clearCart } =
    useCart();
  const navigate = useNavigate();
  const total = getCartTotal();

  // Mock Fee Logic (To be enhanced with ServiceConfig)
  const deliveryFee = 10;
  const platformFee = 2;
  const grandTotal = total + deliveryFee + platformFee;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-primary text-primary-text">
        <Navbar />
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
      <Navbar />
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
            <span>₹{total}</span>
          </div>
          <div className="flex justify-between mb-2 text-neutral-light">
            <span>Delivery Fee</span>
            <span>₹{deliveryFee}</span>
          </div>
          <div className="flex justify-between mb-4 text-neutral-light">
            <span>Platform Fee</span>
            <span>₹{platformFee}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-neutral-mid pt-2 text-white">
            <span>Grand Total</span>
            <span>₹{grandTotal}</span>
          </div>

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
