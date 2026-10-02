/*
 * The shop's ZIP/county selection and its data sheets.
 *
 * - /shop/zip-counties.json: one row per ZIP and county in Highmark's footprint
 *   (ZIP, County, State, FIPS, Region); a ZIP that spans counties has several rows.
 * - /shop/regions.json: one row per Highmark region (Region Code, Region, Brand,
 *   Marketplace, Brochure, ...).
 *
 * The selection is kept in localStorage; wiring into the app's Redux/IndexedDB store
 * is tracked separately (issue #9).
 */

const STORAGE_KEY = 'shop-zip-county';
export const DEFAULT_COUNTIES_PATH = '/shop/zip-counties.json';
export const DEFAULT_REGIONS_PATH = '/shop/regions.json';

const sheetRequests = new Map();

/**
 * Reads the stored selection. A selection saved before counties were stored (no
 * region code) counts as none, so the visitor is asked again.
 * @returns {{zipCode: string, county: string, state: string, regionCode: string,
 *   region: string}|null}
 */
export function getStoredZip() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored?.zipCode && stored.regionCode ? stored : null;
  } catch (e) {
    return null;
  }
}

/**
 * Persists the visitor's selection.
 * @param {{zipCode: string, county: string, state: string, regionCode: string,
 *   region: string}} selection
 */
export function setStoredZip(selection) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  } catch (e) {
    // ignore storage failures (private mode, quota, etc.)
  }
}

/**
 * Fetches the rows of a sheet, once per path per page (the ZIP sheet has thousands
 * of rows, so the request asks for all of them).
 * @param {string} path
 * @returns {Promise<Object[]>}
 */
export function fetchSheet(path) {
  if (!sheetRequests.has(path)) {
    const url = new URL(path, window.location.href);
    if (!url.searchParams.has('limit')) url.searchParams.set('limit', '10000');
    sheetRequests.set(path, fetch(url)
      .then((resp) => (resp.ok ? resp.json() : {}))
      .then((json) => (Array.isArray(json.data) ? json.data : []))
      .catch(() => []));
  }
  return sheetRequests.get(path);
}

/**
 * The counties a ZIP covers.
 * @param {Object[]} rows ZIP/county sheet rows
 * @param {string} zip
 * @returns {Object[]} the ZIP's rows, one per county
 */
export function countiesFor(rows, zip) {
  return rows.filter((row) => String(row.ZIP ?? '').trim() === zip);
}

/**
 * The regions sheet row for a region code.
 * @param {Object[]} rows regions sheet rows
 * @param {string} code e.g. 'WPA'
 * @returns {Object|null}
 */
export function regionFor(rows, code) {
  return rows.find((row) => String(row['Region Code'] ?? '').trim() === code) || null;
}
