import type { NavigateFunction } from 'react-router-dom';

export interface BookingPayload {
  intentText?: string;
  serviceCategory?: string;
  entrySource?: string;
}

/**
 * Canonical booking entry function.
 * Every booking flow MUST go through this function.
 * It persists the payload as URL query params and navigates to /book-job.
 */
export function startBooking(navigate: NavigateFunction, payload: BookingPayload = {}) {
  const params = new URLSearchParams();

  if (payload.intentText) {
    params.set('intent', payload.intentText);
  }
  if (payload.serviceCategory) {
    params.set('category', payload.serviceCategory);
  }
  if (payload.entrySource) {
    params.set('source', payload.entrySource);
  }

  // Always add a cache-bust to force fresh form
  params.set('new', String(Date.now()));

  const search = params.toString();
  navigate(`/book-job${search ? `?${search}` : ''}`);
}
