import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createAppStore } from '../../app/store';
import ProfileSessionProvider, { useProfileSession } from './ProfileSessionProvider';
import { createProfile, openProfile, saveProfile } from './profileStorage';

jest.mock('./profileStorage', () => ({
  createProfile: jest.fn(),
  openProfile: jest.fn(),
  saveProfile: jest.fn(),
}));

function SessionControls() {
  const session = useProfileSession();
  return (
    <>
      <div>{session.profile ? session.profile.username : 'Locked'}</div>
      <div>{session.profile?.data.lastSearch || ''}</div>
      <div>{session.isSaving ? 'Saving' : 'Idle'}</div>
      <button onClick={() => session.unlock('alex', 'password')}>Unlock</button>
      <button onClick={() => session.updateProfile({ ...session.profile.data, lastSearch: 'first' })}>First</button>
      <button onClick={() => session.updateProfile({ ...session.profile.data, lastSearch: 'second' })}>Second</button>
      <button onClick={session.logout}>Log out</button>
    </>
  );
}

function renderSession() {
  return render(
    <Provider store={createAppStore()}>
      <ProfileSessionProvider><SessionControls /></ProfileSessionProvider>
    </Provider>
  );
}

const openedProfile = {
  username: 'alex',
  key: { type: 'secret-key' },
  payload: { favorites: [], lastSearch: '', theme: 'light' },
};

beforeEach(() => {
  jest.clearAllMocks();
  openProfile.mockResolvedValue(openedProfile);
  createProfile.mockResolvedValue(openedProfile);
  saveProfile.mockResolvedValue();
});

test('starts locked and does not save when a profile is opened', async () => {
  renderSession();
  expect(screen.getByText('Locked')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
  expect(await screen.findByText('alex')).toBeInTheDocument();
  expect(saveProfile).not.toHaveBeenCalled();
});

test('serializes saves in update order', async () => {
  let finishFirst;
  let finishSecond;
  saveProfile
    .mockImplementationOnce(() => new Promise((resolve) => { finishFirst = resolve; }))
    .mockImplementationOnce(() => new Promise((resolve) => { finishSecond = resolve; }));
  renderSession();
  fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
  await screen.findByText('alex');

  fireEvent.click(screen.getByRole('button', { name: 'First' }));
  fireEvent.click(screen.getByRole('button', { name: 'Second' }));
  await waitFor(() => expect(saveProfile).toHaveBeenCalledTimes(1));
  expect(saveProfile).toHaveBeenCalledTimes(1);
  expect(saveProfile.mock.calls[0][2].lastSearch).toBe('first');

  await act(async () => finishFirst());
  await waitFor(() => expect(saveProfile).toHaveBeenCalledTimes(2));
  expect(saveProfile.mock.calls[1][2].lastSearch).toBe('second');
  await act(async () => finishSecond());
  await waitFor(() => expect(screen.getByText('Idle')).toBeInTheDocument());
});

test('shows save failures and retries the latest profile data', async () => {
  saveProfile.mockRejectedValueOnce(new Error('Storage is full'));
  renderSession();
  fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
  await screen.findByText('alex');
  fireEvent.click(screen.getByRole('button', { name: 'First' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Storage is full');
  fireEvent.click(screen.getByRole('button', { name: 'Retry save' }));
  await waitFor(() => expect(saveProfile).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  expect(saveProfile.mock.calls[1][2].lastSearch).toBe('first');
});

test('waits for a pending save before clearing the session on logout', async () => {
  let finishSave;
  saveProfile.mockImplementation(() => new Promise((resolve) => { finishSave = resolve; }));
  renderSession();
  fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
  await screen.findByText('alex');
  fireEvent.click(screen.getByRole('button', { name: 'First' }));
  await waitFor(() => expect(saveProfile).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
  expect(screen.getByText('alex')).toBeInTheDocument();

  await act(async () => finishSave());
  await waitFor(() => expect(screen.getByText('Locked')).toBeInTheDocument());
});

test('stays unlocked after a failed logout save and clears after retry', async () => {
  saveProfile.mockRejectedValueOnce(new Error('Storage is full'));
  renderSession();
  fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
  await screen.findByText('alex');
  fireEvent.click(screen.getByRole('button', { name: 'First' }));
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

  expect(screen.getByText('alex')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry save' }));
  await waitFor(() => expect(saveProfile).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
  await waitFor(() => expect(screen.getByText('Locked')).toBeInTheDocument());
});
