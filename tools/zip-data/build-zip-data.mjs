/* eslint-env node */
/* eslint-disable no-console */
/**
 * Builds the shop's interim ZIP/county data, used until enGen supplies the real list:
 *   zip-counties.json  one row per ZIP and county in Highmark's individual-market footprint
 *                      (ZIP, County, State, FIPS, Region, Note)
 *   regions.json       one row per Highmark region (Region Code, Region, Brand, Marketplace,
 *                      Brochure, Spanish Brochure)
 *
 * Sources:
 * - Census 2020 ZCTA-to-county relationship file (downloaded on each run). ZCTAs are the
 *   Census's ZIP areas: PO box ZIPs are missing, so a few real ZIPs aren't found.
 * - Highmark's "What Is My Service Area?" map (Highmark Provider Manual, chapter 1) for the
 *   counties of each region: https://providers.highmark.com/content/dam/highmark/en/
 *   providerresourcecenter/pdfs/education-resources/highmark-provider-manual/
 *   provider-manual-chapter-1/hpm-service-area-map.pdf
 *
 * Centre County is split between Western and Central PA by ZIP, and the split isn't
 * published: ZIPs west of 78°W (Census 2020 Gazetteer centroids) are Western PA here,
 * and every Centre row carries a note saying so.
 *
 * Usage: node tools/zip-data/build-zip-data.mjs [--upload]
 *   Writes both files (DA sheet format) to the current directory. --upload also uploads them
 *   to DA (/shop/zip-counties.json, /shop/regions.json) and previews them; check, then publish.
 * Needs a DA token for --upload: ~/.aem/da-token.json (da-auth-helper) or .hlx/.da-token.json.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ORG = 'adobedrago';
const SITE = 'highmark';
const CENSUS = 'https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt';
const MIN_SHARE = 0.02; // drop counties holding under 2% of a ZIP's land (boundary slivers)
const STATES = {
  42: 'PA', 10: 'DE', 54: 'WV', 36: 'NY',
};

const REGION_COUNTIES = {
  PA: {
    WPA: ['Allegheny', 'Armstrong', 'Beaver', 'Bedford', 'Blair', 'Butler', 'Cambria', 'Cameron', 'Clarion',
      'Clearfield', 'Crawford', 'Elk', 'Erie', 'Fayette', 'Forest', 'Greene', 'Huntingdon', 'Indiana', 'Jefferson',
      'Lawrence', 'McKean', 'Mercer', 'Potter', 'Somerset', 'Venango', 'Warren', 'Washington', 'Westmoreland'],
    CPA: ['Adams', 'Berks', 'Columbia', 'Cumberland', 'Dauphin', 'Franklin', 'Fulton', 'Juniata', 'Lancaster',
      'Lebanon', 'Lehigh', 'Mifflin', 'Montour', 'Northampton', 'Northumberland', 'Perry', 'Schuylkill', 'Snyder',
      'Union', 'York'],
    NEPA: ['Bradford', 'Carbon', 'Clinton', 'Lackawanna', 'Luzerne', 'Lycoming', 'Monroe', 'Pike', 'Sullivan',
      'Susquehanna', 'Tioga', 'Wayne', 'Wyoming'],
    SEPA: ['Bucks', 'Chester', 'Delaware', 'Montgomery', 'Philadelphia'],
  },
  NY: {
    WNY: ['Allegany', 'Cattaraugus', 'Chautauqua', 'Erie', 'Genesee', 'Niagara', 'Orleans', 'Wyoming'],
    NENY: ['Albany', 'Clinton', 'Columbia', 'Essex', 'Fulton', 'Greene', 'Montgomery', 'Rensselaer', 'Saratoga',
      'Schenectady', 'Schoharie', 'Warren', 'Washington'],
  },
};
const WHOLE_STATE = { DE: 'DE', WV: 'WV' };

// Centre County ZIPs west of 78°W (the Philipsburg / Moshannon Valley side): Western PA.
const CENTRE_WESTERN_ZIPS = ['16666', '16677', '16686', '16845', '16859', '16860', '16866', '16870', '16877'];
const CENTRE_NOTE = 'Centre County is split between Western and Central PA; region approximated from Highmark\'s service-area map until enGen\'s list';

// ZIPs that aren't Census ZCTAs (PO box ZIPs) but were confirmed on ShopX.
const EXTRA_ROWS = [
  ['18501', 'Lackawanna', 'PA', '42069', 'NEPA', 'Not a Census ZCTA (PO box ZIP); confirmed on ShopX'],
];

const BROCHURES = 'https://shop.highmark.com/content/dam/highmark/en/healthco/shopx/plan-documents/2026';
const HEALTHSHERPA = 'https://highmark.healthsherpa.com/?_agent_id=highmark';
const NY_STATE_OF_HEALTH = 'https://nystateofhealth.ny.gov/';
const REGIONS = [
  ['WPA', 'Western PA', 'Highmark Blue Cross Blue Shield', HEALTHSHERPA],
  ['CPA', 'Central PA', 'Highmark Blue Shield', HEALTHSHERPA],
  ['SEPA', 'Southeastern PA', 'Highmark Blue Shield', HEALTHSHERPA],
  ['NEPA', 'Northeastern PA', 'Highmark Blue Cross Blue Shield', HEALTHSHERPA],
  ['DE', 'Delaware', 'Highmark Blue Cross Blue Shield', HEALTHSHERPA],
  ['WV', 'West Virginia', 'Highmark Blue Cross Blue Shield', HEALTHSHERPA],
  ['WNY', 'Western New York', 'Highmark Blue Cross Blue Shield', NY_STATE_OF_HEALTH],
  ['NENY', 'Northeastern NY', 'Highmark Blue Shield', NY_STATE_OF_HEALTH],
].map(([code, name, brand, marketplace]) => ({
  'Region Code': code,
  Region: name,
  Brand: brand,
  Marketplace: marketplace,
  Brochure: `${BROCHURES}/brochures/${code}_2026_ACA_Brochure.pdf`,
  'Spanish Brochure': code === 'SEPA' ? `${BROCHURES}/SEPA_2026_ACA_Brochure_Spanish.pdf` : '',
}));

function readToken() {
  const files = [path.join(os.homedir(), '.aem', 'da-token.json'), path.join('.hlx', '.da-token.json')];
  const file = files.find((f) => fs.existsSync(f));
  if (!file) throw new Error('No DA token found; run `npx github:adobe-rnd/da-auth-helper token` first.');
  const { access_token: token, expires_at: expires } = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (expires && expires < Date.now() + 60000) throw new Error(`DA token in ${file} has expired.`);
  return token;
}

const sheet = (data) => ({
  total: data.length, offset: 0, limit: data.length, data, ':type': 'sheet',
});

async function upload(name, token) {
  const auth = { Authorization: `Bearer ${token}` };
  const body = new FormData();
  body.append('data', new Blob([fs.readFileSync(name)], { type: 'application/json' }), name);
  const put = await fetch(`https://admin.da.live/source/${ORG}/${SITE}/shop/${name}`, { method: 'POST', body, headers: auth });
  const preview = await fetch(`https://admin.hlx.page/preview/${ORG}/${SITE}/main/shop/${name}`, { method: 'POST', headers: auth });
  console.log(`/shop/${name}: uploaded (${put.status}), previewed (${preview.status})`);
}

const regionOf = {};
Object.entries(REGION_COUNTIES).forEach(([state, regions]) => Object.entries(regions)
  .forEach(([code, counties]) => counties.forEach((county) => { regionOf[`${state}:${county}`] = code; })));

const text = await (await fetch(CENSUS)).text();
const [header, ...lines] = text.split(/\r?\n/).filter(Boolean);
const columns = header.replace(/^\uFEFF/, '').split('|');
const at = (name) => columns.indexOf(name);
const [iZip, iZipLand, iCounty, iName, iPart] = ['GEOID_ZCTA5_20', 'AREALAND_ZCTA5_20', 'GEOID_COUNTY_20',
  'NAMELSAD_COUNTY_20', 'AREALAND_PART'].map(at);

const rows = [];
const seen = new Set();
lines.forEach((line) => {
  const cells = line.split('|');
  const fips = cells[iCounty];
  const state = fips && STATES[fips.slice(0, 2)];
  if (!cells[iZip] || !state) return;
  const zip = cells[iZip];
  const county = cells[iName].replace(/ County$/, '');
  let region = WHOLE_STATE[state] || regionOf[`${state}:${county}`];
  let note = '';
  if (state === 'PA' && county === 'Centre') {
    region = CENTRE_WESTERN_ZIPS.includes(zip) ? 'WPA' : 'CPA';
    note = CENTRE_NOTE;
  }
  if (!region) return; // a New York county outside Highmark's footprint
  seen.add(`${state}:${county}`);
  const land = Number(cells[iZipLand]);
  if (!land || Number(cells[iPart]) / land < MIN_SHARE) return;
  rows.push({
    ZIP: zip, County: county, State: state, FIPS: fips, Region: region, Note: note,
  });
});
EXTRA_ROWS.forEach(([zip, county, state, fips, region, note]) => {
  if (!rows.some((row) => row.ZIP === zip)) {
    rows.push({
      ZIP: zip, County: county, State: state, FIPS: fips, Region: region, Note: note,
    });
  }
});
rows.sort((a, b) => a.ZIP.localeCompare(b.ZIP) || a.County.localeCompare(b.County));

const expected = 67 + 3 + 55 + 21; // PA, DE, WV, and the 21 New York counties
if (seen.size !== expected) throw new Error(`Expected ${expected} footprint counties, found ${seen.size}`);

fs.writeFileSync('zip-counties.json', JSON.stringify(sheet(rows)));
fs.writeFileSync('regions.json', JSON.stringify(sheet(REGIONS), null, 1));
const zips = new Set(rows.map((row) => row.ZIP));
console.log(`zip-counties.json: ${rows.length} rows, ${zips.size} ZIPs, ${seen.size} counties`);
console.log(`regions.json: ${REGIONS.length} regions`);

if (process.argv.includes('--upload')) {
  const token = readToken();
  await upload('zip-counties.json', token);
  await upload('regions.json', token);
}
