import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import {
  createProfile, encodeKeyMaterial, openProfile, openProfileWithKey, saveProfile,
} from './profileStorage';
import {
  favoriteToggled,
  profileCleared,
  profileOpened,
  profileUpdated,
  searchChanged,
  themeChanged,
} from './profileSlice';

const ProfileSessionContext = createContext(null);
const SESSION_KEY = 'movie-explorer:session';
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
  const [isRestoring, setIsRestoring] = useState(true);
  const [sessionWarning, setSessionWarning] = useState('');

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      let saved;
      try {
        saved = sessionStorage.getItem(SESSION_KEY);
      } catch {
        if (active) setSessionWarning('This browser cannot retain the unlocked profile after refresh.');
      }
      if (!saved) {
        if (active) setIsRestoring(false);
        return;
      }
      try {
        const session = JSON.parse(saved);
        if (session.version !== 1 || typeof session.username !== 'string' || typeof session.key !== 'string') {
          throw new Error('Invalid session');
        }
        const opened = await openProfileWithKey(session.username, session.key);
        if (!active) return;
        keyRef.current = opened.key;
        usernameRef.current = opened.username;
        latestPayloadRef.current = opened.payload;
        lastObservedRef.current = JSON.stringify(opened.payload);
        dispatch(profileOpened({ username: opened.username, data: opened.payload }));
      } catch {
        try { sessionStorage.removeItem(SESSION_KEY); } catch { /* show logged-out state */ }
        if (active) setSessionWarning('The saved session could not be restored. Please log in again.');
      } finally {
        if (active) setIsRestoring(false);
      }
    }
    restoreSession();
    return () => { active = false; };
  }, [dispatch]);

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
    if (isRestoring) throw new Error('Please wait while the saved profile is restored.');
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
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
          version: 1,
          username: opened.username,
          key: encodeKeyMaterial(opened.keyMaterial),
        }));
        setSessionWarning('');
      } catch {
        setSessionWarning('This browser cannot retain the unlocked profile after refresh.');
      }
      dispatch(profileOpened({ username: opened.username, data: opened.payload }));
      return { username: opened.username, data: opened.payload };
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

  function setLastSearch(query) {
    if (!keyRef.current || busyRef.current) return false;
    dispatch(searchChanged(query));
    return true;
  }

  function setTheme(theme) {
    if (!keyRef.current || busyRef.current) return false;
    dispatch(themeChanged(theme === 'dark' ? 'dark' : 'light'));
    return true;
  }

  function updateProfile(data) {
    if (!keyRef.current || busyRef.current) return false;
    dispatch(profileUpdated(data));
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
    if (!keyRef.current || busyRef.current || isRestoring) return;
    busyRef.current = true;
    setIsBusy(true);
    try {
      await queueRef.current;
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {
        setSessionWarning('Could not clear the saved tab session. Close this tab to lock the profile.');
        return;
      }
      keyRef.current = null;
      usernameRef.current = null;
      latestPayloadRef.current = null;
      lastObservedRef.current = null;
      setSaveError('');
      dispatch(profileCleared());
      setSessionWarning('');
    } catch {
      // Keep the profile unlocked so its latest data can be retried.
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }

  return (
    <ProfileSessionContext.Provider value={{
    profile, isBusy, isSaving, saveError, isRestoring, sessionWarning,
    create, unlock, logout, retrySave,
      updateProfile,
      toggleFavorite,
      setLastSearch,
      setTheme,
    }}>
      {saveError && (
        <Alert severity="error" action={<Button color="inherit" onClick={retrySave}>Retry save</Button>}>
          {saveError}
        </Alert>
      )}
      {sessionWarning && <Alert severity="warning">{sessionWarning}</Alert>}
      {children}
    </ProfileSessionContext.Provider>
  );
}
