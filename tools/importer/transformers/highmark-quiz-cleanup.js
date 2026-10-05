/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Highmark quiz pages (main.quizPage, e.g. /medicare-hra).
 *
 * The source page is the welcome screen of a client-side quiz app (div.quiz).
 * Only the welcome screen (section.welcome) is authorable; the rest of the quiz
 * markup is an empty shell that the quiz script fills at runtime (verified in
 * migration-work/cleaned.html for https://www.highmark.com/medicare-hra):
 *  - the empty "Informational block" container and .quizPage-wrapper
 *  - the step-screen column, the loading wheel and the overlay
 *  - the generic modal (#generic-modal), whose close button would leave a stray "×"
 *
 * The quiz itself is not migrated: its step pages (/medicare-hra/step-1, ...)
 * stay on www.highmark.com, so the welcome screen's start link is made absolute.
 *
 * Every selector is scoped to main.quizPage, so pages without a quiz are untouched.
 */

const SOURCE_ORIGIN = 'https://www.highmark.com';

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;

  const quizPage = element.querySelector('main.quizPage');
  if (!quizPage) return;

  WebImporter.DOMUtils.remove(quizPage, [
    ':scope > .container:not(.quiz)',
    '.quizPage-wrapper',
    '.quiz .modal',
    '.quiz .loading',
    '.quiz > .col-12:not(:has(section.welcome))',
    '.overlay',
  ]);

  // Start link into the (unmigrated) quiz steps -> absolute source URL.
  quizPage.querySelectorAll('section.welcome a[href^="/"]').forEach((a) => {
    a.setAttribute('href', `${SOURCE_ORIGIN}${a.getAttribute('href')}`);
  });

  // Intro paragraph ends with "&nbsp;<br>" in the source: drop the trailing break.
  quizPage.querySelectorAll('section.welcome p').forEach((p) => {
    while (p.lastChild && (p.lastChild.nodeName === 'BR'
      || (p.lastChild.nodeType === 3 && !p.lastChild.textContent.replace(/\u00a0/g, ' ').trim()))) {
      p.lastChild.remove();
    }
  });
}
