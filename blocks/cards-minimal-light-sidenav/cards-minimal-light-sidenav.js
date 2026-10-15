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
  // The chevron only exists when there is a child list to collapse — the
  // source's section-guide shape (sibling pages, e.g. CHIP / mental-health
  // guides) shows just the accent bar on the current page.
  const makeCurrentAnchor = (it, childList) => {
    const a = makeLink(it);
    a.classList.add('active');
    if (childList === null) a.setAttribute('aria-current', 'page');

    const bar = document.createElement('span');
    bar.className = 'cards-minimal-light-sidenav-bar';
    a.prepend(bar);

    if (childList) {
      const arrow = document.createElement('button');
      arrow.type = 'button';
      arrow.className = 'cards-minimal-light-sidenav-arrow';
      arrow.setAttribute('aria-label', 'Toggle section');
      arrow.setAttribute('aria-expanded', 'true');
      a.append(arrow);

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
    // Parent link(s) sit at the top level; every sibling/current page goes
    // into a single indented list beneath (in a group <li>), in source order.
    // The current sibling gets the accent-bar treatment inline (no separate
    // collapsible section).
    rootUl.classList.add('cards-minimal-light-sidenav-guide');
    const siblingList = document.createElement('ul');
    siblingList.className = 'cards-minimal-light-sidenav-children';
    // "child" rows are the pages of the sibling or current row above them: under
    // the current page an open list (the FAQ landing's topics), under another
    // sibling a collapsed one (its sub-menu), each with the collapse chevron, as
    // on the source
    const ownerOf = (i) => {
      for (let j = i - 1; j >= 0; j -= 1) {
        if (items[j].level !== 'child') return items[j];
      }
      return null;
    };
    const owners = new Set(items.map((it, i) => (it.level === 'child' ? ownerOf(i) : null)).filter(Boolean));
    let openList = null;

    const makeSiblingAnchor = (it, childList) => {
      const a = makeLink(it);
      const arrow = document.createElement('button');
      arrow.type = 'button';
      arrow.className = 'cards-minimal-light-sidenav-arrow';
      arrow.setAttribute('aria-label', `${it.label} submenu`);
      arrow.setAttribute('aria-expanded', 'false');
      a.append(arrow);
      childList.hidden = true;
      arrow.addEventListener('click', (e) => {
        e.preventDefault();
        const expanded = arrow.getAttribute('aria-expanded') === 'true';
        arrow.setAttribute('aria-expanded', String(!expanded));
        childList.hidden = expanded;
      });
      return a;
    };

    items.forEach((it) => {
      const li = document.createElement('li');
      li.className = `cards-minimal-light-sidenav-item cards-minimal-light-sidenav-${it.level}`;

      if (it.level === 'parent') {
        li.append(makeLink(it));
        rootUl.append(li);
        openList = null;
      } else if (it.level === 'current' || it.level === 'sibling') {
        openList = null;
        if (owners.has(it)) {
          openList = document.createElement('ul');
          openList.className = 'cards-minimal-light-sidenav-children';
          const a = it.level === 'current' ? makeCurrentAnchor(it, openList) : makeSiblingAnchor(it, openList);
          if (it.level === 'current') a.setAttribute('aria-current', 'page');
          li.append(a, openList);
        } else {
          li.append(it.level === 'current' ? makeCurrentAnchor(it, null) : makeLink(it));
        }
        siblingList.append(li);
      } else if (openList) {
        li.append(makeLink(it));
        openList.append(li);
      } else {
        // stray child
        li.append(makeLink(it));
        siblingList.append(li);
      }
    });

    // Valid nesting, as on the source: the sibling <ul> lives in its own
    // (unstyled) <li> of the root list — ul > li > ul.
    if (siblingList.children.length) {
      const group = document.createElement('li');
      group.className = 'cards-minimal-light-sidenav-group';
      group.append(siblingList);
      rootUl.append(group);
    }
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

  // No child pages under the current item (e.g. the FAQ pages): the source
  // shows only the accent bar, so drop the empty list and its chevron.
  if (childList && !childList.children.length) {
    const current = childList.closest('li');
    current.querySelector('.cards-minimal-light-sidenav-arrow')?.remove();
    current.querySelector('a')?.setAttribute('aria-current', 'page');
    childList.remove();
  }

  block.replaceChildren(rootUl);
}
