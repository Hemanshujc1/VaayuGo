import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
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
import AdminLocations from "./pages/AdminLocations";
import AdminDeliverySlots from "./pages/AdminDeliverySlots";
import AdminGlobalRules from "./pages/AdminGlobalRules";
import AdminUsers from "./pages/AdminUsers";
import AdminLayout from "./components/AdminLayout";
import AdminProfile from "./pages/AdminProfile";
import AdminCustomers from "./pages/AdminCustomers";
import AdminShopDetails from "./pages/AdminShopDetails";
import AdminCustomerDetails from "./pages/AdminCustomerDetails";
import ShopProfile from "./pages/ShopProfile";
import ShopLayout from "./components/ShopLayout";
import CustomerProfile from "./pages/CustomerProfile";
import CompanyOverview from "./pages/CompanyOverview";
import CustomerLayout from "./components/CustomerLayout";
import ShopBulkUpload from "./pages/ShopBulkUpload";
import AdminBulkUpload from "./pages/AdminBulkUpload";
import AdminCategories from "./pages/AdminCategories";
import AdminDiscountRules from "./pages/AdminDiscountRules";


function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Customer Routes (Public & Protected mixed for layout) */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop/:id" element={<ShopDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/company" element={<CompanyOverview />} />

          <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/profile" element={<CustomerProfile />} />
          </Route>
        </Route>

        {/* Shopkeeper Routes */}
        <Route element={<ProtectedRoute allowedRoles={["shopkeeper"]} />}>
          <Route path="/shop" element={<ShopLayout />}>
            <Route path="dashboard" element={<ShopDashboard />} />
            <Route path="products" element={<ProductManager />} />
            <Route path="orders" element={<ShopOrders />} />
            <Route path="profile" element={<ShopProfile />} />
            <Route path="support" element={<CompanyOverview />} />
            <Route path="register" element={<ShopRegister />} />
            <Route path="bulk-upload" element={<ShopBulkUpload />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>
        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/shops" element={<AdminShops />} />
            <Route path="/admin/shops/:id" element={<AdminShopDetails />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route
              path="/admin/customers/:id"
              element={<AdminCustomerDetails />}
            />
            <Route path="/admin/users" element={<AdminUsers />} />{" "}
            <Route path="/admin/locations" element={<AdminLocations />} />
            <Route path="/admin/slots" element={<AdminDeliverySlots />} />
            <Route path="/admin/rules" element={<AdminGlobalRules />} />
            <Route path="/admin/discounts" element={<AdminDiscountRules />} />
            <Route path="/admin/bulk-upload" element={<AdminBulkUpload />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
          </Route>
        </Route>
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
