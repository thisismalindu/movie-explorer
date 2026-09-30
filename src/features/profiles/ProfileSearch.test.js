import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import App from '../../App';
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

const blankProfile = { favorites: [], lastSearch: '', theme: 'light' };
const copy = (data) => JSON.parse(JSON.stringify(data));

function TestApp() {
  const session = useProfileSession();
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="location">{location.pathname}{location.search}</output>
      <button onClick={() => session.unlock('alex', 'password')}>Unlock Alex</button>
      <button onClick={() => session.unlock('sam', 'password')}>Unlock Sam</button>
      <button onClick={session.logout}>Log out</button>
      <button onClick={() => navigate(-1)}>Back</button>
      <button onClick={() => navigate(1)}>Forward</button>
      <App />
    </>
  );
}

function renderApp(path = '/') {
  return render(
    <Provider store={createAppStore()}>
      <ProfileSessionProvider>
        <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <TestApp />
        </MemoryRouter>
      </ProfileSessionProvider>
    </Provider>
  );
}

function submitSearch(value) {
  fireEvent.change(screen.getByRole('textbox', { name: 'Search movies' }), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
}

function login(username = 'alex') {
  fireEvent.change(screen.getByLabelText(/Username/), { target: { value: username } });
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'password' } });
  fireEvent.click(screen.getAllByRole('button', { name: 'Log in' }).at(-1));
}

let profiles;
beforeEach(() => {
  axios.get.mockResolvedValue({ data: { results: [] } });
  profiles = new Map([
    ['alex', { ...blankProfile, lastSearch: 'arrival' }],
    ['sam', { ...blankProfile, lastSearch: 'dune' }],
  ]);
  openProfile.mockImplementation(async (username) => ({
    username,
    key: username,
    payload: copy(profiles.get(username)),
  }));
  saveProfile.mockImplementation(async (username, _key, data) => profiles.set(username, copy(data)));
});

test('saves submitted and cleared searches but not drafts or browser navigation', async () => {
  renderApp();
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Alex' }));
  await screen.findByText('alex');

  submitSearch('  alien  ');
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/?q=alien'));
  await waitFor(() => expect(profiles.get('alex').lastSearch).toBe('alien'));
  fireEvent.change(screen.getByRole('textbox', { name: 'Search movies' }), { target: { value: 'draft' } });
  expect(profiles.get('alex').lastSearch).toBe('alien');
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));

  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/'));
  expect(screen.getByRole('textbox', { name: 'Search movies' })).toHaveValue('');
  expect(profiles.get('alex').lastSearch).toBe('alien');
  fireEvent.click(screen.getByRole('button', { name: 'Forward' }));
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/?q=alien'));
  expect(screen.getByRole('textbox', { name: 'Search movies' })).toHaveValue('alien');
  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/'));
  await waitFor(() => expect(profiles.get('alex').lastSearch).toBe(''));
});

test('restores the saved query at login while an explicit login URL query takes precedence', async () => {
  renderApp('/?q=from-url');
  fireEvent.click(screen.getByRole('link', { name: 'Login' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/login?q=from-url');
  login();

  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/?q=from-url'));
  expect(screen.getByRole('textbox', { name: 'Search movies' })).toHaveValue('from-url');
  expect(profiles.get('alex').lastSearch).toBe('arrival');
});

test('restores a saved search without an explicit URL query and honors an empty q', async () => {
  const { unmount } = renderApp('/login');
  login();
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/?q=arrival'));
  unmount();

  renderApp('/login?q=');
  login();
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/?q='));
  expect(screen.getByRole('heading', { level: 2, name: 'Trending this week' })).toBeInTheDocument();
});

test('keeps each profile search independent', async () => {
  renderApp('/');
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Alex' }));
  await screen.findByText('alex');
  submitSearch('arrival');
  await waitFor(() => expect(profiles.get('alex').lastSearch).toBe('arrival'));
  fireEvent.click(screen.getAllByRole('button', { name: 'Log out' })[0]);
  await screen.findByRole('link', { name: 'Login' });
  fireEvent.click(screen.getByRole('button', { name: 'Unlock Sam' }));
  await screen.findByText('sam');
  submitSearch('dune');
  await waitFor(() => expect(profiles.get('sam').lastSearch).toBe('dune'));

  expect(profiles.get('alex').lastSearch).toBe('arrival');
  expect(profiles.get('sam').lastSearch).toBe('dune');
});
