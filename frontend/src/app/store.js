


import { configureStore } from "@reduxjs/toolkit";
import authReducer, { getUserProfile, fetchUserOrders } from "../features/authSlice";
import productsReducer from "../features/productsSlice";
import cartReducer from "../features/cartSlice";
import adminReducer from "../features/adminSlice";
import wishlistReducer from "../features/WishlistSlice";
import commentsReducer from "../features/commentsSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    admin: adminReducer,
    comments: commentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, 
    }),
});


const token = localStorage.getItem("userToken");
if (token) {
  store.dispatch(getUserProfile());
  store.dispatch(fetchUserOrders());
}

export default store;

