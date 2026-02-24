import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/vaayulogo.jpeg";
import { useState } from "react";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path
      ? "bg-accent text-primary font-bold"
      : "text-neutral-light hover:bg-neutral-dark hover:text-white";
  };

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "📊" },
    { name: "Manage Shops", path: "/admin/shops", icon: "🏪" },
    { name: "Manage Customers", path: "/admin/customers", icon: "👥" },
    { name: "Service Rules", path: "/admin/rules", icon: "🛠️" },
    { name: "Locations", path: "/admin/locations", icon: "📍" },
    { name: "Delivery Slots", path: "/admin/slots", icon: "⏱️" },
  ];

  return (
    <div className="flex h-screen bg-primary">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-30 w-64 h-full bg-neutral-dark border-r border-neutral-mid transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-neutral-mid">
          <img
            src={logo}
            alt="VaayuGo Logo"
            className="h-10 w-10 rounded-full border-2 border-accent object-cover"
          />
          <span className="text-xl font-bold tracking-tight text-white">
            Vaayu<span className="text-accent">GO</span>
            <span className="text-xs block text-neutral-light font-normal">
              Admin Panel
            </span>
          </span>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded transition-all ${isActive(
                item.path,
              )}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-neutral-mid">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded bg-primary/30">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold">
              {user?.username?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">
                {user?.username}
              </p>
              <p className="text-xs text-neutral-light truncate">
                {user?.email}
              </p>
            </div>
          </div>
          {/* Profile Link in Sidebar */}
          <Link
            to="/admin/profile"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-2 rounded transition-all ${isActive(
              "/admin/profile",
            )} mb-2`}
          >
            <span className="text-xl">👤</span>
            <span>My Profile</span>
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-danger hover:bg-danger/10 rounded transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-neutral-dark border-b border-neutral-mid">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-white p-2"
          >
            ☰
          </button>
          <span className="font-bold text-white">Admin Dashboard</span>
          <div className="w-8"></div> {/* Spacer */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
