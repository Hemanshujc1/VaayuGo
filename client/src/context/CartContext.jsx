import { createContext, useState, useContext, useEffect } from "react";
import toast from "react-hot-toast";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartShop, setCartShop] = useState(null); // Ensure all items from same shop

  // Persist cart
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("vaayugo_cart");
      const savedShop = localStorage.getItem("vaayugo_cart_shop");

      if (savedCart && savedCart !== "undefined")
        setCartItems(JSON.parse(savedCart));
      if (savedShop && savedShop !== "undefined")
        setCartShop(JSON.parse(savedShop));
    } catch (e) {
      console.error("Failed to parse cart from local storage", e);
      localStorage.removeItem("vaayugo_cart");
      localStorage.removeItem("vaayugo_cart_shop");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("vaayugo_cart", JSON.stringify(cartItems));
    localStorage.setItem("vaayugo_cart_shop", JSON.stringify(cartShop));
  }, [cartItems, cartShop]);

  const addToCart = (product, shop) => {
    // Check if shop matches
    if (cartShop && cartShop.id !== shop.id) {
      if (
        !window.confirm(
          "Start a new basket? Adding items from a different shop will clear your current cart.",
        )
      ) {
        return;
      }
      clearCart();
    }

    setCartShop(shop);

    const isExisting = cartItems.find((item) => item.id === product.id);

    setCartItems((prev) => {
      if (isExisting) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    if (!isExisting) {
      toast.success("Added to cart");
    } else {
      toast.success("Quantity updated");
    }
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
    if (cartItems.length <= 1) {
      setCartShop(null);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );

    if (cartItems.length === 1 && cartItems[0].quantity + delta <= 0) {
      setCartShop(null);
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setCartShop(null);
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartShop,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
