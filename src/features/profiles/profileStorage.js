const VERSION = 1;
const ITERATIONS = 600_000;
const PROFILE_PREFIX = 'movie-explorer:profile:';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const normalizeUsername = (username) => username.trim().toLowerCase();
const storageKey = (username) => `${PROFILE_PREFIX}${encodeURIComponent(normalizeUsername(username))}`;
const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

function requireCrypto() {
  if (!window.crypto?.subtle) throw new Error('Web Crypto is unavailable in this browser.');
  return window.crypto;
}

function validateCredentials(username, password) {
  const normalized = normalizeUsername(username);
  if (!normalized || !password) throw new Error('Username and password are required.');
  return normalized;
}

async function deriveKey(password, salt, iterations = ITERATIONS) {
  const crypto = requireCrypto();
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function readRecord(username) {
  const stored = localStorage.getItem(storageKey(username));
  if (!stored) throw new Error('No profile exists for this username.');

  try {
    const record = JSON.parse(stored);
    if (
      record.version !== VERSION || record.kdf?.name !== 'PBKDF2' || record.kdf?.hash !== 'SHA-256' ||
      record.kdf?.iterations !== ITERATIONS || record.cipher?.name !== 'AES-GCM' ||
      !record.kdf.salt || !record.cipher.iv || !record.ciphertext
    ) throw new Error();
    return record;
  } catch {
    throw new Error('The saved profile is invalid or uses an unsupported version.');
  }
}

export async function createProfile(username, password) {
  const normalized = validateCredentials(username, password);
  const keyName = storageKey(normalized);
  if (localStorage.getItem(keyName)) throw new Error('A profile with this username already exists.');

  const crypto = requireCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const payload = { favorites: [], lastSearch: '', theme: 'light' };
  const record = await encryptWithSalt(key, salt, payload);
  try {
    localStorage.setItem(keyName, record);
  } catch {
    throw new Error('Could not save the profile in browser storage.');
  }
  return { username: normalized, key, payload };
}

async function encryptWithSalt(key, salt, payload) {
  const crypto = requireCrypto();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(payload))
  );
  return JSON.stringify({
    version: VERSION,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt: toBase64(salt) },
    cipher: { name: 'AES-GCM', iv: toBase64(iv) },
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  });
}

export async function openProfile(username, password) {
  const normalized = validateCredentials(username, password);
  const record = readRecord(normalized);
  try {
    const salt = fromBase64(record.kdf.salt);
    const key = await deriveKey(password, salt, record.kdf.iterations);
    const plaintext = await requireCrypto().subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(record.cipher.iv) }, key, fromBase64(record.ciphertext)
    );
    return { username: normalized, key, payload: JSON.parse(decoder.decode(plaintext)) };
  } catch {
    throw new Error('Unable to unlock profile. Check your password or saved profile data.');
  }
}

export async function saveProfile(username, key, payload) {
  const record = readRecord(username);
  let stored;
  try {
    stored = await encryptWithSalt(key, fromBase64(record.kdf.salt), payload);
  } catch {
    throw new Error('Could not encrypt the profile data.');
  }
  try {
    localStorage.setItem(storageKey(username), stored);
  } catch {
    throw new Error('Could not save the profile in browser storage.');
  }
}
