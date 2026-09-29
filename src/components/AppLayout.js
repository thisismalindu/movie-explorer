import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useProfileSession } from '../features/profiles/ProfileSessionProvider';
import FavoritesPage from '../features/favorites/FavoritesPage';
import LoginPage from '../features/profiles/LoginPage';
import HomePage from '../features/movies/HomePage';
import MovieDetailsPage from '../features/movies/MovieDetailsPage';

function NotFoundPage() {
  return (
    <>
      <Typography component="h1" variant="h4" gutterBottom>
        Page not found
      </Typography>
      <Button component={RouterLink} to="/">Go to Home</Button>
    </>
  );
}

export default function AppLayout() {
  const session = useProfileSession() || {};
  const location = useLocation();
  const loginPath = location.pathname === '/' && location.search ? `/login${location.search}` : '/login';
  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            color="inherit"
            sx={{ flexGrow: 1, color: 'common.white', textDecoration: 'none' }}
          >
            Movie Explorer
          </Typography>
          <Box component="nav" aria-label="Primary navigation" sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {[
              ['Home', '/', true],
              ['Favorites', '/favorites'],
              ...(!session.profile ? [['Login', loginPath]] : []),
            ].map(([label, to, end]) => (
              <Button
                key={to}
                component={NavLink}
                to={to}
                end={end}
                color="inherit"
                sx={{ '&[aria-current="page"]': { textDecoration: 'underline' } }}
              >
                {label}
              </Button>
            ))}
            {session.profile && (
              <>
                <FormControlLabel
                  sx={{ color: 'inherit' }}
                  control={(
                    <Switch
                      checked={session.profile.data.theme === 'dark'}
                      onChange={(event) => session.setTheme(event.target.checked ? 'dark' : 'light')}
                      disabled={session.isBusy}
                    />
                  )}
                  label="Dark mode"
                />
                <Typography color="inherit" sx={{ alignSelf: 'center', px: 1 }}>
                  {session.profile.username}
                </Typography>
                <Button color="inherit" onClick={session.logout} disabled={session.isBusy}>
                  Log out
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Container>
    </>
  );
}
