/**
 * Standardized Timezone & Date Formatting Utilities
 * Converts UTC / ISO timestamps into Asia/Kolkata (IST) display strings.
 */

/**
 * Formats a date string or timestamp to "DD MMM YYYY, hh:mm AM/PM IST"
 * Example: 2026-09-10T04:32:24Z -> "10 Sep 2026, 10:02 AM IST"
 * 
 * @param {string|number|Date|null|undefined} dateInput 
 * @param {string} fallback Default returned if dateInput is missing or invalid
 * @returns {string} Formatted IST timestamp
 */
export const formatISTDateTime = (dateInput, fallback = 'N/A') => {
  if (!dateInput) return fallback;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return fallback;

  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const parts = formatter.formatToParts(d);
    const partMap = {};
    for (const p of parts) {
      partMap[p.type] = p.value;
    }

    const day = partMap.day || '';
    let month = partMap.month || '';
    if (month === 'Sept') month = 'Sep';
    const year = partMap.year || '';
    const hour = partMap.hour || '';
    const minute = partMap.minute || '';
    const dayPeriod = (partMap.dayPeriod || '').toUpperCase();

    return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod} IST`.trim();
  } catch {
    return fallback;
  }
};

/**
 * Formats date-only to "DD MMM YYYY" in Asia/Kolkata timezone
 */
export const formatISTDateOnly = (dateInput, fallback = 'N/A') => {
  if (!dateInput) return fallback;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return fallback;

  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const parts = formatter.formatToParts(d);
    const partMap = {};
    for (const p of parts) {
      partMap[p.type] = p.value;
    }

    const day = partMap.day || '';
    let month = partMap.month || '';
    if (month === 'Sept') month = 'Sep';
    const year = partMap.year || '';

    return `${day} ${month} ${year}`.trim();
  } catch {
    return fallback;
  }
};

export default formatISTDateTime;
