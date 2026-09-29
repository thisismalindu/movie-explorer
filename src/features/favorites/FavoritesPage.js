import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import MovieGrid from '../movies/MovieGrid';
import { useProfileSession } from '../profiles/ProfileSessionProvider';

export default function FavoritesPage() {
  const session = useProfileSession();
  const profile = session?.profile;

  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">Favorites</Typography>
      {session?.isRestoring ? (
        <CircularProgress aria-label="Restoring profile" />
      ) : !profile ? (
        <Alert severity="info">
          Log in to view and save favorites. <Link component={RouterLink} to="/login">Log in</Link>
        </Alert>
      ) : profile.data.favorites.length ? (
        <MovieGrid movies={profile.data.favorites} />
      ) : (
        <Alert severity="info">You have not added any favorites yet.</Alert>
      )}
    </Stack>
  );
}
