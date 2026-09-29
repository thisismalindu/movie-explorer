import { webcrypto } from 'crypto';
import { TextDecoder, TextEncoder } from 'util';
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;
