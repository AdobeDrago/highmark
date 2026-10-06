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
  const control = wrapper.querySelector('input, select, textarea');
  const label = wrapper.querySelector('label');
  if (!control || !label) return;

  const isSelection = wrapper.classList.contains('selection-wrapper');
  const floats = !isSelection
    && (control.tagName === 'TEXTAREA' || FLOATING_TYPES.includes(control.type));

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

export default async function decorate(block) {
  await decorateBaseForm(block);

  const formEl = block.querySelector('form');
  if (!formEl) return;

  formEl.querySelectorAll('.field-wrapper').forEach(enhanceField);
}
