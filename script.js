const yearTarget = document.querySelector('[data-year]');
if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

const tabButtons = [...document.querySelectorAll('[data-tab]')];
const tabLinks = [...document.querySelectorAll('[data-tab-link]')];
const panels = [...document.querySelectorAll('[data-panel]')];
const tabIds = tabButtons.map((button) => button.dataset.tab);
const defaultTab = 'expertise';

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
