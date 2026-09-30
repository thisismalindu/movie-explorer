import { createProfile, openProfile, saveProfile } from './profileStorage';

beforeEach(() => localStorage.clear());

test('creates, updates, and reopens an encrypted profile', async () => {
  const profile = await createProfile('  Alex ', 'correct horse');
  const updated = { ...profile.payload, lastSearch: 'arrival', theme: 'dark' };
  await saveProfile(profile.username, profile.key, updated);

  await expect(openProfile('ALEX', 'correct horse')).resolves.toMatchObject({
    username: 'alex',
    payload: updated,
  });
  expect(localStorage.getItem('movie-explorer:profile:alex')).not.toContain('arrival');
});

test('rejects a wrong password without changing the stored record', async () => {
  await createProfile('alex', 'correct horse');
  const before = localStorage.getItem('movie-explorer:profile:alex');

  await expect(openProfile('alex', 'wrong password')).rejects.toThrow('Unable to unlock profile');
  expect(localStorage.getItem('movie-explorer:profile:alex')).toBe(before);
});

test('rejects modified ciphertext without changing it', async () => {
  await createProfile('alex', 'correct horse');
  const record = JSON.parse(localStorage.getItem('movie-explorer:profile:alex'));
  record.ciphertext = `${record.ciphertext.slice(0, -2)}AA`;
  const tampered = JSON.stringify(record);
  localStorage.setItem('movie-explorer:profile:alex', tampered);

  await expect(openProfile('alex', 'correct horse')).rejects.toThrow('Unable to unlock profile');
  expect(localStorage.getItem('movie-explorer:profile:alex')).toBe(tampered);
});

test('uses a fresh IV for every save', async () => {
  const profile = await createProfile('alex', 'correct horse');
  const first = JSON.parse(localStorage.getItem('movie-explorer:profile:alex')).cipher.iv;
  await saveProfile(profile.username, profile.key, { ...profile.payload, lastSearch: 'alien' });
  const second = JSON.parse(localStorage.getItem('movie-explorer:profile:alex')).cipher.iv;

  expect(second).not.toBe(first);
});

test('normalizes usernames, rejects duplicates, and keeps profiles separate', async () => {
  const alex = await createProfile(' Alex ', 'alex password');
  const sam = await createProfile('Sam', 'sam password');
  await saveProfile(alex.username, alex.key, { ...alex.payload, lastSearch: 'Arrival' });
  await saveProfile(sam.username, sam.key, { ...sam.payload, lastSearch: 'Dune' });

  await expect(createProfile('ALEX', 'another password')).rejects.toThrow('already exists');
  await expect(openProfile(' alex ', 'alex password')).resolves.toMatchObject({
    payload: expect.objectContaining({ lastSearch: 'Arrival' }),
  });
  await expect(openProfile('sam', 'sam password')).resolves.toMatchObject({
    payload: expect.objectContaining({ lastSearch: 'Dune' }),
  });
});
