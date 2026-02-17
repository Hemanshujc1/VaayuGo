import { useState } from "react";
import { useCart } from "../context/CartContext";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Checkout = () => {
  const { cartItems, cartShop, getCartTotal, clearCart } = useCart();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const total = getCartTotal();
  const deliveryFee = 10;
  const platformFee = 2;
  const grandTotal = total + deliveryFee + platformFee;

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast.error("Please enter delivery address");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        shop_id: cartShop.id,
        items: cartItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          // Custom/Xerox fields
          is_xerox: item.is_xerox,
          name: item.name,
          price: item.price,
          file_url: item.file_url,
          options: item.options,
        })),
        delivery_address: address,
      };

      await api.post("/orders", orderData);
      toast.success("Order Placed Successfully!");
      clearCart();
      navigate("/my-orders"); // Need to create this page
    } catch (error) {
      toast.error(error.response?.data?.message || "Order Failed");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0)
    return <div className="p-10 text-white text-center">Cart is empty</div>;

  return (
    <div className="p-8 bg-primary min-h-screen text-primary-text">
      <h1 className="text-2xl font-bold mb-6 text-white">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid h-fit">
          <h2 className="text-lg font-bold mb-4 text-accent">Order Summary</h2>
          <p className="mb-2 font-medium text-white">{cartShop.name}</p>
          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-sm text-neutral-light"
              >
                <span>
                  {item.quantity} x {item.name}
                </span>
                <span className="text-white">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-mid pt-2 space-y-1 text-sm">
            <div className="flex justify-between text-neutral-light">
              <span>Item Total</span>
              <span>₹{total}</span>
            </div>
            <div className="flex justify-between text-neutral-light">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee}</span>
            </div>
            <div className="flex justify-between text-neutral-light">
              <span>Platform Fee</span>
              <span>₹{platformFee}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-neutral-mid mt-2 text-white">
              <span>To Pay</span>
              <span>₹{grandTotal}</span>
            </div>
          </div>
        </div>

        {/* Address & Payment */}
        <div className="bg-neutral-dark p-6 rounded shadow border border-neutral-mid h-fit">
          <h2 className="text-lg font-bold mb-4 text-accent">
            Delivery Details
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-neutral-light">
              Delivery Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-neutral-mid bg-neutral-mid text-white p-2 rounded h-24 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter your full address here..."
            ></textarea>
          </div>

          <h2 className="text-lg font-bold mb-4 text-accent">Payment Method</h2>
          <div className="flex items-center gap-2 mb-6 text-white">
            <input type="radio" checked readOnly className="accent-accent" />
            <span>Cash on Delivery (Only option available)</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className={`w-full text-primary py-3 rounded font-bold transition-colors ${loading ? "bg-neutral-light cursor-not-allowed" : "bg-secondary hover:bg-white hover:text-secondary"}`}
          >
            {loading ? "Placing Order..." : `Place Order (₹${grandTotal})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
