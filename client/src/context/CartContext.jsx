/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from "react";
import toast from "react-hot-toast";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // Initialize state directly from localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem("vaayugo_cart");
      if (savedCart && savedCart !== "undefined") {
        return JSON.parse(savedCart);
      }
    } catch (e) {
      console.warn("Failed to parse cart items", e);
    }
    return [];
  });

  const [cartShop, setCartShop] = useState(() => {
    try {
      const savedShop = localStorage.getItem("vaayugo_cart_shop");
      if (savedShop && savedShop !== "undefined") {
        return JSON.parse(savedShop);
      }
    } catch (e) {
      console.warn("Failed to parse cart shop", e);
    }
    return null;
  }); // Ensure all items from same shop

  // Persist cart to local storage when state changes

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

export default CartProvider;
