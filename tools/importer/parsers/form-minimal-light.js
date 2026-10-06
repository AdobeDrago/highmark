/* eslint-disable */
/* global WebImporter */
/**
 * Parser for form-minimal-light.
 * Source: https://www.highmark.com/newsroom/news-alert
 *   (.form-container form.customFormContainer, form#newsalert)
 * Generated: 2026-10-06
 *
 * The source form (Material text fields + JS/reCAPTCHA submission) is replaced by
 * the sheet-driven form-minimal-light block (wraps blocks/form/form.js), which builds
 * its fields from the form-definition sheet. Field labels, hidden inputs, honeypot
 * (input.winnie), reCAPTCHA token, spinner and submit link are NOT carried over as
 * content.
 *
 * Block table (1 column, 2 rows):
 *   | form-minimal-light                      |
 *   | <a> /newsroom/news-alert-form.json      |
 *   | <a> submit endpoint                     |
 */

// Form definition sheet (fields: firstname, lastname, email, submit).
const FORM_DEFINITION = '/newsroom/news-alert-form.json';

// PLACEHOLDER submit endpoint, used only when the source form has no meaningful action
// attribute (the source posts via JS + reCAPTCHA). Authors must replace it with the
// real submission endpoint.
const PLACEHOLDER_SUBMIT = 'https://www.highmark.com/newsroom/news-alert-submit';

function link(document, href) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = href;
  return a;
}

export default function parse(element, { document }) {
  // Use the source form's action if it is present and meaningful.
  const rawAction = (element.getAttribute('action') || '').trim();
  // The live page uses action="/bin/hmk/genericmailer" (AEM servlet); absolutize it
  // against the source origin so it does not resolve against the EDS host.
  let submitUrl = PLACEHOLDER_SUBMIT;
  if (rawAction && rawAction !== '#' && !/^javascript:/i.test(rawAction)) {
    try {
      submitUrl = new URL(rawAction, 'https://www.highmark.com').href;
    } catch (e) {
      submitUrl = PLACEHOLDER_SUBMIT;
    }
  }

  const cells = [
    [link(document, FORM_DEFINITION)],
    [link(document, submitUrl)],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'form-minimal-light', cells });

  // Replacing the whole form drops all inputs, honeypot, recaptcha, spinner, button and
  // the hidden "All fields required." validation message (the visible required-fields
  // note is an h5 in the default content above the form).
  element.replaceWith(block);
}
