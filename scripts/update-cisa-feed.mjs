import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const RETENTION_MONTHS = 6;
const MAX_ITEMS = 12;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'assets', 'cisa-updates.json');

function parseDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addMonths(date, amount) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + amount);
  return next;
}

function firstUrl(notes = '') {
  return notes
    .split(/\s*;\s*/)
    .map((note) => note.trim())
    .find((note) => /^https?:\/\//i.test(note));
}

function normalizeItem(item) {
  return {
    cveID: item.cveID,
    vendorProject: item.vendorProject,
    product: item.product,
    vulnerabilityName: item.vulnerabilityName,
    dateAdded: item.dateAdded,
    dueDate: item.dueDate,
    knownRansomwareCampaignUse: item.knownRansomwareCampaignUse,
    shortDescription: item.shortDescription,
    requiredAction: item.requiredAction,
    url: firstUrl(item.notes) || `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(item.cveID)}`,
  };
}

const response = await fetch(SOURCE_URL, {
  headers: {
    accept: 'application/json',
    'user-agent': 'georgetsirigotis.com static feed updater',
  },
});

if (!response.ok) {
  throw new Error(`CISA feed request failed: ${response.status} ${response.statusText}`);
}

const catalog = await response.json();
const cutoff = addMonths(new Date(), -RETENTION_MONTHS);
const items = (catalog.vulnerabilities || [])
  .filter((item) => {
    const dateAdded = parseDate(item.dateAdded);
    return dateAdded && dateAdded >= cutoff;
  })
  .sort((a, b) => parseDate(b.dateAdded) - parseDate(a.dateAdded))
  .slice(0, MAX_ITEMS)
  .map(normalizeItem);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      source: SOURCE_URL,
      sourceTitle: catalog.title || 'CISA Catalog of Known Exploited Vulnerabilities',
      catalogVersion: catalog.catalogVersion,
      sourceReleasedAt: catalog.dateReleased,
      generatedAt: new Date().toISOString(),
      retentionMonths: RETENTION_MONTHS,
      maxItems: MAX_ITEMS,
      itemCount: items.length,
      items,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

console.log(`Wrote ${items.length} CISA updates to ${path.relative(root, outputPath)}`);
