/**
 * Display and aggregate amounts in LKR for admin reporting.
 * Stripe stores settlement amounts in the session currency (often USD).
 * Override rate: VITE_USD_TO_LKR_RATE (e.g. 320).
 */
const DEFAULT_USD_TO_LKR = 305;

export function getUsdToLkrRate() {
  const raw = import.meta.env.VITE_USD_TO_LKR_RATE;
  const n = raw != null && raw !== '' ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_USD_TO_LKR;
}

/** Convert a major-unit amount to LKR for totals. */
export function amountToLkr(amount, currency = 'USD') {
  const c = String(currency || 'USD').toUpperCase();
  const n = Number(amount) || 0;
  if (c === 'LKR') return n;
  if (c === 'USD') return n * getUsdToLkrRate();
  return n * getUsdToLkrRate();
}

export function formatLkr(amountLkr) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amountLkr);
}

export function formatMoneyAmount(amount, currency = 'USD') {
  const code = String(currency || 'USD').trim().toUpperCase();
  const n = Number(amount) || 0;
  if (/^[A-Z]{3}$/.test(code)) {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(n);
    } catch {
      // fall through
    }
  }
  return `${code} ${n.toFixed(2)}`;
}
