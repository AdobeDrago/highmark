/*
 * Enrollment form: the first step of a ShopX enrollment ("Tell us about yourself"),
 * which hands off to the live ShopX enrollment once it is filled in.
 *
 * Rows:
 *   intro          one cell: heading, copy, notices (shown above the fields)
 *   field          three cells: label | type | options
 *                  type `effective-date`: a select of the next coverage start dates (the
 *                    1st of each of the next months; options = placeholder, optionally
 *                    followed by `| <count>`, default 2), as ShopX's consumer
 *                    effective-date service returns
 *                  type `radio`: options = comma-separated choices
 *   submit         one cell: a link; Submit validates the fields, then opens the link
 * Every field is required.
 */
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16.17 13H4v-2h12.17l-5.59-5.59L12 4l8 8-8 8-1.41-1.41z"/></svg>';

let formCount = 0;

function element(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([name, value]) => {
    if (name === 'className') el.className = value;
    else el.setAttribute(name, value);
  });
  el.append(...children);
  return el;
}

function asterisk() {
  return element('span', { className: 'enrollment-form-asterisk', 'aria-hidden': 'true' }, '*');
}

/**
 * The 1st of each of the next `count` months, from today.
 * @param {number} count
 * @returns {{value: string, label: string}[]}
 */
function effectiveDates(count) {
  const today = new Date();
  return [...Array(count)].map((_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth() + 1 + i, 1);
    const value = [date.getFullYear(), date.getMonth() + 1, 1]
      .map((n) => String(n).padStart(2, '0')).join('-');
    const label = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return { value, label };
  });
}

function errorMessage(id, text) {
  const error = element('p', { className: 'enrollment-form-error', id }, text);
  error.hidden = true;
  return error;
}

function effectiveDateField(id, label, options) {
  const [placeholder = label, count] = options.split('|').map((s) => s.trim());
  const select = element('select', {
    id, name: id, required: '', 'aria-describedby': `${id}-error`,
  });
  select.append(element('option', { value: '', disabled: '', selected: '' }, `${placeholder}*`));
  effectiveDates(Number.parseInt(count, 10) || 2)
    .forEach(({ value, label: text }) => select.append(element('option', { value }, text)));
  select.addEventListener('change', () => select.classList.toggle('enrollment-form-filled', !!select.value));

  return element(
    'div',
    { className: 'enrollment-form-field enrollment-form-field-select' },
    element('label', { className: 'enrollment-form-label', for: id }, `${label} `, asterisk()),
    element('div', { className: 'enrollment-form-select' }, select),
    errorMessage(`${id}-error`, 'Required'),
  );
}

function radioField(id, label, options) {
  const choices = options.split(',').map((s) => s.trim()).filter(Boolean);
  const fieldset = element(
    'fieldset',
    { className: 'enrollment-form-field enrollment-form-field-radio', 'aria-describedby': `${id}-error` },
    element('legend', { className: 'enrollment-form-label' }, `${label} `, asterisk()),
  );
  const group = element('div', { className: 'enrollment-form-choices' });
  choices.forEach((choice, i) => {
    const input = element('input', {
      type: 'radio', id: `${id}-${i}`, name: id, value: choice,
    });
    if (i === 0) input.required = true;
    group.append(element(
      'label',
      { className: 'enrollment-form-choice', for: `${id}-${i}` },
      input,
      element('span', { className: 'enrollment-form-radio', 'aria-hidden': 'true' }),
      element('span', {}, choice),
    ));
  });
  fieldset.append(group, errorMessage(`${id}-error`, 'Required'));
  return fieldset;
}

function validateField(field) {
  const controls = [...field.querySelectorAll('select, input')];
  const valid = controls.some((c) => (c.type === 'radio' ? c.checked : !!c.value));
  field.classList.toggle('enrollment-form-invalid', !valid);
  field.querySelector('.enrollment-form-error').hidden = valid;
  controls.forEach((c) => c.setAttribute('aria-invalid', String(!valid)));
  return valid ? null : controls[0];
}

function validate(form) {
  const invalid = [...form.querySelectorAll('.enrollment-form-field')]
    .map(validateField).filter(Boolean);
  invalid[0]?.focus();
  return !invalid.length;
}

export default function decorate(block) {
  formCount += 1;
  const form = element('form', { className: 'enrollment-form-form', novalidate: '' });
  let handoff = null;
  let submitLabel = 'Submit';

  [...block.children].forEach((row, index) => {
    const cells = [...row.children];
    if (cells.length >= 3) {
      const label = cells[0].textContent.trim();
      const type = cells[1].textContent.trim().toLowerCase();
      const options = cells[2].textContent.trim();
      const id = `enrollment-${formCount}-${index}`;
      if (type === 'effective-date') form.append(effectiveDateField(id, label, options));
      else if (type === 'radio') form.append(radioField(id, label, options));
      return;
    }
    const link = cells[0]?.querySelector('a');
    if (link && cells[0].textContent.trim() === link.textContent.trim()) {
      handoff = link.href;
      submitLabel = link.textContent.trim() || submitLabel;
      return;
    }
    const intro = element('div', { className: 'enrollment-form-intro' });
    intro.append(...cells[0].childNodes);
    // the required-fields note's asterisk is red, as on the fields
    intro.querySelectorAll('em').forEach((em) => {
      em.innerHTML = em.innerHTML.replace(/\*/g, '<span class="enrollment-form-asterisk">*</span>');
    });
    form.append(intro);
  });

  const submit = element('button', { type: 'submit', className: 'enrollment-form-submit' }, submitLabel);
  submit.insertAdjacentHTML('beforeend', ARROW);
  form.append(element('p', { className: 'enrollment-form-actions' }, submit));

  form.addEventListener('change', (e) => {
    const field = e.target.closest('.enrollment-form-invalid');
    if (field) validateField(field);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validate(form) && handoff) window.location.href = handoff;
  });

  block.replaceChildren(form);
}
