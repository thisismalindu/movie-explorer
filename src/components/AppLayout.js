import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, NavLink, Route, Routes } from 'react-router-dom';
import FavoritesPage from '../features/favorites/FavoritesPage';
import LoginPage from '../features/profiles/LoginPage';
import { HomePage, MovieDetailsPage } from '../features/movies/MoviePages';

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
              ['Login', '/login'],
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
