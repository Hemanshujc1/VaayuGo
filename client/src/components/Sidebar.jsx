import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import logo from "../assets/vaayulogo.jpeg";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const location = useLocation();
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    {
      name: "Home",
      path: "/",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      name: "About & Contact",
      path: "/company",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      name: "Cart",
      path: "/cart",
      badge: cartCount > 0 ? cartCount : null,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
  ];

  if (user) {
    navLinks.push({
      name: "My Orders",
      path: "/my-orders",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
    });
    navLinks.push({
      name: "Profile",
      path: "/profile",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-neutral-dark border-r border-neutral-light/10 h-screen fixed left-0 top-0 z-50">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="VaayuGo Logo"
              className="h-12 w-12 rounded-xl object-cover group-hover:scale-105 transition-transform shadow-lg border border-neutral-light/20"
            />
            <span className="text-3xl font-extrabold tracking-tight text-white">
              Vaayu<span className="text-accent">GO</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-2 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium ${
                isActive(link.path)
                  ? "bg-linear-to-r from-accent/20 to-transparent text-accent border-l-4 border-accent"
                  : "text-neutral-light hover:bg-neutral-mid hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={
                    isActive(link.path) ? "text-accent" : "text-neutral-light"
                  }
                >
                  {link.icon}
                </span>
                {link.name}
              </div>
              {link.badge && (
                <span className="bg-accent text-primary text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-neutral-light/10">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="h-10 w-10 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold uppercase border border-accent/30">
                  {user.username ? user.username.charAt(0) : "U"}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {user.username || "Customer"}
                  </p>
                  <p className="text-xs text-neutral-light capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 bg-neutral-mid hover:bg-neutral-light/20 text-white p-3 rounded-xl transition-colors font-semibold"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full text-center bg-neutral-mid hover:bg-neutral-light/20 text-white p-3 rounded-xl transition-colors font-semibold"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block w-full text-center bg-accent hover:bg-secondary text-primary p-3 rounded-xl transition-colors font-bold shadow-lg shadow-accent/20"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-neutral-dark/95 backdrop-blur-md border-t border-neutral-light/10 z-50 px-2 py-3 flex justify-around items-center pb-safe">
        {navLinks.slice(0, 4).map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`relative flex flex-col items-center p-2 rounded-xl transition-colors ${
              isActive(link.path) ? "text-accent" : "text-neutral-light"
            }`}
          >
            {link.icon}
            <span className="text-[10px] font-medium mt-1">{link.name}</span>
            {link.badge && (
              <span className="absolute top-1 right-1 bg-accent text-primary text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {link.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
