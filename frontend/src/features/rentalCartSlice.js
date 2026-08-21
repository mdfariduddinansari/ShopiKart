import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  totalPrice: 0,
};

const rentalCartSlice = createSlice({
  name: "rentalCart",
  initialState,
  reducers: {
    addToRentalCart: (state, action) => {
      const item = action.payload;
      const existingItem = state.items.find((i) => i.productId === item.productId && i.startDate === item.startDate && i.endDate === item.endDate);

      if (existingItem) {
        existingItem.quantity += item.quantity || 1;
      } else {
        state.items.push({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          rentalPrice: item.rentalPrice,
          images: item.images,
          startDate: item.startDate,
          endDate: item.endDate,
          durationDays: item.durationDays,
          totalPrice: item.totalPrice,
          quantity: item.quantity || 1,
        });
      }
      calculateTotal(state);
    },

    removeFromRentalCart: (state, action) => {
      state.items = state.items.filter((item, index) => index !== action.payload);
      calculateTotal(state);
    },

    updateRentalCartItem: (state, action) => {
      const { index, quantity } = action.payload;
      if (state.items[index]) {
        state.items[index].quantity = quantity;
        calculateTotal(state);
      }
    },

    clearRentalCart: (state) => {
      state.items = [];
      state.totalPrice = 0;
    },
  },
});

const calculateTotal = (state) => {
  state.totalPrice = state.items.reduce((total, item) => total + item.totalPrice * item.quantity, 0);
};

export const { addToRentalCart, removeFromRentalCart, updateRentalCartItem, clearRentalCart } = rentalCartSlice.actions;
export default rentalCartSlice.reducer;
