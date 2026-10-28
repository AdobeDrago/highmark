/*
 * Shared persistence for the shop ZIP/county selection.
 * Currently backed by localStorage; wiring into the app's Redux/IndexedDB
 * store is tracked separately.
 */

const STORAGE_KEY = 'shop-zip-county';

/**
 * Reads the stored ZIP/county selection.
 * @returns {{zipCode: string, region: string}|null}
 */
export function getStoredZip() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Persists the ZIP/county selection.
 * @param {string} zipCode
 * @param {string} region
 */
export function setStoredZip(zipCode, region) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ zipCode, region }));
  } catch (e) {
    // ignore storage failures (private mode, quota, etc.)
  }
}
