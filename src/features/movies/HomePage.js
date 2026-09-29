import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useGetTrendingMoviesQuery } from './movieApi';
import MovieGrid from './MovieGrid';

export default function HomePage() {
  const { data, isLoading, isError, refetch } = useGetTrendingMoviesQuery();

  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">Movie Explorer</Typography>
      <Typography component="h2" variant="h5">Trending this week</Typography>
      {isLoading && <CircularProgress aria-label="Loading trending movies" />}
      {isError && (
        <Alert severity="error" action={<Button color="inherit" onClick={refetch}>Retry</Button>}>
          Could not load trending movies.
        </Alert>
      )}
      {!isLoading && !isError && data?.results?.length === 0 && (
        <Alert severity="info">No trending movies are available right now.</Alert>
      )}
      {data?.results?.length > 0 && (
        <Box component="section" aria-label="Trending movies">
          <MovieGrid movies={data.results} />
        </Box>
      )}
    </Stack>
  );
}
