export const BACKEND_PAGE_URL = 'http://127.0.0.1:8000/backend';

export function openBackendAfterAssessment() {
  if (typeof window !== 'undefined' && typeof window.open === 'function') {
    window.open(BACKEND_PAGE_URL, '_blank', 'noopener,noreferrer');
  }

  return BACKEND_PAGE_URL;
}
