/* eslint-disable */
/* global WebImporter */

/**
 * Imports the leadership bios' "Contact us to arrange an interview" popup as the shared
 * fragment /modals/request-interview, which the bios' "Request Interview" link opens
 * (scripts.js autolinkModals -> blocks/modal). Source: any bio with the popup, e.g.
 * https://www.highmark.com/about/our-story/leadership-team-board/EdwardShellard
 * (.biomodal-content; identical on the 10 bios that have it, 2026-10-12).
 *
 * Output: the popup title as an h2, then a columns block with one cell per contact
 * (name, company, phone, email link). The source's CLOSE button is dropped; the modal
 * has its own close control.
 */
export default {
  transform: ({ document }) => {
    const popup = document.querySelector('.biomodal-content');
    const main = document.createElement('div');
    if (!popup) {
      return [{ element: main, path: '/modals/request-interview', report: { error: 'no .biomodal-content on the page' } }];
    }

    const title = popup.querySelector('.biomodal-title h1, .biomodal-title h2, .biomodal-title h3, h3');
    if (title) {
      const h2 = document.createElement('h2');
      h2.textContent = title.textContent.replace(/\s+/g, ' ').trim();
      main.append(h2);
    }

    const contacts = [...popup.querySelectorAll('.biomodal-contactsp, .biomodal-contactss')].map((contact) => {
      const cell = document.createElement('div');
      contact.querySelectorAll('p').forEach((p) => {
        const text = p.textContent.replace(/\s+/g, ' ').trim();
        if (!text) return;
        const out = document.createElement('p');
        const link = p.querySelector('a[href]');
        if (link) {
          const a = document.createElement('a');
          a.href = link.getAttribute('href').trim();
          a.textContent = text;
          out.append(a);
        } else {
          out.textContent = text;
        }
        cell.append(out);
      });
      return cell;
    });
    if (contacts.length) {
      main.append(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [contacts] }));
    }

    return [{
      element: main,
      path: '/modals/request-interview',
      report: { title: title ? title.textContent.trim() : '', contacts: contacts.length },
    }];
  },
};
