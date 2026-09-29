import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { createProfile, openProfile, saveProfile } from './profileStorage';
import { favoriteToggled, profileCleared, profileOpened, profileUpdated } from './profileSlice';

const ProfileSessionContext = createContext(null);
export const useProfileSession = () => useContext(ProfileSessionContext);

export default function ProfileSessionProvider({ children }) {
  const dispatch = useDispatch();
  const store = useStore();
  const profile = useSelector((state) => state.profile);
  const keyRef = useRef(null);
  const usernameRef = useRef(null);
  const queueRef = useRef(Promise.resolve());
  const lastObservedRef = useRef(null);
  const latestPayloadRef = useRef(null);
  const pendingCount = useRef(0);
  const busyRef = useRef(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  function enqueueSave(username, key, data) {
    const snapshot = JSON.parse(JSON.stringify(data));
    const serialized = JSON.stringify(snapshot);
    latestPayloadRef.current = snapshot;
    pendingCount.current += 1;
    setIsSaving(true);
    const save = queueRef.current.catch(() => {}).then(() => saveProfile(username, key, snapshot));
    queueRef.current = save;
    save.then(
      () => {
        if (JSON.stringify(latestPayloadRef.current) === serialized) setSaveError('');
      },
      (error) => setSaveError(error.message || 'Could not save profile data.')
    ).finally(() => {
      pendingCount.current -= 1;
      setIsSaving(pendingCount.current > 0);
    });
    return save;
  }

  useEffect(() => store.subscribe(() => {
    const active = store.getState().profile;
    if (!active || active.username !== usernameRef.current || !keyRef.current) return;
    const serialized = JSON.stringify(active.data);
    if (serialized === lastObservedRef.current) return;
    lastObservedRef.current = serialized;
    enqueueSave(active.username, keyRef.current, active.data);
  }), [store]);

  async function openSession(operation, username, password) {
    if (busyRef.current || keyRef.current) throw new Error('Log out before opening another profile.');
    busyRef.current = true;
    setIsBusy(true);
    try {
      const opened = await operation(username, password);
      keyRef.current = opened.key;
      usernameRef.current = opened.username;
      latestPayloadRef.current = opened.payload;
      lastObservedRef.current = JSON.stringify(opened.payload);
      setSaveError('');
      dispatch(profileOpened({ username: opened.username, data: opened.payload }));
      return opened.username;
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }

  const create = (username, password) => openSession(createProfile, username, password);
  const unlock = (username, password) => openSession(openProfile, username, password);

  function toggleFavorite(movie) {
    if (!keyRef.current || busyRef.current) return false;
    dispatch(favoriteToggled({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
    }));
    return true;
  }

  async function retrySave() {
    if (!keyRef.current || !usernameRef.current || !latestPayloadRef.current) return;
    try {
      await enqueueSave(usernameRef.current, keyRef.current, latestPayloadRef.current);
    } catch {
      // The shared save alert reports the error.
    }
  }

  async function logout() {
    if (!keyRef.current || busyRef.current) return;
    busyRef.current = true;
    setIsBusy(true);
    try {
      await queueRef.current;
      keyRef.current = null;
      usernameRef.current = null;
      latestPayloadRef.current = null;
      lastObservedRef.current = null;
      setSaveError('');
      dispatch(profileCleared());
    } catch {
      // Keep the profile unlocked so its latest data can be retried.
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }

  return (
    <ProfileSessionContext.Provider value={{
      profile, isBusy, isSaving, saveError, create, unlock, logout, retrySave,
      updateProfile: (data) => dispatch(profileUpdated(data)),
      toggleFavorite,
    }}>
      {saveError && (
        <Alert severity="error" action={<Button color="inherit" onClick={retrySave}>Retry save</Button>}>
          {saveError}
        </Alert>
      )}
      {children}
    </ProfileSessionContext.Provider>
  );
}
