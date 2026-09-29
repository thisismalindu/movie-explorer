import Box from '@mui/material/Box';
import MovieCard from './MovieCard';

export default function MovieGrid({ movies }) {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: 'repeat(2, minmax(0, 1fr))',
        sm: 'repeat(3, minmax(0, 1fr))',
        md: 'repeat(4, minmax(0, 1fr))',
      },
      gap: 2,
    }}>
      {movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
    </Box>
  );
}
