import { useState } from 'react';
import Box from '@mui/material/Box';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';

export default function MoviePoster({ path, title }) {
  const [hasError, setHasError] = useState(false);
  const src = path && `https://image.tmdb.org/t/p/w342${path}`;

  if (!src || hasError) {
    return (
      <Box
        role="img"
        aria-label={`${title} poster unavailable`}
        sx={{ aspectRatio: '2 / 3', display: 'grid', placeItems: 'center', bgcolor: 'action.hover', p: 1 }}
      >
        <Typography color="text.secondary" align="center">Poster unavailable</Typography>
      </Box>
    );
  }

  return (
    <CardMedia
      component="img"
      image={src}
      alt={`${title} poster`}
      loading="lazy"
      onError={() => setHasError(true)}
      sx={{ aspectRatio: '2 / 3', objectFit: 'cover' }}
    />
  );
}
