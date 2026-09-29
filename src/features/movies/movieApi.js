import axios from 'axios';
import { createApi } from '@reduxjs/toolkit/query/react';

const baseUrl = 'https://api.themoviedb.org/3';

export async function axiosBaseQuery({ url, params }, { signal }) {
  const token = process.env.REACT_APP_TMDB_READ_ACCESS_TOKEN;

  if (!token) {
    return {
      error: { status: 'CUSTOM_ERROR', data: 'TMDb access token is not configured.' },
    };
  }

  try {
    const response = await axios.get(`${baseUrl}${url}`, {
      params,
      signal,
      headers: { Authorization: `Bearer ${token}` },
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
  }),
});

export const { useGetTrendingMoviesQuery, useSearchMoviesInfiniteQuery } = movieApi;
