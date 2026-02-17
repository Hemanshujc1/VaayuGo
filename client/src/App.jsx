import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import LoadingSpinner from "./components/LoadingSpinner";

import AdminDashboard from "./pages/AdminDashboard";
import ShopDashboard from "./pages/ShopDashboard";
import ShopRegister from "./pages/ShopRegister";
import Home from "./pages/Home";
import ShopDetails from "./pages/ShopDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import ShopOrders from "./pages/ShopOrders";
import ProductManager from "./components/ProductManager";
import AdminShops from "./pages/AdminShops";
import AdminSettings from "./pages/AdminSettings";
import AdminUsers from "./pages/AdminUsers";

// Placeholder Dashboards
// const Home = () => {
//   const { logout } = useAuth();
//   return (
//     <div className="p-8">
//       <h1 className="text-2xl font-bold">Welcome directly to Customer Home</h1>
//       <button
//         onClick={logout}
//         className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
//       >
//         Logout
//       </button>
//     </div>
//   );
// };
// const ShopDashboard = () => <h1>Shop Dashboard</h1>;

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/shop/:id" element={<ShopDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        {/* Customer Routes */}
        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          <Route path="/" element={<Home />} />
        </Route>

        {/* Shopkeeper Routes */}
        <Route
          path="/shop/dashboard"
          element={
            <ProtectedRoute allowedRoles={["shopkeeper"]}>
              <ShopDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shop/products"
          element={
            <ProtectedRoute allowedRoles={["shopkeeper"]}>
              <ProductManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shop/orders"
          element={
            <ProtectedRoute allowedRoles={["shopkeeper"]}>
              <ShopOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shop/register"
          element={
            <ProtectedRoute allowedRoles={["shopkeeper"]}>
              <ShopRegister />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/shops" element={<AdminShops />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
