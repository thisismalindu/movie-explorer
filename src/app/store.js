import { configureStore } from '@reduxjs/toolkit';
import { movieApi } from '../features/movies/movieApi';
import profileReducer from '../features/profiles/profileSlice';

export const createAppStore = () => configureStore({
  reducer: { [movieApi.reducerPath]: movieApi.reducer, profile: profileReducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(movieApi.middleware),
});

export const store = createAppStore();
