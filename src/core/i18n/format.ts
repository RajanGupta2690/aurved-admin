/**
 * Dates, numbers and money follow the region the person chose. The words on the screens are English only for now.
 * Pages call these on every render, so a change shows at once.
 */
export interface Region {
  locale: string;
  timeZone: string;
  currency: string;
}

export const LOCALES = [
  { value: 'en-IN', label: 'English (India): 21 Nov 2026, 12,34,567' },
  { value: 'en-GB', label: 'English (United Kingdom): 21 Nov 2026, 1,234,567' },
  { value: 'en-US', label: 'English (United States): Nov 21, 2026, 1,234,567' },
  { value: 'hi-IN', label: 'Hindi (India): 21 नव॰ 2026, 12,34,567' },
  { value: 'de-DE', label: 'German (Germany): 21. Nov. 2026, 1.234.567' },
  { value: 'ar-AE', label: 'Arabic (UAE): numerals and dates in Arabic' },
];
export const TIME_ZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'America/New_York', 'Asia/Singapore', 'Australia/Sydney'];
export const CURRENCIES = [
  { value: 'INR', label: 'Indian rupee (INR)' },
  { value: 'USD', label: 'US dollar (USD)' },
  { value: 'GBP', label: 'Pound sterling (GBP)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'AED', label: 'UAE dirham (AED)' },
];

let region: Region = { locale: 'en-IN', timeZone: 'Asia/Kolkata', currency: 'INR' };

export function configureRegion(next: Partial<Region>) {
  const merged = { ...region, ...next };
  // An unknown value never breaks the page. It falls back to the default.
  try {
    new Intl.DateTimeFormat(merged.locale, { timeZone: merged.timeZone });
    new Intl.NumberFormat(merged.locale, { style: 'currency', currency: merged.currency });
    region = merged;
  } catch {
    // keep the previous region
  }
}

export const currentRegion = (): Region => region;

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return 'Not set';
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  // A plain date has no time of day, so it is shown as written whatever the time zone.
  return date.toLocaleDateString(region.locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: iso.length === 10 ? 'UTC' : region.timeZone });
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString(region.locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: region.timeZone });
}

export const formatNumber = (value: number): string => value.toLocaleString(region.locale);

export const formatMoney = (value: number, currency: string = region.currency): string =>
  new Intl.NumberFormat(region.locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
