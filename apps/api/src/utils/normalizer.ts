/**
 * Normalizes a phone number to standard international format (e.g. +91XXXXXXXXXX)
 */
export function normalizePhone(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;
  const cleaned = rawPhone.toString().replace(/[^0-9+]/g, '');
  if (!cleaned) return null;

  // Handle standard Indian numbers
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+91${cleaned.substring(1)}`;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

/**
 * Formats a phone number for human-readable display
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  const p = phone.trim();
  if (p.startsWith('+91') && p.length === 13) {
    return `+91 ${p.substring(3, 8)} ${p.substring(8)}`;
  }
  return p;
}

/**
 * Normalizes email: trims and converts to lowercase
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : null;
}

/**
 * Normalizes a website URL and extracts domain
 */
export function normalizeWebsite(url: string | null | undefined): { normalizedUrl: string | null; domain: string | null } {
  if (!url || url.trim() === '-' || url.trim() === '') {
    return { normalizedUrl: null, domain: null };
  }
  let clean = url.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  try {
    const parsed = new URL(clean);
    const domain = parsed.hostname.replace(/^www\./, '').toLowerCase();
    return {
      normalizedUrl: clean,
      domain
    };
  } catch {
    return {
      normalizedUrl: clean,
      domain: null
    };
  }
}

/**
 * Transparent lead scoring calculator
 */
export function calculateLeadScore(data: {
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasWebsiteNeed?: boolean;
  activityCount?: number;
  hasPositiveOutcome?: boolean;
  hasMeeting?: boolean;
  hasDemo?: boolean;
  daysSinceLastContact?: number;
}): { score: number; factors: string[] } {
  let score = 10;
  const factors: string[] = ['+10 Base lead creation'];

  if (data.hasEmail && data.hasPhone) {
    score += 15;
    factors.push('+15 Complete contact info (email & phone)');
  }
  if (data.hasWebsiteNeed) {
    score += 15;
    factors.push('+15 Identified website service need');
  }
  if (data.hasPositiveOutcome) {
    score += 20;
    factors.push('+20 Positive call/outreach response');
  }
  if (data.hasDemo) {
    score += 20;
    factors.push('+20 Demo requested or sent');
  }
  if (data.hasMeeting) {
    score += 25;
    factors.push('+25 Meeting scheduled / completed');
  }
  if (data.daysSinceLastContact && data.daysSinceLastContact > 30) {
    score = Math.max(0, score - 15);
    factors.push('-15 Inactivity penalty (> 30 days no outreach)');
  }

  return { score: Math.min(100, score), factors };
}
