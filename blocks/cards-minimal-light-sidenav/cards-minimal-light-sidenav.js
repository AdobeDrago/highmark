export default function decorate(block) {
  /* Vertical section-navigation sidebar (built on the cards base).
     Reproduces the source .sidenav in its two shapes:

     1) Article/listing shape — a parent section link, a bold active
        current-section link with a left accent bar and a collapse chevron, and
        an indented list of child-page links nested under the current item.
     2) Section-guide shape (mental-health guides) — a parent section link
        followed by a flat, indented list of SIBLING pages, one of which is the
        active (current) page. All siblings sit in one list under the parent.

     Authoring model: one row per nav item. Each row holds a single link
     (an <a>). The item's hierarchy level is a level token in the first cell:
     "parent" | "current" | "child" | "sibling" (plus legacy "active"). The row
     tagged "current" (or whose link matches the current page) gets the active
     treatment (accent bar + chevron). */

  const items = [...block.children].map((row) => {
    const cells = [...row.children];
    let level = 'child';
    let linkCell = cells[0];

    if (cells.length > 1) {
      const token = cells[0].textContent.trim().toLowerCase();
      if (['parent', 'current', 'active', 'child', 'sibling'].includes(token)) {
        level = token === 'active' ? 'current' : token;
        [, linkCell] = cells;
      }
    }

    const anchor = linkCell ? linkCell.querySelector('a') : null;
    const href = anchor ? anchor.getAttribute('href') || '#' : '#';
    const label = (anchor ? anchor.textContent : linkCell.textContent).trim();
    return { level, href, label };
  });

  // Mark the current item: explicit "current" token wins; else match href to
  // the current pathname.
  const path = window.location.pathname.replace(/\.html$/, '');
  let hasCurrent = items.some((it) => it.level === 'current');
  if (!hasCurrent) {
    items.forEach((it) => {
      if (it.href.replace(/\.html$/, '') === path) it.level = 'current';
    });
    hasCurrent = items.some((it) => it.level === 'current');
  }

  // Section-guide shape: any explicit "sibling" rows present. In this mode the
  // current item is one of the siblings (not a standalone collapsible parent).
  const guideMode = items.some((it) => it.level === 'sibling');

  const rootUl = document.createElement('ul');
  rootUl.className = 'cards-minimal-light-sidenav-item-list';

  const makeLink = ({ href, label }) => {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    return a;
  };

  // Build the active anchor (accent bar + collapse chevron) and its child list.
  const makeCurrentAnchor = (it, childList) => {
    const a = makeLink(it);
    a.classList.add('active');

    const bar = document.createElement('span');
    bar.className = 'cards-minimal-light-sidenav-bar';
    a.prepend(bar);

    const arrow = document.createElement('button');
    arrow.type = 'button';
    arrow.className = 'cards-minimal-light-sidenav-arrow';
    arrow.setAttribute('aria-label', 'Toggle section');
    arrow.setAttribute('aria-expanded', 'true');
    a.append(arrow);

    if (childList) {
      arrow.addEventListener('click', (e) => {
        e.preventDefault();
        const expanded = arrow.getAttribute('aria-expanded') === 'true';
        arrow.setAttribute('aria-expanded', String(!expanded));
        childList.hidden = expanded;
      });
    }
    return a;
  };

  if (guideMode) {
    // Parent link(s) sit at the top level; every sibling/current page goes into
    // a single indented list beneath, in source order. The current sibling gets
    // the accent-bar treatment inline (no separate collapsible section).
    const siblingList = document.createElement('ul');
    siblingList.className = 'cards-minimal-light-sidenav-children';

    items.forEach((it) => {
      const li = document.createElement('li');
      li.className = `cards-minimal-light-sidenav-item cards-minimal-light-sidenav-${it.level}`;

      if (it.level === 'parent') {
        li.append(makeLink(it));
        rootUl.append(li);
      } else if (it.level === 'current') {
        li.append(makeCurrentAnchor(it, null));
        siblingList.append(li);
      } else {
        // sibling (or stray child)
        li.append(makeLink(it));
        siblingList.append(li);
      }
    });

    if (siblingList.children.length) rootUl.append(siblingList);
    block.replaceChildren(rootUl);
    return;
  }

  // Article/listing shape: parent at top, current with its own collapsible
  // child list holding the "child" sub-page links.
  let childList = null;

  items.forEach((it) => {
    const li = document.createElement('li');
    li.className = `cards-minimal-light-sidenav-item cards-minimal-light-sidenav-${it.level}`;

    if (it.level === 'current') {
      childList = document.createElement('ul');
      childList.className = 'cards-minimal-light-sidenav-children';
      const a = makeCurrentAnchor(it, childList);
      li.append(a, childList);
      rootUl.append(li);
    } else if (it.level === 'child' && childList) {
      li.append(makeLink(it));
      childList.append(li);
    } else {
      // parent, or child before any current item -> top level.
      li.append(makeLink(it));
      rootUl.append(li);
    }
  });

  block.replaceChildren(rootUl);
}
