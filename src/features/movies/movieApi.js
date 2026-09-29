import axios from 'axios';
import { createApi } from '@reduxjs/toolkit/query/react';

export async function axiosBaseQuery({ url, params }, { signal }) {
  try {
    const response = await axios.get('/api/tmdb', {
      params: { path: url, ...params },
      signal,
    });
    return { data: response.data };
  } catch (error) {
    return {
      error: {
        status: error.response?.status ?? 'FETCH_ERROR',
        data: error.response?.data ?? error.message,
      },
    };
  }
}

export const movieApi = createApi({
  reducerPath: 'movieApi',
  baseQuery: axiosBaseQuery,
  endpoints: (builder) => ({
    getTrendingMovies: builder.query({
      query: () => ({ url: '/trending/movie/week', params: { language: 'en-US' } }),
    }),
    searchMovies: builder.infiniteQuery({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, pages, lastPageParam) => (
          lastPageParam < Math.min(lastPage.total_pages || 1, 500)
            ? lastPageParam + 1
            : undefined
        ),
      },
      query: ({ queryArg, pageParam }) => ({
        url: '/search/movie',
        params: { query: queryArg, page: pageParam, include_adult: false, language: 'en-US' },
      }),
    }),
    getMovieDetails: builder.query({
      query: (movieId) => ({
        url: `/movie/${movieId}`,
        params: { append_to_response: 'credits,videos', language: 'en-US' },
      }),
    }),
  }),
});

export const {
  useGetTrendingMoviesQuery,
  useSearchMoviesInfiniteQuery,
  useGetMovieDetailsQuery,
} = movieApi;
