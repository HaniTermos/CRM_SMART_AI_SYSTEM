/**
 * SmartStore Website Studio (CMS V3) — Client-Side Rich Text Sanitizer
 */

export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  let clean = rawHtml;

  // Remove dangerous tags and executable content
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "");
  clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "");
  clean = clean.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "");

  // Remove inline event handlers
  clean = clean.replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // Remove javascript: and data: URLs
  clean = clean.replace(/href\s*=\s*["']?\s*(?:javascript|data):[^"'>\s]+/gi, 'href="#"');

  return clean;
}
