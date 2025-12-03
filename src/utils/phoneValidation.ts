// Mexican phone validation constants
export const MEXICO_COUNTRY_CODE = '+52';

/**
 * Format phone for display (adds spaces for readability)
 * Input: "5512345678" -> Output: "55 1234 5678"
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6, 10)}`;
}

/**
 * Validate Mexican phone number format
 * Mexican numbers are 10 digits (area code + 8 digit number)
 */
export function isValidMexicanPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 && /^[1-9]\d{9}$/.test(cleaned);
}

/**
 * Format for storage/API (just digits with country code)
 * Input: "55 1234 5678" -> Output: "525512345678"
 */
export function formatPhoneForStorage(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.startsWith('52') ? cleaned : `52${cleaned}`;
}

/**
 * Get just the 10 digits without country code
 */
export function getCleanPhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(0, 10);
}
