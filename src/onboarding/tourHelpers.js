/**
 * Shared onboarding utilities. Renamed from helpers.js to tourHelpers.js
 * to avoid ambiguity with any other helpers in the project.
 */

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitForElement(selector, timeoutMs = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const el = document.querySelector(selector);
    if (el) return el;
    await sleep(50);
  }
  return null;
}

export function smoothScrollTo(element) {
  if (!element) return;
  element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
}
