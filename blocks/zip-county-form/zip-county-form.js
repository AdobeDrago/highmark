import createField from '../form/form-fields.js';
import { loadCSS } from '../../scripts/aem.js';
import {
  DEFAULT_COUNTIES_PATH, DEFAULT_REGIONS_PATH, countiesFor, fetchSheet, getStoredZip,
  regionFor, setStoredZip,
} from '../zip-modal/zip-store.js';
import applyZipTokens from '../zip-modal/zip-tokens.js';

const DEFAULT_FORM_PATH = '/shop/zip-county-form.json';
// short enough for the County box on a phone
const PICK_COUNTY = 'Select your county';
const NO_ZIP_YET = 'Enter ZIP first';

// ShopX's messages
const INVALID_ZIP = 'Please enter a valid 5-digit ZIP code.';
const OUTSIDE_AREA = 'The ZIP code you entered is outside the service areas of the states in which we offer plans. '
  + 'Please confirm you entered the ZIP code correctly or call 1-888-630-BLUE, 8 a.m. to 8 p.m., '
  + 'seven days a week. TTY call 711.';
const NO_COUNTY = 'Please select your county.';

const isZip = (value) => /^[0-9]{5}$/.test(value);

/**
 * Reads the block's settings rows: "Form", "Counties" and "Regions", each with a
 * sheet path (a link or plain text). Anything missing falls back to the shop's sheets.
 * @param {Element} block
 * @returns {{formPath: string, countiesPath: string, regionsPath: string}}
 */
function readConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const [key, value] = row.children;
    const path = value?.querySelector('a')?.getAttribute('href') || value?.textContent.trim();
    if (!key || !path) return;
    try {
      config[key.textContent.trim().toLowerCase()] = new URL(path, window.location.href).pathname;
    } catch (e) {
      // not a path: ignore the row
    }
  });
  return {
    formPath: config.form || DEFAULT_FORM_PATH,
    countiesPath: config.counties || DEFAULT_COUNTIES_PATH,
    regionsPath: config.regions || DEFAULT_REGIONS_PATH,
  };
}

async function buildForm(fieldDefs) {
  const form = document.createElement('form');
  form.setAttribute('novalidate', '');

  const fields = await Promise.all(fieldDefs.map((fd) => createField(fd, form)));
  fields.forEach((field) => { if (field) form.append(field); });

  // group fields into their fieldsets (mirrors blocks/form/form.js)
  form.querySelectorAll('fieldset').forEach((fieldset) => {
    form.querySelectorAll(`[data-fieldset="${fieldset.name}"]`).forEach((field) => {
      fieldset.append(field);
    });
  });
  return form;
}

/**
 * Makes the County field a list of the ZIP's counties (ShopX's county dropdown),
 * whatever field type the form sheet gives it.
 * @param {HTMLFormElement} form
 * @returns {HTMLSelectElement|null}
 */
function countySelect(form) {
  const field = form.querySelector('[name="county"]');
  if (!field) return null;
  let select = field;
  if (field.tagName !== 'SELECT') {
    select = document.createElement('select');
    select.id = field.id;
    select.name = 'county';
    field.replaceWith(select);
  }
  select.required = true;
  return select;
}

/**
 * Lists a ZIP's counties; a single county is chosen for the visitor.
 * @param {HTMLSelectElement} select
 * @param {Object[]} matches the ZIP's rows of the ZIP/county sheet
 * @param {string} [selected] county to keep chosen
 */
function listCounties(select, matches, selected) {
  const prompt = new Option(matches.length ? PICK_COUNTY : NO_ZIP_YET, '');
  prompt.disabled = true;
  select.replaceChildren(prompt, ...matches.map((row) => new Option(row.County, row.County)));
  select.disabled = !matches.length;
  const keep = matches.some((row) => row.County === selected) ? selected : '';
  select.value = keep || (matches.length === 1 ? matches[0].County : '');
}

export default async function decorate(block) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/form/form.css`);
  const { formPath, countiesPath, regionsPath } = readConfig(block);
  const [fieldDefs, counties, regions] = await Promise.all([
    fetchSheet(formPath),
    fetchSheet(countiesPath),
    fetchSheet(regionsPath),
  ]);

  const form = await buildForm(fieldDefs);
  const zipInput = form.querySelector('input[name="zip"]');
  const select = countySelect(form);
  if (zipInput) {
    zipInput.inputMode = 'numeric';
    zipInput.maxLength = 5;
    zipInput.autocomplete = 'postal-code';
  }

  // messages sit in the white card, above Continue (as on ShopX)
  const error = document.createElement('p');
  error.className = 'zip-county-form-error';
  error.setAttribute('role', 'alert');
  error.hidden = true;
  const submitWrapper = form.querySelector('.submit-wrapper');
  if (submitWrapper) submitWrapper.before(error);
  else form.append(error);

  const showError = (message, field) => {
    error.textContent = message;
    error.hidden = false;
    form.querySelectorAll('.field-wrapper.invalid').forEach((w) => w.classList.remove('invalid'));
    field?.closest('.field-wrapper')?.classList.add('invalid');
  };
  const clearError = () => {
    error.hidden = true;
    form.querySelectorAll('.field-wrapper.invalid').forEach((w) => w.classList.remove('invalid'));
  };

  const zipValue = () => (zipInput?.value || '').trim();
  const matches = () => (isZip(zipValue()) ? countiesFor(counties, zipValue()) : []);
  const update = (selected) => {
    if (select) listCounties(select, matches(), selected);
  };

  // pre-fill from a prior selection
  const stored = getStoredZip();
  if (stored && zipInput) zipInput.value = stored.zipCode;
  update(stored?.county);

  zipInput?.addEventListener('input', () => {
    clearError();
    update();
    if (isZip(zipValue()) && !matches().length) showError(OUTSIDE_AREA, zipInput);
  });
  select?.addEventListener('change', clearError);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const zip = zipValue();
    if (!isZip(zip)) {
      showError(INVALID_ZIP, zipInput);
      return;
    }
    const rows = countiesFor(counties, zip);
    if (!rows.length) {
      showError(OUTSIDE_AREA, zipInput);
      return;
    }
    const row = rows.length === 1 ? rows[0] : rows.find((r) => r.County === select?.value);
    if (!row) {
      showError(NO_COUNTY, select);
      select?.focus();
      return;
    }

    const selection = {
      zipCode: zip,
      county: row.County,
      state: row.State,
      regionCode: row.Region,
      region: regionFor(regions, row.Region)?.Region || row.Region,
    };
    setStoredZip(selection);
    applyZipTokens(document.body, regions);

    // Close the enclosing modal dialog, if any, and let listeners react.
    block.dispatchEvent(new CustomEvent('zip-county-submit', { bubbles: true, detail: selection }));
    block.closest('dialog')?.close();
  });

  block.replaceChildren(form);
}
