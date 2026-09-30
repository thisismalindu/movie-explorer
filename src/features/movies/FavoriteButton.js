import Button from '@mui/material/Button';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LoginIcon from '@mui/icons-material/Login';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useProfileSession } from '../profiles/ProfileSessionProvider';

export default function FavoriteButton({ movie }) {
  const session = useProfileSession();
  const location = useLocation();
  const isFavorite = session?.profile?.data.favorites.some((favorite) => favorite.id === movie.id);
  const loginPath = location.pathname === '/' && location.search ? `/login${location.search}` : '/login';

  if (!session?.profile) {
    return (
      <Button component={RouterLink} to={loginPath} startIcon={<LoginIcon />} disabled={session?.isRestoring}>
        Log in to save
      </Button>
    );
  }

  return (
    <Button
      onClick={() => session.toggleFavorite(movie)}
      disabled={session.isBusy}
      startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
    >
      {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    </Button>
  );
}
