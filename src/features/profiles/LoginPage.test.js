import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { createAppStore } from '../../app/store';
import ProfileSessionProvider from './ProfileSessionProvider';
import { createProfile, openProfile } from './profileStorage';

jest.mock('axios', () => ({ get: jest.fn() }));
jest.mock('./profileStorage', () => ({
  normalizeUsername: (username) => username.trim().toLowerCase(),
  createProfile: jest.fn(),
  openProfile: jest.fn(),
  saveProfile: jest.fn().mockResolvedValue(),
}));

const opened = {
  username: 'alex',
  key: { type: 'secret-key' },
  payload: { favorites: [], lastSearch: '', theme: 'light' },
};

function renderApp() {
  return render(
    <Provider store={createAppStore()}>
      <ProfileSessionProvider>
      <MemoryRouter initialEntries={['/login']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /></MemoryRouter>
      </ProfileSessionProvider>
    </Provider>
  );
}

function fillCredentials({ username = ' Alex ', password = 'pass phrase', confirmation = 'pass phrase' } = {}) {
  fireEvent.change(screen.getByLabelText(/Username/), { target: { value: username } });
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: password } });
  if (screen.queryByLabelText(/Confirm password/)) {
    fireEvent.change(screen.getByLabelText(/Confirm password/), { target: { value: confirmation } });
  }
}

beforeEach(() => {
  axios.get.mockResolvedValue({ data: { results: [] } });
  createProfile.mockReset().mockResolvedValue(opened);
  openProfile.mockReset().mockResolvedValue(opened);
});

test('requires matching password confirmation and clears password fields', () => {
  renderApp();
  fireEvent.click(screen.getByRole('button', { name: 'Create profile' }));
  fillCredentials({ confirmation: 'different' });
  fireEvent.click(screen.getAllByRole('button', { name: 'Create profile' }).at(-1));

  expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  expect(createProfile).not.toHaveBeenCalled();
  expect(screen.getByLabelText(/^Password/)).toHaveValue('');
  expect(screen.getByLabelText(/Confirm password/)).toHaveValue('');
  expect(screen.getByText(/Clearing site data deletes it/)).toBeInTheDocument();
});

test('creates a profile, navigates home, and shows header logout', async () => {
  const { unmount } = renderApp();
  fireEvent.click(screen.getByRole('button', { name: 'Create profile' }));
  fillCredentials();
  fireEvent.click(screen.getAllByRole('button', { name: 'Create profile' }).at(-1));

  expect(await screen.findByRole('heading', { name: 'Movie Explorer' })).toBeInTheDocument();
  expect(createProfile).toHaveBeenCalledWith(' Alex ', 'pass phrase');
  expect(screen.getByText('alex')).toBeInTheDocument();

  unmount();
  renderApp();
  expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  fillCredentials({ username: 'alex' });
  fireEvent.click(screen.getAllByRole('button', { name: 'Log in' }).at(-1));
  expect(await screen.findByRole('heading', { name: 'Movie Explorer' })).toBeInTheDocument();
  expect(openProfile).toHaveBeenCalledWith('alex', 'pass phrase');
  fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
  await waitFor(() => expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument());
  expect(screen.getByRole('heading', { name: 'Movie Explorer' })).toBeInTheDocument();
});

test('reports duplicate-profile errors and allows switching to login', async () => {
  createProfile.mockRejectedValueOnce(new Error('A profile with this username already exists.'));
  renderApp();
  fireEvent.click(screen.getByRole('button', { name: 'Create profile' }));
  fillCredentials();
  fireEvent.click(screen.getAllByRole('button', { name: 'Create profile' }).at(-1));
  expect(await screen.findByText('A profile with this username already exists.')).toBeInTheDocument();
  expect(screen.getByLabelText(/^Password/)).toHaveValue('');

  openProfile.mockResolvedValue(opened);
  fireEvent.click(screen.getAllByRole('button', { name: 'Log in' }).at(-1));
  fillCredentials({ username: 'alex' });
  fireEvent.click(screen.getAllByRole('button', { name: 'Log in' }).at(-1));
  expect(await screen.findByRole('heading', { name: 'Movie Explorer' })).toBeInTheDocument();
  expect(openProfile).toHaveBeenCalledWith('alex', 'pass phrase');
});

test('disables submission while unlocking', async () => {
  let finishUnlock;
  openProfile.mockImplementation(() => new Promise((resolve) => { finishUnlock = resolve; }));
  renderApp();
  fillCredentials({ username: 'alex' });
  fireEvent.click(screen.getAllByRole('button', { name: 'Log in' }).at(-1));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Please wait…' })).toBeDisabled());
  expect(screen.getByLabelText(/^Password/)).toBeDisabled();
  finishUnlock(opened);
  expect(await screen.findByRole('heading', { name: 'Movie Explorer' })).toBeInTheDocument();
});

test('shows an incorrect-password error', async () => {
  openProfile.mockRejectedValueOnce(new Error('Unable to unlock profile. Check your password.'));
  renderApp();
  fillCredentials({ username: 'alex', password: 'wrong' });
  fireEvent.click(screen.getAllByRole('button', { name: 'Log in' }).at(-1));

  expect(await screen.findByRole('alert')).toHaveTextContent('Check your password');
  expect(screen.getByLabelText(/^Password/)).toHaveValue('');
});
