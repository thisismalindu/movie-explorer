import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import { useProfileSession } from '../profiles/ProfileSessionProvider';

export default function FavoriteButton({ movie }) {
  const session = useProfileSession();
  const isFavorite = session?.profile?.data.favorites.some((favorite) => favorite.id === movie.id);

  if (!session?.profile) {
    return <Button component={RouterLink} to="/login">Log in to save</Button>;
  }

  return (
    <Button onClick={() => session.toggleFavorite(movie)} disabled={session.isBusy}>
      {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    </Button>
  );
}
