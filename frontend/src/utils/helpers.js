/**
 * Format a date string into a human-readable format.
 * e.g. "2026-03-12" → "Mar 12, 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format a number as currency (USD by default).
 * e.g. 1345672 → "$1,345,672.00"
 */
export function formatCurrency(value, currency = 'USD') {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

/**
 * Format a number with locale-aware thousand separators.
 * e.g. 1345672 → "1,345,672"
 */
export function formatNumber(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US').format(value)
}

/**
 * Return a Tailwind color class for a stock status.
 */
export function statusColor(status) {
  switch (status) {
    case 'In Stock':
      return 'text-emerald-400'
    case 'Low Stock':
      return 'text-amber-400'
    case 'Out of Stock':
      return 'text-red-400'
    default:
      return 'text-gray-400'
  }
}
