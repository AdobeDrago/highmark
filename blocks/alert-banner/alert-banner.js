// highmark.com's banner uses this session flag too: once closed, it stays closed for the session.
const DISMISSED = 'disabledAlertBanner';

function isDismissed() {
  try {
    return sessionStorage.getItem(DISMISSED) === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Alert banner, as highmark.com's "Important Notifications": a warning icon, a title, a short
 * text and a link, above the header, until the visitor closes it for the session.
 * Authored as a one-cell block: the title (a heading or the first paragraph), the text, and a
 * paragraph holding the link. The block moves itself above the header while the first section
 * loads, before the page is shown, so nothing shifts.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const wrapper = block.closest('.alert-banner-wrapper') || block;
  if (isDismissed()) {
    wrapper.remove();
    return;
  }

  const cell = block.querySelector(':scope > div > div') || block;
  const parts = [...cell.children];
  const titleEl = parts.find((el) => /^H[1-6]$/.test(el.tagName)) || parts[0];
  const linkEl = [...parts].reverse().find((el) => el !== titleEl && el.querySelector('a'));
  const bodyEls = parts.filter((el) => el !== titleEl && el !== linkEl);

  const banner = document.createElement('section');
  banner.className = 'alert-banner';
  banner.setAttribute('aria-labelledby', 'alert-banner-title');

  const inner = document.createElement('div');
  inner.className = 'alert-banner-inner';

  const icon = document.createElement('span');
  icon.className = 'alert-banner-icon';
  icon.setAttribute('aria-hidden', 'true');

  const text = document.createElement('div');
  text.className = 'alert-banner-text';
  const title = document.createElement('p');
  title.className = 'alert-banner-title';
  title.id = 'alert-banner-title';
  title.textContent = titleEl ? titleEl.textContent.trim() : '';
  const body = document.createElement('div');
  body.className = 'alert-banner-body';
  body.append(...bodyEls);
  text.append(title, document.createElement('hr'), body);
  if (linkEl) {
    // a lone link was turned into a button by decorateButtons; this one is a text link
    linkEl.className = 'alert-banner-link';
    linkEl.querySelectorAll('a').forEach((a) => a.classList.remove('button', 'primary', 'secondary'));
    text.append(linkEl);
  }

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'alert-banner-close';
  close.setAttribute('aria-label', 'Close notification');
  close.addEventListener('click', () => {
    try {
      sessionStorage.setItem(DISMISSED, 'true');
    } catch (e) {
      // storage unavailable (private mode): the banner closes for this page only
    }
    const hadFocus = banner.contains(document.activeElement);
    banner.remove();
    if (hadFocus) document.querySelector('header a')?.focus();
  });

  inner.append(icon, text, close);
  banner.append(inner);
  document.querySelector('header')?.before(banner);
  wrapper.remove();
}
