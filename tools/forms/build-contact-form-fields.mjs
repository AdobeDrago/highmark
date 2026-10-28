/* eslint-env node */
/* eslint-disable no-console */
/**
 * Builds contact-form-fields.json, the field sheet behind the form-minimal-light block on
 * /contact (the Contact Us form), in the columns the form block reads
 * (blocks/form/form-fields.js): Name, Type, Label, Placeholder, Value, Options, Mandatory,
 * Style, Id, Fieldset. Same approach as build-fraud-form-fields.mjs.
 *
 * Input: the raw sheet the forms-excat importer writes for the source page
 *   node <forms-excat>/scripts/form-importer.js https://www.highmark.com/contact <dir>
 * The source builds its Subject and State dropdowns and its validation with Material
 * components, so the importer returns hidden value holders instead of them, and the
 * radios / checkboxes without their questions. This keeps the named fields in source
 * order and adds, from the rendered page (2026-10-14):
 *   - Subject: required select (Customer Service ... Other). Its "Please tell us about your
 *     reason to contact us" field is shown, and required, only for Other (Style
 *     other-of-subject, see blocks/form-minimal-light);
 *   - State: required select, the source's 50 states + District of Columbia;
 *   - "May we leave a message if you are not available?" Yes / No and "If yes, what is
 *     the best time to call?" (three time slots): optional groups;
 *   - every other field is required on the source (the "* Required" hints);
 *   - Submit, and the thank-you redirect (the source's thankYouPagePath).
 * Dropped: the honeypot (contactByFaxOnly), recaptchaToken, apiEndpoint, siteName,
 * offerCode, customerKitId, thankYouPagePath, resourcePath. The source posts to
 * /bin/hmk/genericmailer with a reCAPTCHA token; the submit URL is the block's second row.
 *
 * Usage: node tools/forms/build-contact-form-fields.mjs <importer contact-form.json> [--upload]
 *   Writes contact-form-fields.json (DA sheet format) to the current directory. --upload
 *   also uploads it to DA (/contact-form-fields.json) and previews it; check, then publish.
 * Needs a DA token for --upload: ~/.aem/da-token.json (da-auth-helper) or .hlx/.da-token.json.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ORG = 'adobedrago';
const SITE = 'highmark';
const FILE = 'contact-form-fields.json';
const COLUMNS = ['Name', 'Type', 'Label', 'Placeholder', 'Value', 'Options', 'Mandatory', 'Style', 'Id', 'Fieldset'];

const SUBJECTS = 'Customer Service,Federal Employee Program,Fraud,Human Resources,Provider Services,Other';
const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
  'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
].join(',');
const CALL_TIMES = [['8am-11am', '8 a.m. - 11 a.m. EST'], ['11am-2pm', '11 a.m. - 2 p.m. EST'], ['2pm-5pm', '2 p.m. - 5 p.m. EST']];
const DROP = ['contactByFaxOnly', 'recaptchaToken', 'apiEndpoint', 'siteName', 'offerCode', 'customerKitId', 'thankYouPagePath', 'resourcePath'];
const TYPES = { addComments: 'text-area', phoneNumber: 'tel', emailAddress: 'email' };

const row = (fields) => Object.fromEntries(COLUMNS.map((c) => [c, fields[c] ?? '']));
// whitespace, and Material icon names the source's labels carry
const clean = (s) => (s || '').replace(/\s+/g, ' ').replace(/(\s+[a-z]+(_[a-z]+)+)+$/, '').trim();

function build(source) {
  const rows = [];
  const seen = new Set();
  source.data.forEach((f) => {
    const name = clean(f.Name);
    if (!name || DROP.includes(name) || seen.has(name)) return; // helpers, spam fields, repeats
    seen.add(name);
    if (name === 'subject') {
      rows.push(row({
        Name: name, Type: 'select', Label: 'Subject', Placeholder: 'Subject', Options: SUBJECTS, Mandatory: 'true',
      }));
    } else if (name === 'otherResponse') {
      rows.push(row({
        Name: name, Type: 'text', Label: 'Please tell us about your reason to contact us', Mandatory: 'true', Style: 'other-of-subject',
      }));
    } else if (name === 'state') {
      rows.push(row({
        Name: name, Type: 'select', Label: 'State', Placeholder: 'State', Options: STATES, Mandatory: 'true',
      }));
    } else if (name === 'leaveMessage') {
      rows.push(row({ Name: 'leaveMessageGroup', Type: 'fieldset', Label: 'May we leave a message if you are not available?' }));
      ['Yes', 'No'].forEach((label) => rows.push(row({
        Name: name, Type: 'radio', Label: label, Value: label.toLowerCase(), Id: `leave-message-${label.toLowerCase()}`, Fieldset: 'leaveMessageGroup',
      })));
    } else if (name === 'call-time') {
      rows.push(row({ Name: 'callTimeGroup', Type: 'fieldset', Label: 'If yes, what is the best time to call?' }));
      CALL_TIMES.forEach(([value, label]) => rows.push(row({
        Name: name, Type: 'checkbox', Label: label, Value: value, Id: `call-time-${value}`, Fieldset: 'callTimeGroup',
      })));
    } else {
      rows.push(row({
        Name: name,
        Type: TYPES[name] || 'text',
        Label: clean(f.Label),
        Mandatory: 'true',
      }));
    }
  });
  rows.push(row({ Name: 'submit', Type: 'submit', Label: 'Submit' }));
  // the source's thankYouPagePath (/content/.../home/contact-thank-you); the block redirects
  // to this URL's path on our site
  rows.push(row({ Name: 'confirmation', Type: 'confirmation', Value: 'https://www.highmark.com/contact-thank-you' }));
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
  const put = await fetch(`https://admin.da.live/source/${ORG}/${SITE}/${FILE}`, { method: 'POST', body, headers: auth });
  const preview = await fetch(`https://admin.hlx.page/preview/${ORG}/${SITE}/main/${FILE}`, { method: 'POST', headers: auth });
  console.log(`/${FILE}: uploaded (${put.status}), previewed (${preview.status})`);
}

const input = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!input) throw new Error('Usage: build-contact-form-fields.mjs <importer contact-form.json> [--upload]');
const data = build(JSON.parse(fs.readFileSync(input, 'utf8')));
fs.writeFileSync(FILE, `${JSON.stringify({
  total: data.length, offset: 0, limit: data.length, data, ':type': 'sheet',
}, null, 2)}\n`);
const inputs = data.filter((r) => !['fieldset', 'confirmation'].includes(r.Type));
console.log(`${FILE}: ${data.length} rows (${inputs.length} controls, ${data.filter((r) => r.Mandatory === 'true').length} required).`);
if (process.argv.includes('--upload')) await upload(readToken());
