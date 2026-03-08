import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import logo from "../../assets/vaayulogo.jpeg";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="bg-primary text-primary-text shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
            onClick={closeMobileMenu}
          >
            <img
              src={logo}
              alt="VaayuGo Logo"
              className="h-10 w-10 rounded-full border-2 border-accent object-cover group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-bold tracking-tight">
              Vaayu<span className="text-accent">GO</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
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

            {/* Desktop Cart Icon */}
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

            {/* Desktop Auth Controls */}
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-light">
                  Hi, {user.name || user.username}
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

          {/* Mobile Menu Button Display */}
          <div className="flex md:hidden items-center gap-4">
            {/* Mobile Cart Icon */}
            <Link
              to="/cart"
              className="relative hover:text-accent transition-colors"
              onClick={closeMobileMenu}
            >
              <span className="text-2xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-danger text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={toggleMobileMenu}
              className="text-white hover:text-accent focus:outline-none p-2"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-neutral-dark border-t border-neutral-mid absolute w-full shadow-2xl pb-4">
          <div className="px-4 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="block px-3 py-3 rounded-md text-base font-medium text-white hover:bg-neutral-mid hover:text-accent"
            >
              Home
            </Link>
            <Link
              to="/company"
              onClick={closeMobileMenu}
              className="block px-3 py-3 rounded-md text-base font-medium text-white hover:bg-neutral-mid hover:text-accent"
            >
              About & Contact
            </Link>

            {user ? (
              <>
                <div className="px-3 py-2 border-b border-neutral-mid/50 mb-2">
                  <p className="text-sm text-neutral-light">Signed in as</p>
                  <p className="font-bold text-white truncate">
                    {user.name || user.username || user.email}
                  </p>
                </div>
                <Link
                  to="/my-orders"
                  onClick={closeMobileMenu}
                  className="block px-3 py-3 rounded-md text-base font-medium text-white hover:bg-neutral-mid hover:text-accent"
                >
                  Orders
                </Link>
                <Link
                  to="/profile"
                  onClick={closeMobileMenu}
                  className="block px-3 py-3 rounded-md text-base font-medium text-white hover:bg-neutral-mid hover:text-accent"
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="w-full text-left block px-3 py-3 rounded-md text-base font-medium text-red-400 hover:bg-red-500/20"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-4 px-3">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="text-center bg-neutral-mid text-white px-4 py-3 rounded-xl hover:bg-neutral-light transition-colors font-bold"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="text-center bg-accent text-primary px-4 py-3 rounded-xl font-bold shadow-lg hover:bg-secondary transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
