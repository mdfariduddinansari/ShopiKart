import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// Fetch wishlist from backend
export const fetchWishlist = createAsyncThunk("wishlist/fetchWishlist", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/users/wishlist");
    return data;
  } catch (err) {
    return rejectWithValue(err.message || "Failed to fetch wishlist");
  }
});

// Add product to wishlist
export const addToWishlist = createAsyncThunk("wishlist/addToWishlist", async (productId, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/users/wishlist/add", { productId });
    return data;
  } catch (err) {
    return rejectWithValue(err.message || "Failed to add to wishlist");
  }
});

// Remove product from wishlist
export const removeFromWishlist = createAsyncThunk("wishlist/removeFromWishlist", async (productId, { rejectWithValue }) => {
  try {
    const { data } = await api.delete("/users/wishlist/remove", { data: { productId } });
    return data;
  } catch (err) {
    return rejectWithValue(err.message || "Failed to remove from wishlist");
  }
});

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeFromWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default wishlistSlice.reducer;
