/*
 * Shared persistence for the shop ZIP/county selection, plus the ZIP → region
 * sheet lookup. Currently backed by localStorage; wiring into the app's
 * Redux/IndexedDB store is tracked separately.
 */

const STORAGE_KEY = 'shop-zip-county';
export const DEFAULT_REGIONS_PATH = '/shop/zip-regions.json';

const sheetRequests = new Map();

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

/**
 * Fetches the rows of the ZIP → region sheet (columns ZIP, Option, Value and
 * optional extras such as County, State, Region Code, Marketplace). Requested
 * once per path per page.
 * @param {string} [path=DEFAULT_REGIONS_PATH]
 * @returns {Promise<Object[]>}
 */
export function fetchRegions(path = DEFAULT_REGIONS_PATH) {
  if (!sheetRequests.has(path)) {
    sheetRequests.set(path, fetch(path)
      .then((resp) => (resp.ok ? resp.json() : {}))
      .then((json) => (Array.isArray(json.data) ? json.data : []))
      .catch(() => []));
  }
  return sheetRequests.get(path);
}

/**
 * Finds the sheet row for a ZIP code.
 * @param {Object[]} rows
 * @param {string} zip
 * @returns {Object|null}
 */
export function findRegion(rows, zip) {
  return rows.find((row) => String(row.ZIP ?? '').trim() === zip) || null;
}
