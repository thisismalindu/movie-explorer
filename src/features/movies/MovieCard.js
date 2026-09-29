import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import MoviePoster from './MoviePoster';
import FavoriteButton from './FavoriteButton';

export default function MovieCard({ movie }) {
  const year = movie.release_date?.slice(0, 4) || 'Release date unavailable';
  const rating = Number.isFinite(movie.vote_average)
    ? `${movie.vote_average.toFixed(1)} / 10`
    : 'Not rated';

  return (
    <Card>
      <CardActionArea component={RouterLink} to={`/movies/${movie.id}`}>
        <MoviePoster path={movie.poster_path} title={movie.title} />
        <CardContent>
          <Typography component="h3" variant="h6" gutterBottom>{movie.title}</Typography>
          <Typography color="text.secondary">{year}</Typography>
          <Typography color="text.secondary">Rating: {rating}</Typography>
        </CardContent>
      </CardActionArea>
      <CardActions><FavoriteButton movie={movie} /></CardActions>
    </Card>
  );
}
