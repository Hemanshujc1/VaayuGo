import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/shared/Login";
import Register from "./pages/shared/Register";
import ForgotPassword from "./pages/shared/ForgotPassword";
import VerifyEmail from "./pages/shared/VerifyEmail";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import LoadingSpinner from "./components/shared/LoadingSpinner";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ShopDashboard from "./pages/shopkeeper/ShopDashboard";
import ShopEarnings from "./pages/shopkeeper/ShopEarnings";
import ShopRegister from "./pages/shopkeeper/ShopRegister";
import Home from "./pages/customer/Home";
import ShopDetails from "./pages/shared/ShopDetails";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import MyOrders from "./pages/customer/MyOrders";
import ShopOrders from "./pages/shopkeeper/ShopOrders";
import OrderDetail from "./pages/shared/OrderDetail";
import ProductManager from "./components/shopkeeper/ProductManager";
import AdminShops from "./pages/admin/AdminShops";
import AdminLocations from "./pages/admin/AdminLocations";
import AdminDeliverySlots from "./pages/admin/AdminDeliverySlots";
import AdminGlobalRules from "./pages/admin/AdminGlobalRules";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLayout from "./components/admin/AdminLayout";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminShopDetails from "./pages/admin/AdminShopDetails";
import AdminShopProducts from "./pages/admin/AdminShopProducts";
import AdminShopOrders from "./pages/admin/AdminShopOrders";
import AdminCustomerDetails from "./pages/admin/AdminCustomerDetails";
import ShopProfile from "./pages/shopkeeper/ShopProfile";
import ShopLayout from "./components/shopkeeper/ShopLayout";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CompanyOverview from "./pages/shared/CompanyOverview";
import CustomerLayout from "./components/customer/CustomerLayout";
import ShopBulkUpload from "./pages/shopkeeper/ShopBulkUpload";
import AdminBulkUpload from "./pages/admin/AdminBulkUpload";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminDiscountRules from "./pages/admin/AdminDiscountRules";
import AdminSettlements from "./pages/admin/AdminSettlements";
import AdminPenalties from "./pages/admin/AdminPenalties";

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Customer Routes (Public & Protected mixed for layout) */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop/:id" element={<ShopDetails />} />
          <Route path="/company" element={<CompanyOverview />} />

          <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/my-orders/:id" element={<OrderDetail />} />
            <Route path="/profile" element={<CustomerProfile />} />
          </Route>
        </Route>

        {/* Shopkeeper Routes */}
        <Route element={<ProtectedRoute allowedRoles={["shopkeeper"]} />}>
          <Route path="/shop" element={<ShopLayout />}>
            <Route path="dashboard" element={<ShopDashboard />} />
            <Route path="products" element={<ProductManager />} />
            <Route path="orders" element={<ShopOrders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="earnings" element={<ShopEarnings />} />
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
            <Route
              path="/admin/shops/:id/products"
              element={<AdminShopProducts />}
            />
            <Route
              path="/admin/shops/:id/orders"
              element={<AdminShopOrders />}
            />
            <Route path="/admin/orders/:id" element={<OrderDetail />} />
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
            <Route path="/admin/settlements" element={<AdminSettlements />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/penalties" element={<AdminPenalties />} />
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
