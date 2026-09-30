import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import AppTheme from '../../app/AppTheme';
import { createAppStore } from '../../app/store';
import ProfileSessionProvider, { useProfileSession } from './ProfileSessionProvider';
import { openProfile, saveProfile } from './profileStorage';

jest.mock('axios', () => ({ get: jest.fn() }));
jest.mock('./profileStorage', () => ({
  createProfile: jest.fn(),
  normalizeUsername: (username) => username.trim().toLowerCase(),
  openProfile: jest.fn(),
  saveProfile: jest.fn(),
}));

const clone = (value) => JSON.parse(JSON.stringify(value));
const initialProfiles = {
  alex: {
    username: 'alex',
    favorites: [{ id: 42, title: 'Arrival', poster_path: null, release_date: '2016-11-10', vote_average: 7.6 }],
    lastSearch: 'alien',
    theme: 'dark',
  },
  sam: { username: 'sam', favorites: [], lastSearch: 'dune', theme: 'light' },
};

function ThemeMode() {
  return <output data-testid="theme-mode">{useTheme().palette.mode}</output>;
}

function Controls() {
  const session = useProfileSession();
  return (
    <>
      <button onClick={() => session.unlock('alex', 'password')}>Unlock Alex</button>
      <button onClick={() => session.unlock('sam', 'password')}>Unlock Sam</button>
      <button onClick={session.logout}>Log out</button>
      <output data-testid="profile-data">{JSON.stringify(session.profile?.data || null)}</output>
    </>
  );
}

let profiles;
function renderThemeApp() {
  return render(
    <Provider store={createAppStore()}>
      <AppTheme>
        <ProfileSessionProvider>
          <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ThemeMode />
            <Controls />
            <App />
          </MemoryRouter>
        </ProfileSessionProvider>
      </AppTheme>
    </Provider>
  );
}

beforeEach(() => {
  axios.get.mockResolvedValue({ data: { results: [] } });
  profiles = new Map(Object.entries(initialProfiles).map(([username, profile]) => [username, clone(profile)]));
  openProfile.mockImplementation(async (username) => {
    const { username: name, ...payload } = clone(profiles.get(username));
    return { username: name, key: name, payload };
  });
  saveProfile.mockImplementation(async (username, _key, payload) => profiles.set(username, clone(payload)));
});

test('uses light mode while locked, restores the profile theme, and returns to light on logout', async () => {
  renderThemeApp();
  expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
  expect(screen.queryByRole('switch', { name: 'Dark mode' })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Unlock Alex' }));
  await screen.findByText('alex');
  expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
  expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeChecked();

  fireEvent.click(screen.getAllByRole('button', { name: 'Log out' })[0]);
  await waitFor(() => expect(screen.getByTestId('theme-mode')).toHaveTextContent('light'));
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Sam' }));
  await screen.findByText('sam');
  expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
});

test('saves theme changes without changing favorites or last search', async () => {
  renderThemeApp();
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Alex' }));
  await screen.findByText('alex');
  fireEvent.click(screen.getByRole('switch', { name: 'Dark mode' }));

  await waitFor(() => expect(profiles.get('alex').theme).toBe('light'));
  expect(screen.getByTestId('profile-data')).toHaveTextContent('"title":"Arrival"');
  expect(screen.getByTestId('profile-data')).toHaveTextContent('"lastSearch":"alien"');
  fireEvent.click(screen.getByRole('switch', { name: 'Dark mode' }));
  await waitFor(() => expect(profiles.get('alex').theme).toBe('dark'));
  expect(profiles.get('sam').theme).toBe('light');

  fireEvent.click(screen.getAllByRole('button', { name: 'Log out' })[0]);
  await waitFor(() => expect(screen.getByTestId('theme-mode')).toHaveTextContent('light'));
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Alex' }));
  await waitFor(() => expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark'));
});
