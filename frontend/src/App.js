

import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, useTheme } from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import CartPage from "./pages/CartPage";
import RentalPage from "./pages/RentalPage";
import RentalItemDetail from "./pages/RentalItemDetail";
import RentalConfirmation from "./pages/RentalConfirmation";
import RentalBookingDetail from "./pages/RentalBookingDetail";
import ProfilePage from "./pages/ProfilePage";
import OrdersPage from "./pages/OrdersPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentPage from "./pages/PaymentPage";
import WishlistPage from "./pages/WishlistPage";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminRentalBookings from "./pages/admin/AdminRentalBookings";
import AdminRentalItems from "./pages/admin/AdminRentalItems";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminReturns from "./pages/admin/AdminReturns";
import AdminIdentityVerifications from "./pages/admin/AdminIdentityVerifications";
import AdminDepositManagement from "./pages/admin/AdminDepositManagement";
import SellerDashboard from "./pages/admin/SellerDashboard";
import ProductPage from "./pages/ProductPage";
import ProductReels from "./pages/ProductReels";
import ReferralPage from "./pages/ReferralPage";
import AboutPage from "./pages/AboutPage";
import CareersPage from "./pages/CareersPage";
import ContactPage from "./pages/ContactPage";
import { ThemeContextProvider } from "./context/ThemeContext";
import { getUserProfile, fetchUserOrders } from "./features/authSlice";
import { fetchUserCart } from "./features/cartSlice";
import { fetchWishlist } from "./features/WishlistSlice";

function AppContent() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth || {});
  const theme = useTheme();

  // Fetch fresh data on app load
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch user profile, cart, wishlist, and orders from backend
      dispatch(getUserProfile());
      dispatch(fetchUserCart());
      dispatch(fetchWishlist());
      dispatch(fetchUserOrders());
    }
  }, [dispatch, isAuthenticated]);

  // If admin is logged in, show only admin portal
  if (isAuthenticated && user?.isAdmin) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: theme.palette.background.default }}>
        <Box component="main" sx={{ flex: 1, backgroundColor: theme.palette.background.default }}>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/returns" element={<AdminReturns />} />
            <Route path="/admin/rental-bookings" element={<AdminRentalBookings />} />
            <Route path="/admin/rental-items" element={<AdminRentalItems />} />
            <Route path="/admin/identity-verifications" element={<AdminIdentityVerifications />} />
            <Route path="/admin/deposit-management" element={<AdminDepositManagement />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="*" element={<Navigate to="/admin" />} />
          </Routes>
        </Box>
      </Box>
    );
  }

  // For regular users and non-authenticated
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: theme.palette.background.default }}>
      {/* Header stays on top */}
      <Header />

    {/* Main content (takes available space) */}
    <Box component="main" sx={{ flex: 1, backgroundColor: theme.palette.background.default }}>
      <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reels" element={<ProductReels />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment/:orderId" element={<PaymentPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/rental" element={<RentalPage />} />
          <Route path="/rental-item/:itemId" element={<RentalItemDetail />} />
          <Route path="/rental-confirmation/:bookingId" element={<RentalConfirmation />} />
          <Route path="/rental-booking/:bookingId" element={<RentalBookingDetail />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/referrals" element={<ReferralPage />} />
      </Routes>
    </Box>

      {/* Footer always at bottom */}
      <Footer />
    </Box>
  );
}

function App() {
  return (
    <ThemeContextProvider>
      <AppContent />
    </ThemeContextProvider>
  );
}

export default App;


