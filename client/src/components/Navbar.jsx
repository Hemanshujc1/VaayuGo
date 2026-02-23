import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import logo from "../assets/vaayulogo.jpeg";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="bg-primary text-primary-text shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="VaayuGo Logo"
              className="h-10 w-10 rounded-full border-2 border-accent object-cover group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-bold tracking-tight">
              Vaayu<span className="text-accent">GO</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="hover:text-accent transition-colors font-medium"
            >
              Home
            </Link>

            <Link
              to="/company"
              className="hover:text-accent transition-colors font-medium"
            >
              About & Contact
            </Link>

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative hover:text-accent transition-colors"
            >
              <span className="text-2xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-danger text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth Controls */}
            {user ? (
              <div className="flex items-center gap-4">
                <span className="hidden md:block text-sm text-neutral-light">
                  Hi, {user.username}
                </span>
                <Link
                  to="/my-orders"
                  className="hover:text-accent transition-colors font-medium"
                >
                  Orders
                </Link>
                <Link
                  to="/profile"
                  className="hover:text-accent transition-colors font-medium"
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="bg-neutral-mid hover:bg-neutral-dark text-white px-4 py-2 rounded text-sm transition-colors border border-neutral-mid hover:border-accent"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-neutral-light hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-accent text-primary font-bold px-4 py-2 rounded hover:bg-secondary hover:text-white transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
