import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Checkout = () => {
  const { cartItems, cartShop, getCartTotal, clearCart } = useCart();
  const [address, setAddress] = useState("Fetching registered address...");
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculation, setCalculation] = useState(null);
  const [calcLoading, setCalcLoading] = useState(true);
  const [calcError, setCalcError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        setAddress(res.data.address || "No address found on profile.");
        setUserLocation(res.data.location || null);
      } catch (error) {
        console.error("Failed to load profile", error);
        setAddress("Failed to load address.");
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (cartItems.length > 0 && cartShop && userLocation) {
      calculateCart();
    }
  }, [cartItems, cartShop, userLocation]);

  const calculateCart = async () => {
    if (!userLocation) return;
    setCalcLoading(true);
    setCalcError("");
    try {
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
        err.response?.data?.error || "Error calculating cart total.",
      );
    } finally {
      setCalcLoading(false);
    }
  };

  const total = getCartTotal();

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast.error("Please enter delivery address");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        shop_id: cartShop.id,
        category: cartShop.category,
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

  if (cartItems.length === 0 || !cartShop) {
    return (
      <div className="p-10 text-white text-center">
        Cart is empty or shop not selected.
      </div>
    );
  }

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
                <div className="flex justify-between text-neutral-light">
                  <span>Delivery Fee</span>
                  <span>₹{calculation.delivery_fee}</span>
                </div>
                {calculation.is_small_order && (
                  <p className="text-xs text-orange-400 my-2">
                    (Small Order Delivery Fee applied)
                  </p>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-neutral-mid mt-2 text-white">
                  <span>To Pay</span>
                  <span>₹{calculation.total_payable}</span>
                </div>
              </>
            ) : null}
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
            <div className="w-full border border-neutral-mid bg-neutral-dark text-neutral-light p-4 rounded h-auto min-h-24 shadow-inner">
              {address}
            </div>
            <p className="text-xs text-accent mt-2">
              * Delivery will be made to your registered address.
            </p>
          </div>

          <h2 className="text-lg font-bold mb-4 text-accent">Payment Method</h2>
          <div className="flex items-center gap-2 mb-6 text-white">
            <input type="radio" checked readOnly className="accent-accent" />
            <span>Cash on Delivery (Only option available)</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loading || calcLoading || !!calcError}
            className={`w-full text-primary py-3 rounded font-bold transition-colors ${loading || calcLoading || !!calcError ? "bg-neutral-light cursor-not-allowed" : "bg-secondary hover:bg-white hover:text-secondary"}`}
          >
            {loading
              ? "Placing Order..."
              : calcLoading
                ? "Calculating..."
                : `Place Order (₹${calculation ? calculation.total_payable : "-"})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
