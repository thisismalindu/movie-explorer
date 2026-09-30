import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSearchParams } from 'react-router-dom';
import { useGetTrendingMoviesQuery, useSearchMoviesInfiniteQuery } from './movieApi';
import MovieGrid from './MovieGrid';
import { useProfileSession } from '../profiles/ProfileSessionProvider';

export default function HomePage() {
  const session = useProfileSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim() || '';
  const [searchInput, setSearchInput] = useState(query);
  const { ref: sentinelRef, inView } = useInView();
  const trending = useGetTrendingMoviesQuery(undefined, { skip: Boolean(query) });
  const search = useSearchMoviesInfiniteQuery(query, { skip: !query });
  const {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = search;
  const searchPages = search.currentData?.pages;
  const searchMovies = searchPages && [...new Map(
    searchPages.flatMap((page) => page.results).map((movie) => [movie.id, movie])
  ).values()];
  const movies = query ? searchMovies : trending.currentData?.results;
  const isLoading = query
    ? search.isFetching && !search.currentData
    : trending.isLoading;
  const isError = query ? search.isError && !search.currentData : trending.isError;
  const refetch = query ? search.refetch : trending.refetch;

  useEffect(() => setSearchInput(query), [query]);

  useEffect(() => {
    if (query && inView && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      fetchNextPage();
    }
  }, [query, inView, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  function submitSearch(event) {
    event.preventDefault();
    const nextQuery = searchInput.trim();
    session?.setLastSearch(nextQuery);
    setSearchParams(nextQuery ? { q: nextQuery } : {});
  }

  function clearSearch() {
    setSearchInput('');
    session?.setLastSearch('');
    setSearchParams({});
  }

  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">Movie Explorer</Typography>
      <Box component="form" role="search" onSubmit={submitSearch} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          label="Search movies"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          fullWidth
          size="small"
        />
        <Button type="submit" variant="contained">Search</Button>
        {(query || searchInput) && <Button type="button" onClick={clearSearch}>Clear</Button>}
      </Box>
      <Typography component="h2" variant="h5">
        {query ? 'Search results' : 'Trending this week'}
      </Typography>
      {isLoading && <CircularProgress aria-label={`Loading ${query ? 'search results' : 'trending movies'}`} />}
      {isError && (
        <Alert severity="error" action={<Button color="inherit" onClick={refetch}>Retry</Button>}>
          Could not load {query ? 'search results' : 'trending movies'}.
        </Alert>
      )}
      {!isLoading && !isError && movies?.length === 0 && (
        <Alert severity="info">
          {query ? 'No movies matched your search.' : 'No trending movies are available right now.'}
        </Alert>
      )}
      {movies?.length > 0 && (
        <Box component="section" aria-label={query ? 'Search results' : 'Trending movies'}>
          <MovieGrid movies={movies} />
        </Box>
      )}
      {query && hasNextPage && (
        <Box ref={sentinelRef} aria-hidden="true" sx={{ minHeight: 1 }} />
      )}
      {query && isFetchingNextPage && (
        <CircularProgress aria-label="Loading more movies" size={24} />
      )}
      {query && isFetchNextPageError && (
        <Alert severity="error" action={
          <Button color="inherit" onClick={() => fetchNextPage()}>Retry</Button>
        }>
          Could not load more movies.
        </Alert>
      )}
    </Stack>
  );
}
