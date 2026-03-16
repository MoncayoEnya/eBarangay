// src/utils/formatters.js
// Shared formatting utilities used across all pages and components

// ── Date & Time ───────────────────────────────────────────────

/**
 * Converts a Firestore Timestamp or ISO string to a JS Date safely.
 */
const toDate = (ts) => {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();          // Firestore Timestamp
  if (ts.seconds) return new Date(ts.seconds * 1000); // Firestore raw object
  return new Date(ts);                         // ISO string or Date
};

/**
 * Format: "March 15, 2026"
 */
export const formatDate = (ts) => {
  const d = toDate(ts);
  if (!d || isNaN(d)) return '—';
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
};

/**
 * Format: "Mar 15, 2026"
 */
export const formatDateShort = (ts) => {
  const d = toDate(ts);
  if (!d || isNaN(d)) return '—';
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Format: "Mar 15"
 */
export const formatDateMini = (ts) => {
  const d = toDate(ts);
  if (!d || isNaN(d)) return '—';
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

/**
 * Format: "9:30 AM"
 */
export const formatTime = (ts) => {
  const d = toDate(ts);
  if (!d || isNaN(d)) return '—';
  return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
};

/**
 * Format: "March 15, 2026 at 9:30 AM"
 */
export const formatDateTime = (ts) => {
  const d = toDate(ts);
  if (!d || isNaN(d)) return '—';
  return `${formatDate(ts)} at ${formatTime(ts)}`;
};

/**
 * Relative time: "2 mins ago", "3h ago", "Yesterday", "Mar 10"
 */
export const formatRelativeTime = (ts) => {
  const d = toDate(ts);
  if (!d || isNaN(d)) return 'Just now';
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)     return `${diff}s ago`;
  if (diff < 3600)   return `${Math.floor(diff / 60)} min${Math.floor(diff / 60) > 1 ? 's' : ''} ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return formatDateShort(ts);
};

/**
 * Age from birthdate
 */
export const calculateAge = (birthDateTs) => {
  const d = toDate(birthDateTs);
  if (!d || isNaN(d)) return '—';
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
};

// ── Currency ──────────────────────────────────────────────────

/**
 * Format: "₱1,234.50"
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₱0.00';
  return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format: "₱1.2M", "₱34.5K", "₱500"
 */
export const formatCurrencyShort = (amount) => {
  if (!amount || isNaN(amount)) return '₱0';
  if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `₱${(amount / 1_000).toFixed(1)}K`;
  return `₱${amount}`;
};

// ── Names & Text ──────────────────────────────────────────────

/**
 * "juan dela cruz" → "Juan Dela Cruz"
 */
export const formatName = (name) => {
  if (!name) return '—';
  return name.replace(/\b\w/g, c => c.toUpperCase());
};

/**
 * "Juan Dela Cruz" → "JD" (initials for avatars)
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase()).filter(Boolean).slice(0, 2).join('');
};

/**
 * Phone: "09171234567" → "0917-123-4567"
 */
export const formatPhone = (phone) => {
  if (!phone) return '—';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length === 11) return `${clean.slice(0,4)}-${clean.slice(4,7)}-${clean.slice(7)}`;
  if (clean.length === 10) return `${clean.slice(0,3)}-${clean.slice(3,6)}-${clean.slice(6)}`;
  return phone;
};

/**
 * Truncate long text: "This is a very long..." 
 */
export const truncate = (text, maxLength = 60) => {
  if (!text) return '—';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

/**
 * Capitalize first letter only: "pending" → "Pending"
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// ── Numbers ───────────────────────────────────────────────────

/**
 * "4821" → "4,821"
 */
export const formatNumber = (n) => {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('en-PH');
};

/**
 * 0.78 → "78%"
 */
export const formatPercent = (decimal, digits = 1) => {
  if (decimal === null || decimal === undefined) return '—';
  return `${(decimal * 100).toFixed(digits)}%`;
};

// ── Status Helpers ────────────────────────────────────────────

/**
 * Returns Tailwind-compatible style object for status badges.
 * Works for documents, incidents, events, health, etc.
 */
export const getStatusStyle = (status) => {
  const map = {
    // Document
    Pending:    { bg: '#fffbeb', color: '#92400e', border: '#fbbf24' },
    Processing: { bg: '#eff6ff', color: '#1e40af', border: '#93c5fd' },
    Approved:   { bg: '#f0fdf4', color: '#166534', border: '#86efac' },
    Released:   { bg: '#ecfdf5', color: '#065f46', border: '#6ee7b7' },
    Denied:     { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
    // Incident
    Open:              { bg: '#fffbeb', color: '#92400e', border: '#fbbf24' },
    'Under Mediation': { bg: '#eff6ff', color: '#1e40af', border: '#93c5fd' },
    Resolved:          { bg: '#f0fdf4', color: '#166534', border: '#86efac' },
    'Referred to PNP': { bg: '#fdf4ff', color: '#7e22ce', border: '#d8b4fe' },
    // General
    Active:   { bg: '#f0fdf4', color: '#166534', border: '#86efac' },
    Inactive: { bg: '#f8fafc', color: '#475569', border: '#cbd5e1' },
    Standby:  { bg: '#fffbeb', color: '#92400e', border: '#fbbf24' },
    Full:     { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
    Closed:   { bg: '#f8fafc', color: '#475569', border: '#cbd5e1' },
    // Appointments
    Scheduled:  { bg: '#eff6ff', color: '#1e40af', border: '#93c5fd' },
    Completed:  { bg: '#f0fdf4', color: '#166534', border: '#86efac' },
    Cancelled:  { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
    'No Show':  { bg: '#fff7ed', color: '#9a3412', border: '#fdba74' },
  };
  return map[status] || { bg: '#f8fafc', color: '#475569', border: '#cbd5e1' };
};