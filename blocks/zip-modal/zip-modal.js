import { createModal } from '../modal/modal.js';
import { loadCSS } from '../../scripts/aem.js';
import createField from '../form/form-fields.js';

const STORAGE_KEY = 'shop-zip-county';
const FORM_PATH = '/shop/zip-county-form.json';
const REGIONS_PATH = '/shop/zip-regions.json';

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

function setStoredZip(zipCode, region) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ zipCode, region }));
  } catch (e) {
    // ignore storage failures (private mode, quota, etc.)
  }
}

async function fetchSheet(path) {
  try {
    const resp = await fetch(path);
    if (!resp.ok) return [];
    const json = await resp.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (e) {
    return [];
  }
}

/**
 * Builds the modal form from the authorable form-definition sheet, rendering
 * each field with the repo's shared form-field renderer.
 * @param {Array} fieldDefs rows from the form-definition sheet
 * @param {Array} regions rows from the ZIP -> region sheet
 * @returns {Promise<HTMLFormElement>}
 */
async function buildForm(fieldDefs, regions) {
  const form = document.createElement('form');
  form.setAttribute('novalidate', '');

  const fields = await Promise.all(fieldDefs.map((fd) => createField(fd, form)));
  fields.forEach((field) => { if (field) form.append(field); });

  const zipInput = form.querySelector('input[name="zip"]');
  const countySelect = form.querySelector('select[name="county"]');

  // Populate the county select from the region sheet so options stay data-driven.
  if (countySelect) {
    regions.forEach((r) => {
      const option = document.createElement('option');
      option.text = r.Option;
      option.value = r.Value || r.Option;
      countySelect.add(option);
    });
  }

  // group fields into their fieldsets (mirrors blocks/form/form.js)
  form.querySelectorAll('fieldset').forEach((fieldset) => {
    form.querySelectorAll(`[data-fieldset="${fieldset.name}"]`).forEach((field) => {
      fieldset.append(field);
    });
  });

  // pre-fill from a prior selection
  const stored = getStoredZip();
  if (stored) {
    if (zipInput && stored.zipCode) zipInput.value = stored.zipCode;
    if (countySelect && stored.region) countySelect.value = stored.region;
  }

  // auto-select the region for a recognised ZIP
  if (zipInput && countySelect) {
    zipInput.addEventListener('input', () => {
      const match = regions.find((r) => r.ZIP === zipInput.value.trim());
      if (match) countySelect.value = match.Value || match.Option;
    });
  }

  return form;
}

/**
 * Opens the ZIP/county modal.
 */
export async function openZipModal() {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/form/form.css`);
  await loadCSS(`${window.hlx.codeBasePath}/blocks/zip-modal/zip-modal.css`);

  const [fieldDefs, regions] = await Promise.all([
    fetchSheet(FORM_PATH),
    fetchSheet(REGIONS_PATH),
  ]);

  const form = await buildForm(fieldDefs, regions);

  // authorable content wrapper so form styling + our modal styling both apply
  const content = document.createElement('div');
  content.className = 'zip-modal form';
  content.append(form);

  const error = document.createElement('p');
  error.className = 'zip-modal-error';
  error.setAttribute('role', 'alert');
  error.hidden = true;
  form.append(error);

  const { block, showModal } = await createModal([content]);
  block.classList.add('zip-modal-block');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const zip = (form.querySelector('input[name="zip"]')?.value || '').trim();
    const county = form.querySelector('select[name="county"]')?.value || '';

    const showError = (message) => { error.textContent = message; error.hidden = false; };

    if (!/^\d{5}$/.test(zip)) {
      showError('Please enter a valid 5-digit ZIP code.');
      return;
    }
    if (!regions.some((r) => r.ZIP === zip)) {
      showError('We could not find that ZIP code. Please check and try again.');
      return;
    }
    if (!county) {
      showError('Please select the county in which you reside.');
      return;
    }

    setStoredZip(zip, county);
    block.querySelector('dialog').close();
  });

  showModal();
}

/**
 * Auto-opens the modal on shop pages when no ZIP is stored.
 */
export async function autoOpenZipModal() {
  if (getStoredZip()?.zipCode) return;
  await openZipModal();
}
