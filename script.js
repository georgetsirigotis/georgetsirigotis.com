const yearTarget = document.querySelector('[data-year]');
if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}
