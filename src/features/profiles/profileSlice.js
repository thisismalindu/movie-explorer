import { createSlice } from '@reduxjs/toolkit';

const profileSlice = createSlice({
  name: 'profile',
  initialState: null,
  reducers: {
    profileOpened: (_, action) => ({ username: action.payload.username, data: action.payload.data }),
    profileUpdated: (state, action) => (state ? { ...state, data: action.payload } : state),
    profileCleared: () => null,
  },
});

export const { profileOpened, profileUpdated, profileCleared } = profileSlice.actions;
export default profileSlice.reducer;
