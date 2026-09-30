import { configureStore } from '@reduxjs/toolkit';
import { movieApi } from '../features/movies/movieApi';

export const createAppStore = () => configureStore({
  reducer: { [movieApi.reducerPath]: movieApi.reducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(movieApi.middleware),
});

export const store = createAppStore();
