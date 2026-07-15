import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://thehackernews.com/feeds/posts/default/-/Vulnerability?alt=json&max-results=24';
const LABEL_URL = 'https://thehackernews.com/search/label/Vulnerability';
const RETENTION_MONTHS = 6;
const MAX_ITEMS = 12;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'assets', 'thn-vulnerabilities.json');

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addMonths(date, amount) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + amount);
  return next;
}

function textValue(field) {
  return typeof field?.$t === 'string' ? field.$t.trim() : '';
}

function cleanSummary(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
    .slice(0, 280);
}

function alternateUrl(entry) {
  return (entry.link || []).find((link) => link.rel === 'alternate')?.href || LABEL_URL;
}

function authorName(entry) {
  return textValue(entry.author?.[0]?.name) || 'The Hacker News';
}

function category(entry) {
  return textValue(entry.georss$featurename).split('/').map((part) => part.trim()).find(Boolean) || 'Vulnerability';
}

function normalizeItem(entry) {
  return {
    id: textValue(entry.id),
    title: textValue(entry.title),
    summary: cleanSummary(textValue(entry.summary)),
    url: alternateUrl(entry),
    publishedAt: textValue(entry.published),
    updatedAt: textValue(entry.updated),
    author: authorName(entry),
    category: category(entry),
    thumbnail: entry.media$thumbnail?.url || '',
  };
}

const response = await fetch(SOURCE_URL, {
  headers: {
    accept: 'application/json',
    'user-agent': 'georgetsirigotis.com static feed updater',
  },
});

if (!response.ok) {
  throw new Error(`The Hacker News feed request failed: ${response.status} ${response.statusText}`);
}

const payload = await response.json();
const cutoff = addMonths(new Date(), -RETENTION_MONTHS);
const items = (payload.feed?.entry || [])
  .filter((entry) => {
    const publishedAt = parseDate(textValue(entry.published));
    return publishedAt && publishedAt >= cutoff;
  })
  .sort((a, b) => parseDate(textValue(b.published)) - parseDate(textValue(a.published)))
  .slice(0, MAX_ITEMS)
  .map(normalizeItem);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      source: SOURCE_URL,
      sourceTitle: textValue(payload.feed?.title) || 'The Hacker News Vulnerability Feed',
      labelUrl: LABEL_URL,
      sourceUpdatedAt: textValue(payload.feed?.updated),
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

console.log(`Wrote ${items.length} The Hacker News vulnerability updates to ${path.relative(root, outputPath)}`);
