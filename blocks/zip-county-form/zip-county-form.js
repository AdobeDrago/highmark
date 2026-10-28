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
 * Reads authored config from the block: any links point at the form-definition
 * sheet and/or the region sheet. Falls back to the shop defaults.
 * @param {Element} block
 * @returns {{formPath: string, regionsPath: string}}
 */
function readConfig(block) {
  const links = [...block.querySelectorAll('a')]
    .map((a) => {
      try { return new URL(a.href).pathname; } catch (e) { return a.getAttribute('href'); }
    })
    .filter(Boolean);
  const formPath = links.find((l) => l.includes('form')) || DEFAULT_FORM_PATH;
  const regionsPath = links.find((l) => l.includes('region')) || DEFAULT_REGIONS_PATH;
  return { formPath, regionsPath };
}

async function buildForm(fieldDefs, regions) {
  const form = document.createElement('form');
  form.setAttribute('novalidate', '');

  const fields = await Promise.all(fieldDefs.map((fd) => createField(fd, form)));
  fields.forEach((field) => { if (field) form.append(field); });

  const zipInput = form.querySelector('input[name="zip"]');
  const countyInput = form.querySelector('input[name="county"]');

  // County is auto-populated from the ZIP lookup, never typed by the user.
  if (countyInput) {
    countyInput.readOnly = true;
    countyInput.setAttribute('tabindex', '-1');
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
    if (countyInput && stored.region) countyInput.value = stored.region;
  }

  // Populate the county from the region sheet as the ZIP is typed; clear it
  // when the ZIP no longer matches a known region.
  if (zipInput && countyInput) {
    zipInput.addEventListener('input', () => {
      const match = regions.find((r) => r.ZIP === zipInput.value.trim());
      countyInput.value = match ? (match.Value || match.Option) : '';
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
    const match = regions.find((r) => r.ZIP === zip);
    const county = match ? (match.Value || match.Option) : '';

    if (!/^\d{5}$/.test(zip)) {
      showError('Please enter a valid 5-digit ZIP code.');
      return;
    }
    if (!match) {
      showError('We could not find that ZIP code. Please check and try again.');
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
