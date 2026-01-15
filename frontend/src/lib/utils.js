import { clsx } from 'clsx';

/**
 * Merge class names with clsx
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Format a number as percentage
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Format a number with appropriate precision
 */
export function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined) return '—';
  return Number(value).toFixed(decimals);
}

/**
 * Format a date relative to now
 */
export function formatRelativeTime(date) {
  if (!date) return '—';
  
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return then.toLocaleDateString();
}

/**
 * Format a date
 */
export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get sentiment color class
 */
export function getSentimentColor(sentiment) {
  switch (sentiment) {
    case 'positive':
      return 'text-success-400';
    case 'negative':
      return 'text-danger-400';
    default:
      return 'text-navy-400';
  }
}

/**
 * Get sentiment badge class
 */
export function getSentimentBadge(sentiment) {
  switch (sentiment) {
    case 'positive':
      return 'badge-success';
    case 'negative':
      return 'badge-danger';
    default:
      return 'badge-neutral';
  }
}

/**
 * Truncate text
 */
export function truncate(text, length = 50) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Generate a random color for charts
 */
export function getChartColor(index) {
  const colors = [
    '#3b82f6', // blue
    '#22c55e', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#ec4899', // pink
  ];
  return colors[index % colors.length];
}

/**
 * Calculate change indicator
 */
export function getChangeIndicator(current, previous) {
  if (previous === null || previous === undefined || current === null || current === undefined) {
    return { change: null, direction: 'neutral' };
  }
  
  const change = current - previous;
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  
  return { change, direction };
}