import createField from '../form/form-fields.js';
import { loadCSS } from '../../scripts/aem.js';
import { getStoredZip, setStoredZip } from '../zip-modal/zip-store.js';
import applyZipTokens from '../zip-modal/zip-tokens.js';

const DEFAULT_FORM_PATH = '/shop/zip-county-form.json';
const DEFAULT_REGIONS_PATH = '/shop/zip-regions.json';

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
 * Resolves the sheet paths. Authors may override them via a block row whose
 * label is `Form` or `Regions` and whose value is a sheet path (with or
 * without a `.json` suffix — Document Authoring rewrites `.json` links, so the
 * plain text value is used rather than an anchor href). Falls back to defaults.
 * @param {Element} block
 * @returns {{formPath: string, regionsPath: string}}
 */
function readConfig(block) {
  const normalize = (val) => {
    if (!val) return null;
    const clean = val.trim().replace(/-json$/, '.json');
    return clean.endsWith('.json') ? clean : `${clean}.json`;
  };
  let formPath = DEFAULT_FORM_PATH;
  let regionsPath = DEFAULT_REGIONS_PATH;
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length < 2) return;
    const key = cells[0].textContent.trim().toLowerCase();
    const value = normalize(cells[1].textContent);
    if (!value) return;
    if (key === 'form') formPath = value;
    if (key === 'regions' || key === 'region') regionsPath = value;
  });
  return { formPath, regionsPath };
}

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

export default async function decorate(block) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/form/form.css`);
  const { formPath, regionsPath } = readConfig(block);
  const [fieldDefs, regions] = await Promise.all([
    fetchSheet(formPath),
    fetchSheet(regionsPath),
  ]);

  const form = await buildForm(fieldDefs, regions);

  const error = document.createElement('p');
  error.className = 'zip-county-form-error';
  error.setAttribute('role', 'alert');
  error.hidden = true;
  form.append(error);

  const showError = (message) => { error.textContent = message; error.hidden = false; };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const zip = (form.querySelector('input[name="zip"]')?.value || '').trim();
    const county = form.querySelector('select[name="county"]')?.value || '';

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
    applyZipTokens();

    // Close the enclosing modal dialog, if any, and let listeners react.
    block.dispatchEvent(new CustomEvent('zip-county-submit', {
      bubbles: true,
      detail: { zip, county },
    }));
    block.closest('dialog')?.close();
  });

  block.replaceChildren(form);
}
