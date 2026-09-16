import { loadFragment } from '../fragment/fragment.js';
import { createModal } from '../modal/modal.js';
import { loadCSS } from '../../scripts/aem.js';
import { getStoredZip } from './zip-store.js';

const MODAL_FRAGMENT_PATH = '/modals/zip-county';

/**
 * Opens the ZIP/county modal by loading its authored fragment document.
 * The fragment holds the heading/subtitle and a `zip-county-form` block that
 * renders the sheet-driven form and handles validation/save/tokens.
 */
export async function openZipModal(path = MODAL_FRAGMENT_PATH) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/zip-modal/zip-modal.css`);

  const fragment = await loadFragment(path);
  if (!fragment) return;

  const { block, showModal } = await createModal(fragment.childNodes);
  block.classList.add('zip-modal-block');

  showModal();
}

/**
 * Auto-opens the modal when no ZIP is stored.
 */
export async function autoOpenZipModal(path) {
  if (getStoredZip()?.zipCode) return;
  await openZipModal(path);
}
