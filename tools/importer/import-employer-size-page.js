/* eslint-disable */
/* global WebImporter */

/**
 * Employer business-size pages (/employer/solutions/small-business, /large-business).
 * On highmark.com they hold no content: the header, the breadcrumb row (Home -> /employer,
 * Solutions -> /employer/solutions, no crumb for the page itself) with Print / Share, and
 * the footer. The import keeps that: no body, and the metadata that gives the same row
 * (Breadcrumb Home /employer, Breadcrumb Current false) under the source's page title.
 */
export default {
  transform: (payload) => {
    const { document, params } = payload;
    const main = document.body;

    const title = (document.title || '').trim();
    const crumbs = [...document.querySelectorAll('ol.breadcrumb-list li a')];
    const home = crumbs[0]?.getAttribute('href') || '/employer';

    main.replaceChildren();
    const meta = {
      Title: title,
      breadcrumbs: 'true',
      'Breadcrumb Home': home.replace(/^\/content\/digital-marketing\/en\/highmark\/highmarkdotcom\/home/, '').replace(/\.html$/, '') || '/employer',
      'Breadcrumb Current': 'false',
      template: 'employer-subpage, employer-size-page',
    };
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath);

    return [{
      element: main,
      path,
      report: { title, template: 'employer-size-page', blocks: [] },
    }];
  },
};
