import { configureStore } from "@reduxjs/toolkit";
import authReducer, { getUserProfile, fetchUserOrders } from "../features/authSlice";
import productsReducer from "../features/productsSlice";
import cartReducer, { fetchUserCart } from "../features/cartSlice";
import adminReducer from "../features/adminSlice";
import commentsReducer from "../features/commentsSlice";
import wishlistReducer from "../features/WishlistSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    admin: adminReducer,
    comments: commentsReducer,
    wishlist: wishlistReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Initialize auth state by fetching user profile and cart if token exists
const userToken = localStorage.getItem("userToken");
if (userToken) {
  console.log('=== INITIALIZING STORE ===');
  console.log('Token found:', userToken.substring(0, 20) + '...');
  
  // Fetch user profile first to ensure authentication is set up
  store.dispatch(getUserProfile()).then(() => {
    console.log('✓ Profile fetched, now fetching cart and orders...');
    // After profile is loaded, fetch the cart and orders
    store.dispatch(fetchUserCart()).then(() => {
      console.log('✓ Cart fetched successfully');
    }).catch((err) => {
      console.error('✗ Cart fetch error:', err);
    });
    store.dispatch(fetchUserOrders()).then(() => {
      console.log('✓ Orders fetched successfully');
    }).catch((err) => {
      console.error('✗ Orders fetch error:', err);
    });
  }).catch((err) => {
    // Even if profile fetch fails, try to fetch cart (token might still be valid)
    console.error('Profile fetch failed, attempting cart and orders fetch anyway:', err);
    store.dispatch(fetchUserCart()).then(() => {
      console.log('✓ Cart fetched successfully (after profile fail)');
    }).catch((err2) => {
      console.error('✗ Cart fetch also failed:', err2);
    });
    store.dispatch(fetchUserOrders()).then(() => {
      console.log('✓ Orders fetched successfully (after profile fail)');
    }).catch((err2) => {
      console.error('✗ Orders fetch also failed:', err2);
    });
  });
}

export default store;
