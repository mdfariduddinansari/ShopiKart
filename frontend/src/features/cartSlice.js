
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// Async thunks for server-side cart operations
export const fetchUserCart = createAsyncThunk(
  "cart/fetchUserCart",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/users/cart");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error fetching cart");
    }
  }
);

export const addToUserCart = createAsyncThunk(
  "cart/addToUserCart",
  async (item, { rejectWithValue }) => {
    try {
      console.log('=== addToUserCart THUNK ===');
      console.log('Item being sent to backend:', item);
      const { data } = await api.post("/users/cart/add", item);
      console.log('Response from backend:', data);
      return data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return rejectWithValue(error.response?.data?.message || "Error adding to cart");
    }
  }
);

export const updateUserCartItem = createAsyncThunk(
  "cart/updateUserCartItem",
  async ({ productId, quantity, variantId, price, discountPrice, discount }, { rejectWithValue }) => {
    try {
      const { data } = await api.put("/users/cart/update", { productId, quantity, variantId, price, discountPrice, discount });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error updating cart");
    }
  }
);

export const removeUserCartItem = createAsyncThunk(
  "cart/removeUserCartItem",
  async ({ productId, variantId }, { rejectWithValue }) => {
    try {
      const { data } = await api.delete("/users/cart/remove", { data: { productId, variantId } });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error removing from cart");
    }
  }
);

export const clearUserCart = createAsyncThunk(
  "cart/clearUserCart",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.delete("/users/cart/clear");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error clearing cart");
    }
  }
);

// DO NOT load cart from localStorage on init - start fresh every load
// This prevents stale products from persisting
const initialState = {
  items: [],
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Local cart operations (for non-authenticated users)
    addToCart: (state, action) => {
      const item = action.payload;
      
      console.log('=== CART ADD ===');
      console.log('Input item:', item);
      
      // Clean up the item - only store essential fields to prevent duplicates
      const cleanItem = {
        _id: item._id || item.productId,
        productId: item.productId || item._id,
        name: String(item.name || '').trim(),
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number(item.quantity || 1)),
        images: Array.isArray(item.images) ? item.images : [],
      };
      
      // Validate item has minimum required fields
      if (!cleanItem.productId || !cleanItem.name || cleanItem.price <= 0) {
        console.warn('INVALID ITEM - SKIPPING:', cleanItem);
        return;
      }

      console.log('Clean item:', cleanItem);
      
      // Find existing item
      const existingIndex = state.items.findIndex(
        (x) => (x.productId === cleanItem.productId || x._id === cleanItem.productId)
      );

      if (existingIndex !== -1) {
        // Item exists - replace quantity (don't add)
        console.log('ITEM EXISTS - REPLACING QUANTITY');
        state.items[existingIndex].quantity = cleanItem.quantity;
      } else {
        // New item - add it
        console.log('NEW ITEM - ADDING');
        state.items.push(cleanItem);
      }
      
      console.log('Cart after add:', state.items);
      
      // Save to localStorage
      try {
        localStorage.setItem("cartItems", JSON.stringify(state.items));
      } catch (e) {
        console.error("Failed to save cart:", e);
      }
    },
    removeFromCart: (state, action) => {
      const idToRemove = action.payload;
      // Check both _id and productId fields
      state.items = state.items.filter((x) => x._id !== idToRemove && x.productId !== idToRemove);
      localStorage.setItem("cartItems", JSON.stringify(state.items));
    },
    updateQuantity: (state, action) => {
      const { id, quantity, price, discountPrice } = action.payload;
      // Check both _id and productId fields
      state.items = state.items.map((item) => {
        if (item._id === id || item.productId === id) {
          const updated = { ...item, quantity };
          if (price !== undefined) updated.price = price;
          if (discountPrice !== undefined) updated.discountPrice = discountPrice;
          return updated;
        }
        return item;
      });

      localStorage.setItem("cartItems", JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem("cartItems");
    },
    // Clear local cart when user logs out
    clearLocalCart: (state) => {
      state.items = [];
      localStorage.removeItem("cartItems");
    },
  },
  extraReducers: (builder) => {
    // Fetch User Cart
    builder
      .addCase(fetchUserCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserCart.fulfilled, (state, action) => {
        state.loading = false;
        console.log('=== FETCH USER CART FULFILLED ===');
        console.log('Payload:', action.payload);
        console.log('Payload type:', typeof action.payload);
        console.log('Is array?:', Array.isArray(action.payload));
        state.items = action.payload;
        console.log('State items after:', state.items);
      })
      .addCase(fetchUserCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to User Cart
      .addCase(addToUserCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToUserCart.fulfilled, (state, action) => {
        state.loading = false;
        console.log('=== ADD TO USER CART FULFILLED ===');
        console.log('Payload:', action.payload);
        console.log('Payload type:', typeof action.payload);
        console.log('Is array?:', Array.isArray(action.payload));
        state.items = action.payload;
        console.log('State items after:', state.items);
      })
      .addCase(addToUserCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update User Cart Item
      .addCase(updateUserCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(updateUserCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove User Cart Item
      .addCase(removeUserCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeUserCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(removeUserCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear User Cart
      .addCase(clearUserCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearUserCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(clearUserCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, clearLocalCart } =
  cartSlice.actions;

export default cartSlice.reducer;


