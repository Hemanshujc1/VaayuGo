import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Checkout = () => {
  const { cartItems, cartShop, clearCart } = useCart();
  const [address, setAddress] = useState("Fetching registered address...");
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculation, setCalculation] = useState(null);
  const [calcLoading, setCalcLoading] = useState(true);
  const [calcError, setCalcError] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
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
    const fetchSlots = async () => {
      try {
        const res = await api.get("/orders/available-slots");
        setAvailableSlots(res.data || []);
      } catch (error) {
        console.error("Failed to load delivery slots", error);
      }
    };
    fetchProfile();
    fetchSlots();
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

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast.error("Please enter delivery address");
      return;
    }

    if (!selectedSlotId) {
      toast.error("Please select a delivery slot");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        shop_id: cartShop.id,
        category: cartShop.category,
        delivery_slot_id: selectedSlotId,
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
                  className="flex justify-between text-sm text-neutral-light"
                >
                  <span className="flex flex-col">
                    <span>
                      {item.quantity} x {item.name}
                    </span>
                    {item.price !== discountedPrice && (
                      <span className="text-[10px] text-accent font-bold">
                        Deducted: ₹{(item.price - discountedPrice).toFixed(2)} /
                        unit
                      </span>
                    )}
                  </span>
                  <div className="text-right">
                    {item.price !== discountedPrice && (
                      <div className="text-[10px] line-through opacity-50 text-white">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    )}
                    <span className="text-white font-bold">
                      ₹{(discountedPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-neutral-mid pt-2 space-y-1 text-sm">
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
                  <span>Item Total</span>
                  <span>₹{calculation.subtotal_amount?.toFixed(2)}</span>
                </div>
                {calculation.product_discount_amount > 0 && (
                  <div className="flex justify-between text-accent font-bold">
                    <span>Product Discount</span>
                    <span>
                      -₹{calculation.product_discount_amount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between mb-2 pt-2 border-t border-neutral-mid font-medium text-white">
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
                    <span>
                      -₹{calculation.shop_discount_amount?.toFixed(2)}
                    </span>
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
                    <span>
                      -₹{calculation.platform_discount_amount?.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-light">
                  <span>Delivery Fee</span>
                  <span>₹{calculation.delivery_fee?.toFixed(2)}</span>
                </div>
                {calculation.is_small_order && (
                  <div className="flex justify-between text-orange-400">
                    <span>Min Order Extra Charge</span>
                    <span>₹{calculation.extra_charge?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-neutral-mid mt-2 text-white">
                  <span>Final Payable Amount</span>
                  <span>₹{calculation.total_payable?.toFixed(2)}</span>
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

          <h2 className="text-lg font-bold mb-4 text-accent">Delivery Slot</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {availableSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlotId(slot.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedSlotId === slot.id
                    ? "bg-accent/20 border-accent text-accent"
                    : "bg-primary border-neutral-mid text-neutral-light hover:border-neutral-light"
                }`}
              >
                <p className="text-xs font-bold uppercase mb-1">{slot.name}</p>
                <p className="text-[10px] opacity-70">
                  {slot.start_time} - {slot.end_time}
                </p>
              </button>
            ))}
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
                : `Place Order (₹${calculation ? calculation.total_payable?.toFixed(2) : "-"})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
