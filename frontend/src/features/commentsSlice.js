import { createSlice } from "@reduxjs/toolkit";

const commentsSlice = createSlice({
  name: "comments",
  initialState: [],
  reducers: {
    addComment: (state, action) => {
      state.push({ id: Date.now(), ...action.payload });
    },
  },
});

export const { addComment } = commentsSlice.actions;
export default commentsSlice.reducer;
