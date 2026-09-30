import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { normalizeUsername } from './profileStorage';
import { useProfileSession } from './ProfileSessionProvider';

export default function LoginPage() {
  const session = useProfileSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCreating = mode === 'create';
  const isBusy = Boolean(session?.isBusy || isSubmitting);

  function changeMode(nextMode) {
    setMode(nextMode);
    setPassword('');
    setConfirmation('');
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!normalizeUsername(username) || !password) {
      setError('Enter a username and password.');
      setPassword('');
      setConfirmation('');
      return;
    }
    if (isCreating && password !== confirmation) {
      setError('Passwords do not match.');
      setPassword('');
      setConfirmation('');
      return;
    }

    setIsSubmitting(true);
    try {
      const opened = isCreating
        ? await session.create(username, password)
        : await session.unlock(username, password);
      const loginParams = new URLSearchParams(location.search);
      const search = loginParams.has('q')
        ? loginParams.get('q')
        : opened.data.lastSearch;
      navigate({ pathname: '/', search: search ? `?q=${encodeURIComponent(search)}` : (loginParams.has('q') ? '?q=' : '') });
    } catch (caught) {
      setError(caught.message || 'Could not open this profile.');
    } finally {
      setPassword('');
      setConfirmation('');
      setIsSubmitting(false);
    }
  }

  if (session?.profile) {
    return (
      <Stack spacing={2}>
        <Typography component="h1" variant="h4">Local profile</Typography>
        <Typography>Signed in as {session.profile.username}</Typography>
        <Button variant="contained" onClick={session.logout} disabled={session.isBusy}>Log out</Button>
      </Stack>
    );
  }

  return (
    <Box component="form" onSubmit={submit} sx={{ maxWidth: 420 }}>
      <Stack spacing={2}>
        <Typography component="h1" variant="h4">{isCreating ? 'Create profile' : 'Log in'}</Typography>
        <Stack direction="row" spacing={1}>
          <Button type="button" variant={isCreating ? 'outlined' : 'contained'} onClick={() => changeMode('login')}>
            Log in
          </Button>
          <Button type="button" variant={isCreating ? 'contained' : 'outlined'} onClick={() => changeMode('create')}>
            Create profile
          </Button>
        </Stack>
        <TextField
          label="Username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          disabled={isBusy}
          required
        />
        <TextField
          label="Password"
          type="password"
          autoComplete={isCreating ? 'new-password' : 'current-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isBusy}
          required
        />
        {isCreating && (
          <TextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={isBusy}
            required
          />
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {isCreating && (
          <Alert severity="info">
            This profile stays in this browser. Clearing site data deletes it, and a forgotten password cannot be recovered.
          </Alert>
        )}
        <Button type="submit" variant="contained" disabled={isBusy}>
          {isBusy ? 'Please wait…' : isCreating ? 'Create profile' : 'Log in'}
        </Button>
      </Stack>
    </Box>
  );
}
