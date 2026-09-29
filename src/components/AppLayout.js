import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import FormControlLabel from '@mui/material/FormControlLabel';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            {!session.profile && !session.isRestoring && (
              <Button component={RouterLink} to={loginPath} color="inherit" startIcon={<LoginIcon />}>
                Login
              </Button>
            )}
            {session.isRestoring && <Typography color="inherit" sx={{ alignSelf: 'center', px: 1 }}>Restoring profile…</Typography>}
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
                <Button color="inherit" onClick={session.logout} disabled={session.isBusy} startIcon={<LogoutIcon />}>
                  Log out
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: 3, pb: 'calc(88px + env(safe-area-inset-bottom))' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Container>
      <Paper component="nav" aria-label="Main navigation" elevation={3} sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: (theme) => theme.zIndex.appBar,
        pb: 'env(safe-area-inset-bottom)',
      }}>
        <BottomNavigation
          showLabels
          value={location.pathname === '/favorites' ? '/favorites' : location.pathname.startsWith('/movies/') || location.pathname === '/' ? '/' : false}
        >
          <BottomNavigationAction component={NavLink} to="/" end label="Home" value="/" icon={<HomeOutlinedIcon />} />
          <BottomNavigationAction component={NavLink} to="/favorites" label="Favorites" value="/favorites" icon={<FavoriteBorderIcon />} />
        </BottomNavigation>
      </Paper>
    </>
  );
}
