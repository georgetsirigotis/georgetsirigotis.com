const yearTarget = document.querySelector('[data-year]');
if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

const tabButtons = [...document.querySelectorAll('[data-tab]')];
const tabLinks = [...document.querySelectorAll('[data-tab-link]')];
const panels = [...document.querySelectorAll('[data-panel]')];
const tabIds = tabButtons.map((button) => button.dataset.tab);
const defaultTab = 'expertise';
const hasTabbedProfile = tabButtons.length > 0 && panels.length > 0;

function getTabFromHash() {
  const hash = window.location.hash.replace('#', '');
  return tabIds.includes(hash) ? hash : defaultTab;
}

function setActiveTab(tabId, options = {}) {
  const nextTab = tabIds.includes(tabId) ? tabId : defaultTab;

  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === nextTab;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', String(isActive));
    button.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  tabLinks.forEach((link) => {
    link.classList.toggle('is-active', link.dataset.tabLink === nextTab);
  });

  panels.forEach((panel) => {
    const isActive = panel.dataset.panel === nextTab;
    panel.hidden = !isActive;
    panel.classList.toggle('is-visible', isActive);
    panel.classList.toggle('reveal', isActive);
  });

  if (window.location.hash !== `#${nextTab}`) {
    history.replaceState(null, '', `#${nextTab}`);
  }

  if (options.scroll) {
    document.querySelector('#profile-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

if (hasTabbedProfile) {
  tabButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    setActiveTab(button.dataset.tab, { scroll: true });
  });

  button.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabButtons.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabButtons.length - 1;

    const nextButton = tabButtons[nextIndex];
    nextButton.focus();
    setActiveTab(nextButton.dataset.tab);
  });
});

tabLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    setActiveTab(link.dataset.tabLink, { scroll: true });
  });
});

window.addEventListener('hashchange', () => {
  setActiveTab(getTabFromHash());
});

setActiveTab(getTabFromHash());
}

const cisaFeed = document.querySelector('[data-cisa-feed]');
const cisaUpdated = document.querySelector('[data-cisa-updated]');
const cisaDateFormatter = new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' });
const cisaRetentionMonths = 6;
const cisaMaxItems = 12;

function addMonths(date, amount) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function parseCisaDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function escapeText(value = '') {
  return value.replace(/[&<>"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }[character]));
}

function renderCisaFeed(data) {
  if (!cisaFeed) return;

  const cutoff = addMonths(new Date(), -cisaRetentionMonths);
  const items = (data.items || [])
    .filter((item) => {
      const dateAdded = parseCisaDate(item.dateAdded);
      return dateAdded && dateAdded >= cutoff;
    })
    .sort((a, b) => parseCisaDate(b.dateAdded) - parseCisaDate(a.dateAdded))
    .slice(0, cisaMaxItems);

  if (cisaUpdated) {
    const generatedAt = data.generatedAt ? new Date(data.generatedAt) : null;
    cisaUpdated.textContent = generatedAt && !Number.isNaN(generatedAt.getTime())
      ? `Updated ${cisaDateFormatter.format(generatedAt)} from the CISA KEV catalog. Retention: ${cisaRetentionMonths} months.`
      : `Showing CISA KEV catalog additions from the last ${cisaRetentionMonths} months.`;
  }

  if (!items.length) {
    cisaFeed.innerHTML = `
      <article class="feed-empty">
        <h3>No recent items available</h3>
        <p>The local feed is empty or all entries are older than the configured retention window.</p>
      </article>
    `;
    return;
  }

  cisaFeed.innerHTML = items.map((item) => {
    const dateAdded = parseCisaDate(item.dateAdded);
    const dueDate = parseCisaDate(item.dueDate);
    const ransomware = item.knownRansomwareCampaignUse === 'Known' ? '<span class="risk-pill">Ransomware use known</span>' : '';

    return `
      <article class="cisa-item">
        <div class="cisa-item-meta">
          <time datetime="${escapeText(item.dateAdded)}">${dateAdded ? cisaDateFormatter.format(dateAdded) : escapeText(item.dateAdded)}</time>
          ${ransomware}
        </div>
        <h3><a href="${escapeText(item.url)}" target="_blank" rel="noopener">${escapeText(item.cveID)} - ${escapeText(item.vulnerabilityName)}</a></h3>
        <p>${escapeText(item.shortDescription)}</p>
        <dl class="cisa-facts">
          <div>
            <dt>Vendor</dt>
            <dd>${escapeText(item.vendorProject || 'Unknown')}</dd>
          </div>
          <div>
            <dt>Product</dt>
            <dd>${escapeText(item.product || 'Unknown')}</dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>${dueDate ? cisaDateFormatter.format(dueDate) : escapeText(item.dueDate || 'N/A')}</dd>
          </div>
        </dl>
      </article>
    `;
  }).join('');
}

async function loadCisaFeed() {
  if (!cisaFeed) return;

  try {
    const response = await fetch('assets/cisa-updates.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Feed request failed: ${response.status}`);
    renderCisaFeed(await response.json());
  } catch (error) {
    cisaFeed.innerHTML = `
      <article class="feed-empty">
        <h3>CISA feed unavailable</h3>
        <p>The feed could not be loaded right now. Use the full CISA catalog link above for the latest source data.</p>
      </article>
    `;
    if (cisaUpdated) cisaUpdated.textContent = 'CISA feed unavailable.';
  }
}

loadCisaFeed();
const thnFeed = document.querySelector('[data-thn-feed]');
const thnUpdated = document.querySelector('[data-thn-updated]');
const thnRetentionMonths = 6;
const thnMaxItems = 12;

function parseNewsDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function renderThnFeed(data) {
  if (!thnFeed) return;

  const cutoff = addMonths(new Date(), -thnRetentionMonths);
  const items = (data.items || [])
    .filter((item) => {
      const publishedAt = parseNewsDate(item.publishedAt);
      return publishedAt && publishedAt >= cutoff;
    })
    .sort((a, b) => parseNewsDate(b.publishedAt) - parseNewsDate(a.publishedAt))
    .slice(0, thnMaxItems);

  if (thnUpdated) {
    const generatedAt = data.generatedAt ? new Date(data.generatedAt) : null;
    thnUpdated.textContent = generatedAt && !Number.isNaN(generatedAt.getTime())
      ? `Updated ${cisaDateFormatter.format(generatedAt)} from The Hacker News. Retention: ${thnRetentionMonths} months.`
      : `Showing The Hacker News vulnerability posts from the last ${thnRetentionMonths} months.`;
  }

  if (!items.length) {
    thnFeed.innerHTML = `
      <article class="feed-empty">
        <h3>No recent items available</h3>
        <p>The local feed is empty or all entries are older than the configured retention window.</p>
      </article>
    `;
    return;
  }

  thnFeed.innerHTML = items.map((item) => {
    const publishedAt = parseNewsDate(item.publishedAt);
    const image = item.thumbnail
      ? `<img src="${escapeText(item.thumbnail)}" alt="" loading="lazy">`
      : '';

    return `
      <article class="news-item">
        ${image}
        <div class="news-item-body">
          <div class="news-item-meta">
            <time datetime="${escapeText(item.publishedAt)}">${publishedAt ? cisaDateFormatter.format(publishedAt) : escapeText(item.publishedAt)}</time>
            <span>${escapeText(item.category || 'Vulnerability')}</span>
          </div>
          <h3><a href="${escapeText(item.url)}" target="_blank" rel="noopener">${escapeText(item.title)}</a></h3>
          <p>${escapeText(item.summary)}</p>
          <span class="news-source">${escapeText(item.author || 'The Hacker News')}</span>
        </div>
      </article>
    `;
  }).join('');
}

async function loadThnFeed() {
  if (!thnFeed) return;

  try {
    const response = await fetch('assets/thn-vulnerabilities.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Feed request failed: ${response.status}`);
    renderThnFeed(await response.json());
  } catch (error) {
    thnFeed.innerHTML = `
      <article class="feed-empty">
        <h3>The Hacker News feed unavailable</h3>
        <p>The feed could not be loaded right now. Use the full THN label link above for the latest source data.</p>
      </article>
    `;
    if (thnUpdated) thnUpdated.textContent = 'The Hacker News feed unavailable.';
  }
}

loadThnFeed();



