/*
 * Form (minimal, light) — variant of the base form block.
 *
 * Content contract (same as blocks/form):
 *   row 1: link to the form-definition spreadsheet JSON (same origin, ends with .json)
 *   row 2: link to the submit endpoint (POST JSON { data: {...} })
 *
 * Field creation, validation and submission are reused from the base form block.
 * This variant adds the minimal layout: labels rendered inside the outlined inputs
 * (floating on focus / when filled) and a "* Required" helper beneath each required field.
 *
 * "Other" fields: a sheet row with Style `other-of-<select name>` (e.g. other-of-subject)
 * is shown only while that select is set to "other", as the source's "Other" text fields
 * are; while hidden it is disabled, so it is neither validated nor submitted.
 */
import decorateBaseForm from '../form/form.js';

const FLOATING_TYPES = ['text', 'email', 'tel', 'number', 'password', 'url', 'search', 'date'];

// Validation copy used by the source site (jQuery validate messages).
function getErrorMessage(control, labelText) {
  const { validity } = control;
  if (validity.valid) return '';
  if (validity.valueMissing) {
    return control.type === 'email' ? 'This field is required.' : `Please enter your ${labelText}`;
  }
  if (validity.typeMismatch && control.type === 'email') return 'Please enter a valid email address';
  return control.validationMessage;
}

function enhanceField(wrapper, index) {
  if (wrapper.querySelector('fieldset')) return; // a group: its fields are enhanced on their own
  const control = wrapper.querySelector('input, select, textarea');
  const label = wrapper.querySelector('label');
  if (!control || !label) return;

  const isSelection = wrapper.classList.contains('selection-wrapper');
  // radios / checkboxes: the group gets the "* Required" line (enhanceGroups), not each option
  if (isSelection) return;

  // a select with a placeholder option shows its label inside, as the source does; the
  // label above stays for screen readers only
  if (control.tagName === 'SELECT' && control.options[0]?.disabled && control.options[0].text) {
    label.classList.add('visually-hidden');
  }

  const floats = control.tagName === 'TEXTAREA' || FLOATING_TYPES.includes(control.type);

  if (floats) {
    wrapper.classList.add('floating-label');
    // :placeholder-shown drives the floating state; it needs a non-empty placeholder.
    if (!control.getAttribute('placeholder') || control.placeholder === 'undefined') {
      control.placeholder = ' ';
    }
    // Label must follow the control for the sibling selector to work.
    control.after(label);
  }

  if (control.required) {
    const help = document.createElement('p');
    help.className = 'field-help';
    help.id = `${control.id || `field-${index}`}-help`;

    const hint = document.createElement('span');
    hint.className = 'field-hint';
    hint.textContent = '* Required';

    // validation message, shown in place of the hint while the control is :user-invalid
    const error = document.createElement('span');
    error.className = 'field-error';

    help.append(hint, error);
    wrapper.append(help);
    const describedBy = control.getAttribute('aria-describedby');
    control.setAttribute('aria-describedby', describedBy ? `${describedBy} ${help.id}` : help.id);

    const labelText = label.textContent.trim().toLowerCase();
    const updateError = () => {
      error.textContent = getErrorMessage(control, labelText);
    };
    updateError();
    ['input', 'change', 'invalid'].forEach((evt) => control.addEventListener(evt, updateError));
  }
}

/**
 * One "* Required" line under each fieldset holding required radios / checkboxes (the
 * source's "Do you wish to remain anonymous?" Yes / No), swapped for the validation message
 * while the group is :user-invalid.
 */
function enhanceGroups(formEl) {
  formEl.querySelectorAll('fieldset').forEach((fieldset, i) => {
    if (!fieldset.querySelector('.selection-wrapper input:required')) return;
    const wrapper = fieldset.closest('.field-wrapper') || fieldset;
    const help = document.createElement('p');
    help.className = 'field-help';
    help.id = `${fieldset.id || `fieldset-${i}`}-help`;
    const hint = document.createElement('span');
    hint.className = 'field-hint';
    hint.textContent = '* Required';
    const error = document.createElement('span');
    error.className = 'field-error';
    error.textContent = 'This field is required.';
    help.append(hint, error);
    wrapper.append(help);
    fieldset.setAttribute('aria-describedby', help.id);
  });
}

/** Rows styled other-of-<select name> follow that select's "other" choice (see top). */
function linkOtherFields(formEl) {
  formEl.querySelectorAll('.field-wrapper[class*="other-of-"]').forEach((wrapper) => {
    const name = [...wrapper.classList].find((c) => c.startsWith('other-of-')).slice('other-of-'.length);
    const select = [...formEl.querySelectorAll('select')].find((s) => s.name.toLowerCase() === name);
    const control = wrapper.querySelector('input, textarea, select');
    if (!select || !control) return;
    const update = () => {
      const show = select.value === 'other';
      wrapper.hidden = !show;
      control.disabled = !show;
    };
    select.addEventListener('change', update);
    formEl.addEventListener('reset', () => setTimeout(update));
    update();
  });
}

/** A reset row sits beside Submit as a text button, as on the source (RESET | SUBMIT). */
function placeReset(formEl) {
  const reset = formEl.querySelector('input[type="reset"]');
  const submit = formEl.querySelector('.submit-wrapper');
  if (!reset || !submit) return;
  const resetWrapper = reset.closest('.field-wrapper');
  reset.removeAttribute('aria-labelledby');
  reset.classList.add('reset');
  submit.prepend(reset);
  submit.classList.add('has-reset');
  if (resetWrapper && resetWrapper !== submit) resetWrapper.remove();
}

// classes asked for by name where the sheet's name doesn't give them (see formClass)
const FORM_CLASSES = { 'contact-form': 'contact_form' };

/**
 * The form's class, named after its field sheet without ".json" and a "-fields" suffix:
 * /fraud/fraud-form-fields.json -> "fraud-form", /newsroom/news-alert-form.json ->
 * "news-alert-form", unless FORM_CLASSES names another (/contact-form-fields.json ->
 * "contact_form").
 */
function formClass(block) {
  const sheet = [...block.querySelectorAll('a[href]')]
    .map((a) => new URL(a.href, window.location.href).pathname)
    .find((p) => p.endsWith('.json'));
  if (!sheet) return '';
  const name = sheet.split('/').pop().replace(/\.json$/, '').replace(/-fields$/, '');
  return FORM_CLASSES[name] || name;
}

export default async function decorate(block) {
  const cls = formClass(block); // read before the base block replaces the links
  await decorateBaseForm(block);

  const formEl = block.querySelector('form');
  if (!formEl) return;

  if (cls) formEl.classList.add(cls);
  formEl.querySelectorAll('.field-wrapper').forEach(enhanceField);
  enhanceGroups(formEl);
  linkOtherFields(formEl);
  placeReset(formEl);
}
