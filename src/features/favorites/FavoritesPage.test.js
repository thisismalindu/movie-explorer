import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { createAppStore } from '../../app/store';
import MovieCard from '../movies/MovieCard';
import ProfileSessionProvider, { useProfileSession } from '../profiles/ProfileSessionProvider';
import { openProfile, saveProfile } from '../profiles/profileStorage';
import FavoritesPage from './FavoritesPage';

jest.mock('../profiles/profileStorage', () => ({
  createProfile: jest.fn(),
  openProfile: jest.fn(),
  saveProfile: jest.fn(),
}));

const movie = {
  id: 42,
  title: 'Arrival',
  poster_path: '/arrival.jpg',
  release_date: '2016-11-10',
  vote_average: 7.6,
};
const emptyProfile = { favorites: [], lastSearch: '', theme: 'light' };
const clone = (value) => JSON.parse(JSON.stringify(value));

function Harness() {
  const session = useProfileSession();
  const location = useLocation();
  return (
    <>
      <output data-testid="location">{location.pathname}</output>
      <output data-testid="username">{session.profile?.username || 'logged out'}</output>
      <output data-testid="favorite-count">{session.profile?.data.favorites.length || 0}</output>
      <button onClick={() => session.unlock('alex', 'password')}>Unlock Alex</button>
      <button onClick={() => session.unlock('sam', 'password')}>Unlock Sam</button>
      <button onClick={session.logout}>Log out</button>
      <Link to="/favorites">Go to Favorites</Link>
      <MovieCard movie={movie} />
      <Routes>
        <Route path="/" element={<p>Home</p>} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/favorites" element={<FavoritesPage />} />
      </Routes>
    </>
  );
}

function renderHarness() {
  return render(
    <Provider store={createAppStore()}>
      <ProfileSessionProvider>
        <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Harness />
        </MemoryRouter>
      </ProfileSessionProvider>
    </Provider>
  );
}

let profiles;
beforeEach(() => {
  profiles = new Map([['alex', clone(emptyProfile)], ['sam', clone(emptyProfile)]]);
  openProfile.mockImplementation(async (username) => ({
    username,
    key: username,
    payload: clone(profiles.get(username)),
  }));
  saveProfile.mockImplementation(async (username, _key, payload) => {
    profiles.set(username, clone(payload));
  });
});

test('requires login to save and the login link does not trigger the movie card', () => {
  renderHarness();

  fireEvent.click(screen.getByRole('link', { name: 'Log in to save' }));

  expect(screen.getByTestId('location')).toHaveTextContent('/login');
  expect(screen.getByText('Login page')).toBeInTheDocument();
});

test('adds from a card, removes on Favorites, and does not follow the card link', async () => {
  renderHarness();
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Alex' }));
  await screen.findByText('alex', { selector: 'output' });
  fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));

  await waitFor(() => expect(screen.getByTestId('favorite-count')).toHaveTextContent('1'));
  expect(screen.getByTestId('location')).toHaveTextContent('/');
  expect(screen.getByRole('button', { name: 'Remove from favorites' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: 'Go to Favorites' }));
  expect(screen.getAllByRole('link', { name: /Arrival/ }).some((link) => link.getAttribute('href') === '/movies/42'))
    .toBe(true);
  fireEvent.click(screen.getAllByRole('button', { name: 'Remove from favorites' }).at(-1));

  expect(await screen.findByText('You have not added any favorites yet.')).toBeInTheDocument();
});

test('keeps favorites separate between profiles after logout and unlock', async () => {
  renderHarness();
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Alex' }));
  await screen.findByText('alex', { selector: 'output' });
  fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));
  await waitFor(() => expect(profiles.get('alex').favorites).toHaveLength(1));
  fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
  await screen.findByText('logged out', { selector: 'output' });

  fireEvent.click(screen.getByRole('button', { name: 'Unlock Sam' }));
  await screen.findByText('sam', { selector: 'output' });
  expect(screen.getByTestId('favorite-count')).toHaveTextContent('0');
  fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
  await screen.findByText('logged out', { selector: 'output' });
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Alex' }));

  expect(await screen.findByTestId('favorite-count')).toHaveTextContent('1');
  expect(screen.getByRole('button', { name: 'Remove from favorites' })).toBeInTheDocument();
});
