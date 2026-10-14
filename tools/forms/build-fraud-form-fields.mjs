/* eslint-env node */
/* eslint-disable no-console */
/**
 * Builds fraud-form-fields.json, the field sheet behind the form-minimal-light block on
 * /fraud/fraud-form (the Health Care Fraud Form), in the columns the form block reads
 * (blocks/form/form-fields.js): Name, Type, Label, Placeholder, Value, Options, Mandatory,
 * Style, Id, Fieldset.
 *
 * Input: the raw sheet the forms-excat importer writes for the source page
 *   node <forms-excat>/scripts/form-importer.js https://www.highmark.com/fraud/fraud-form <dir>
 * It reads the source's fields, but the source builds its State and Type of Complaint
 * dropdowns and its validation with Material components, so the importer also returns
 * their helper inputs (unnamed text rows), hidden value holders and the spam/reCAPTCHA
 * fields. This keeps the named fields in source order and adds what the importer can't
 * see, taken from the rendered page (2026-10-14):
 *   - State (x2): select, the source's 50 state codes;
 *   - Type of Complaint: select (Provider ... Other); its "Other" text field is shown only
 *     for Other (Style other-of-complainttype, see blocks/form-minimal-light);
 *   - "Do you wish to remain anonymous?" Yes / No: a required radio group;
 *   - Summary of Complaint: required text area;
 *   - the "COMPLAINT AGAINST:" heading, Reset, Submit, and the thank-you redirect.
 * Dropped: the honeypot (contactByFaxOnly), recaptchaToken, apiEndpoint, thankYouPagePath,
 * resourcePath. The source posts to /bin/hmk/genericmailer with a reCAPTCHA token; the
 * submit URL is the block's second row, not part of this sheet.
 *
 * Usage: node tools/forms/build-fraud-form-fields.mjs <importer fraud-form.json> [--upload]
 *   Writes fraud-form-fields.json (DA sheet format) to the current directory. --upload also
 *   uploads it to DA (/fraud/fraud-form-fields.json) and previews it; check, then publish.
 * Needs a DA token for --upload: ~/.aem/da-token.json (da-auth-helper) or .hlx/.da-token.json.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ORG = 'adobedrago';
const SITE = 'highmark';
const FILE = 'fraud-form-fields.json';
const COLUMNS = ['Name', 'Type', 'Label', 'Placeholder', 'Value', 'Options', 'Mandatory', 'Style', 'Id', 'Fieldset'];

const STATES = 'AL,AK,AR,AZ,CA,CO,CT,DE,FL,GA,HI,IA,ID,IL,IN,KS,KY,LA,MA,MD,ME,MI,MN,MO,MS,MT,NC,ND,NE,NH,NJ,NM,NV,NY,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VA,VT,WA,WI,WV,WY';
const COMPLAINT_TYPES = 'Provider,Member,Employee,Group,Facility,Pharmacy,Supplier,Other';
const DROP = ['contactByFaxOnly', 'recaptchaToken', 'apiEndpoint', 'thankYouPagePath', 'resourcePath'];
// field types the importer reports as plain text
const TYPES = {
  email: 'email', telephoneNumber: 'tel', defendantTelephoneNumber: 'tel', dateOfService: 'date', summaryOfComplaint: 'text-area',
};

const row = (fields) => Object.fromEntries(COLUMNS.map((c) => [c, fields[c] ?? '']));
// whitespace, and Material icon names the source's labels carry ("Date of Service calendar_month")
const clean = (s) => (s || '').replace(/\s+/g, ' ').replace(/(\s+[a-z]+(_[a-z]+)+)+$/, '').trim();

function build(source) {
  const rows = [];
  const seen = new Set();
  source.data.forEach((f) => {
    const name = clean(f.Name);
    if (!name || DROP.includes(name)) return; // helper inputs and spam/reCAPTCHA fields
    if (name === 'state' || name === 'defendantState') {
      rows.push(row({
        Name: name, Type: 'select', Label: 'State', Placeholder: 'State', Options: STATES,
      }));
    } else if (name === 'complaintType') {
      rows.push(row({
        Type: 'heading', Label: 'COMPLAINT AGAINST:', Style: 'sub-heading', Name: 'complaintAgainst',
      }));
      rows.push(row({
        Name: name, Type: 'select', Label: 'Type of Complaint', Placeholder: 'Type of Complaint', Options: COMPLAINT_TYPES,
      }));
    } else if (name === 'other') {
      rows.push(row({
        Name: name, Type: 'text', Label: 'Other', Style: 'other-of-complainttype',
      }));
    } else if (name === 'anonymous') {
      if (seen.has(name)) return; // the importer lists Yes and No as two rows
      rows.push(row({ Name: 'anonymousGroup', Type: 'fieldset', Label: 'Do you wish to remain anonymous?*' }));
      ['Yes', 'No'].forEach((label) => rows.push(row({
        Name: name, Type: 'radio', Label: label, Value: label.toLowerCase(), Mandatory: 'true', Id: `anonymous-${label.toLowerCase()}`, Fieldset: 'anonymousGroup',
      })));
    } else {
      rows.push(row({
        Name: name,
        Type: TYPES[name] || 'text',
        Label: clean(f.Label),
        Mandatory: name === 'summaryOfComplaint' ? 'true' : '',
      }));
    }
    seen.add(name);
  });
  rows.push(row({
    Name: 'reset', Type: 'reset', Value: 'Reset', Style: 'reset-wrapper',
  }));
  rows.push(row({ Name: 'submit', Type: 'submit', Label: 'Submit' }));
  // the source's thankYouPagePath (/content/.../home/fraud-thank-you); the block redirects
  // to this URL's path on our site
  rows.push(row({ Name: 'confirmation', Type: 'confirmation', Value: 'https://www.highmark.com/fraud-thank-you' }));
  return rows;
}

function readToken() {
  const files = [path.join(os.homedir(), '.aem', 'da-token.json'), path.join('.hlx', '.da-token.json')];
  const file = files.find((f) => fs.existsSync(f));
  if (!file) throw new Error('No DA token found; run `npx github:adobe-rnd/da-auth-helper token` first.');
  const { access_token: token, expires_at: expires } = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (expires && expires < Date.now() + 60000) throw new Error(`DA token in ${file} has expired.`);
  return token;
}

async function upload(token) {
  const auth = { Authorization: `Bearer ${token}` };
  const body = new FormData();
  body.append('data', new Blob([fs.readFileSync(FILE)], { type: 'application/json' }), FILE);
  const put = await fetch(`https://admin.da.live/source/${ORG}/${SITE}/fraud/${FILE}`, { method: 'POST', body, headers: auth });
  const preview = await fetch(`https://admin.hlx.page/preview/${ORG}/${SITE}/main/fraud/${FILE}`, { method: 'POST', headers: auth });
  console.log(`/fraud/${FILE}: uploaded (${put.status}), previewed (${preview.status})`);
}

const input = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!input) throw new Error('Usage: build-fraud-form-fields.mjs <importer fraud-form.json> [--upload]');
const data = build(JSON.parse(fs.readFileSync(input, 'utf8')));
fs.writeFileSync(FILE, `${JSON.stringify({
  total: data.length, offset: 0, limit: data.length, data, ':type': 'sheet',
}, null, 2)}\n`);
const inputs = data.filter((r) => !['heading', 'fieldset', 'confirmation'].includes(r.Type));
console.log(`${FILE}: ${data.length} rows (${inputs.length} controls, ${data.filter((r) => r.Mandatory === 'true').length} required).`);
if (process.argv.includes('--upload')) await upload(readToken());
