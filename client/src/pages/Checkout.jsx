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
                  <span>Subtotal</span>
                  <span>
                    ₹
                    {calculation.subtotal_amount?.toFixed(2) ||
                      calculation.order_value?.toFixed(2) ||
                      total.toFixed(2)}
                  </span>
                </div>
                {calculation.shop_discount_amount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {calculation.applied_rules?.shop?.name || "Shop Discount"}
                    </span>
                    <span>-₹{calculation.shop_discount_amount}</span>
                  </div>
                )}
                {calculation.platform_discount_amount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {calculation.applied_rules?.platform?.name ||
                        "VaayuGo Discount"}
                    </span>
                    <span>-₹{calculation.platform_discount_amount}</span>
                  </div>
                )}
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
                  <span>Final Payable Amount</span>
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
