import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, category = 'all', keyword = '', minPrice = 0, maxPrice = 999999, sort = '-featured', limit } = params;
      const { data } = await api.get('/products', {
        params: {
          page,
          category,
          keyword,
          minPrice,
          maxPrice,
          sort,
          ...(limit && { limit }),
        },
      });
      return data;
    } catch (error) {
      // Handle both error.message (from interceptor) and error.response?.data?.message
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to fetch products. Make sure the backend server is running on http://localhost:5000';
      console.error('Fetch Products Error:', errorMessage, error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/products/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const initialState = {
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
  page: 1,
  pages: 1,
  total: 0,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both array response and object response with pagination
        if (Array.isArray(action.payload)) {
          state.products = action.payload;
          state.page = 1;
          state.pages = 1;
          state.total = action.payload.length;
        } else {
          state.products = action.payload.products || [];
          state.page = action.payload.page || 1;
          state.pages = action.payload.pages || 1;
          state.total = action.payload.total || 0;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single product
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedProduct, clearError } = productsSlice.actions;
export default productsSlice.reducer;
