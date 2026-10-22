/* eslint-disable */
/* global WebImporter */

/**
 * Medicare articles (/plans/medicare/learn-about-medicare/<article>, e.g.
 * benefits-of-medicare-advisors; Template: medicare-article).
 *
 * The source is one centred col-lg-8 column: a banner image, the h1, then text
 * components (paragraphs, h2 / h3, lists) with AEM spacing components between some of
 * them, followed by a full-width blush one-card-one-col panel (the "talk to an expert"
 * call CTA) and the job-code footnote. Output sections:
 *   1. the article: the banner image and the text, in order; each spacing component
 *      becomes a section break with Style space-<px> (40px at every width here);
 *   2. Style highlight: the panel's heading, copy and call button (the source writes
 *      the heading and copy twice, for desktop and for phones; the desktop copy is kept);
 *   3. Style footnote: the job-code paragraph(s).
 */

const SPACE = { ten: 20, twenty: 40, thirty: 60, forty: 80 };

function spacerPx(section) {
  const m = (section.className.match(/(?:^|\s)(ten|twenty|thirty|forty)-padding/) || [])[1];
  return m ? SPACE[m] : 40;
}

function sectionBreak(document, main, style) {
  main.append(document.createElement('hr'));
  if (style) {
    main.append(WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: { style },
    }));
  }
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const body = document.body;

    const h1 = body.querySelector('h1');
    const article = h1.closest('.col-lg-8') || h1.closest('.aem-Grid');
    const crumb = document.querySelector('ol.breadcrumb-list li.active');
    const crumbLabel = (crumb?.textContent || '').replace(/\s+/g, ' ').trim();
    const meta = WebImporter.Blocks.getMetadata(document) || {};

    const main = document.createElement('div');

    // 1. the article, in source order
    const items = article.querySelectorAll('.image img, .cmp-text > *, .text > *, .spacing section');
    let pendingSpace = 0;
    items.forEach((el) => {
      if (el.matches('.spacing section')) {
        pendingSpace += spacerPx(el);
        return;
      }
      if (el.closest('.spacing')) return;
      if (pendingSpace) {
        sectionBreak(document, main, `space-${pendingSpace}`);
        pendingSpace = 0;
      }
      if (el.tagName === 'IMG') {
        const img = document.createElement('img');
        img.src = el.getAttribute('src');
        img.alt = el.getAttribute('alt') || '';
        const p = document.createElement('p');
        p.append(img);
        main.append(p);
        return;
      }
      // text components: keep headings, paragraphs and lists; drop empty spacer paragraphs
      if (!/^(H[1-6]|P|UL|OL)$/.test(el.tagName)) return;
      if (el.tagName === 'P' && !el.textContent.replace(/[\s ]/g, '') && !el.querySelector('img')) return;
      el.querySelectorAll('[style]').forEach((n) => n.removeAttribute('style'));
      main.append(el.cloneNode(true));
    });
    // a spacer that ends the article: an empty section of its height
    if (pendingSpace) sectionBreak(document, main, `space-${pendingSpace}`);

    // 2. the blush call panel (desktop copy of its heading and text)
    const panel = body.querySelector('.one-card-one-col-panel');
    if (panel) {
      sectionBreak(document, main, 'highlight');
      const heading = panel.querySelector('h2.d-lg-block, h2');
      if (heading) {
        const h2 = document.createElement('h2');
        h2.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
        main.append(h2);
      }
      const text = panel.querySelector('.d-lg-block.body-text p, .body-text p');
      if (text) {
        const p = document.createElement('p');
        p.textContent = text.textContent.replace(/\s+/g, ' ').trim();
        main.append(p);
      }
      panel.querySelectorAll('.hmk-brand-buttons a[href]').forEach((a) => {
        const p = document.createElement('p');
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
        p.append(link);
        main.append(p);
      });
    }

    // 3. the job-code footnote: text paragraphs after the panel
    const notes = [...body.querySelectorAll('section.container-fluid-fullwidth p')]
      .filter((p) => (!panel || panel.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING)
        && !p.closest('.one-card-one-col-panel, footer, .global-footer, .footer-content')
        && p.textContent.trim());
    if (notes.length) {
      sectionBreak(document, main, 'footnote');
      notes.forEach((p) => main.append(p.cloneNode(true)));
    }

    // metadata: the source's, with breadcrumbs under the source label
    sectionBreak(document, main);
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    meta.template = 'medicare-article';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));

    body.replaceChildren(...main.childNodes);
    WebImporter.rules.adjustImageUrls(body, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
    return [{
      element: body,
      path: WebImporter.FileUtils.sanitizePath(rawPath),
      report: { title: document.title, template: 'medicare-article', blocks: [] },
    }];
  },
};
