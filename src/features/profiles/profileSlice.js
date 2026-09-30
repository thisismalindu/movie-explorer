import { createSlice } from '@reduxjs/toolkit';

const profileSlice = createSlice({
  name: 'profile',
  initialState: null,
  reducers: {
    profileOpened: (_, action) => ({ username: action.payload.username, data: action.payload.data }),
    profileUpdated: (state, action) => (state ? { ...state, data: action.payload } : state),
    favoriteToggled: (state, action) => {
      if (!state) return;
      const index = state.data.favorites.findIndex((movie) => movie.id === action.payload.id);
      if (index >= 0) state.data.favorites.splice(index, 1);
      else state.data.favorites.push(action.payload);
    },
    searchChanged: (state, action) => {
      if (state) state.data.lastSearch = action.payload;
    },
    themeChanged: (state, action) => {
      if (state) state.data.theme = action.payload;
    },
    profileCleared: () => null,
  },
});

export const {
  profileOpened,
  profileUpdated,
  favoriteToggled,
  searchChanged,
  themeChanged,
  profileCleared,
} = profileSlice.actions;
export default profileSlice.reducer;
