import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useParams } from 'react-router-dom';
import { useGetMovieDetailsQuery } from './movieApi';
import MoviePoster from './MoviePoster';
import FavoriteButton from './FavoriteButton';

export default function MovieDetailsPage() {
  const { movieId: movieIdParam } = useParams();
  const movieId = Number(movieIdParam);
  const isValidId = /^\d+$/.test(movieIdParam) && Number.isSafeInteger(movieId) && movieId > 0;
  const { currentData: movie, isLoading, isError, refetch } = useGetMovieDetailsQuery(movieId, {
    skip: !isValidId,
  });

  if (!isValidId) {
    return <Alert severity="info">This movie URL is invalid.</Alert>;
  }

  if (isLoading) {
    return <CircularProgress aria-label="Loading movie details" />;
  }

  if (isError) {
    return (
      <Alert severity="error" action={<Button color="inherit" onClick={refetch}>Retry</Button>}>
        Could not load this movie. It may not be available.
      </Alert>
    );
  }

  if (!movie) {
    return <Alert severity="info">Movie details are unavailable.</Alert>;
  }

  const title = movie.title || 'Movie details';
  const releaseYear = movie.release_date?.slice(0, 4) || 'Release date unavailable';
  const rating = Number.isFinite(movie.vote_average)
    ? `${movie.vote_average.toFixed(1)} / 10`
    : 'Not rated';
  const cast = movie.credits?.cast?.slice(0, 10) || [];
  const trailerVideos = movie.videos?.results?.filter(
    (video) => video.site === 'YouTube' && video.type === 'Trailer'
  ) || [];
  const trailer = trailerVideos.find((video) => video.official) || trailerVideos[0];

  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">{title}</Typography>
      <FavoriteButton movie={movie} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(200px, 1fr) 2fr' }, gap: 2 }}>
        <Box sx={{ maxWidth: { sm: 320 } }}>
          <MoviePoster key={movie.id} path={movie.poster_path} title={title} />
        </Box>
        <Stack spacing={2}>
          <Typography>{releaseYear} · Rating: {rating}</Typography>
          <Typography component="h2" variant="h6">Overview</Typography>
          <Typography>{movie.overview || 'No overview available.'}</Typography>
          <Typography component="h2" variant="h6">Genres</Typography>
          <Typography>
            {movie.genres?.length ? movie.genres.map((genre) => genre.name).join(', ') : 'No genres available.'}
          </Typography>
          <Typography component="h2" variant="h6">Cast</Typography>
          <Typography>
            {cast.length
              ? cast.map((person) => `${person.name}${person.character ? ` as ${person.character}` : ''}`).join(' · ')
              : 'Cast information unavailable.'}
          </Typography>
          <Typography component="h2" variant="h6">Trailer</Typography>
          {trailer ? (
            <Link
              href={`https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch trailer on YouTube
            </Link>
          ) : (
            <Typography>No trailer available.</Typography>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
