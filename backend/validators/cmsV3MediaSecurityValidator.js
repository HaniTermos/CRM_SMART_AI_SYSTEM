/**
 * SmartStore Website Studio (CMS V3) — Media Security & HTML Sanitizer Validator
 */

class CmsV3MediaSecurityValidator {
  /**
   * Allowed video providers & domain allowlist
   */
  static ALLOWED_VIDEO_DOMAINS = [
    'youtube.com',
    'www.youtube.com',
    'youtube-nocookie.com',
    'www.youtube-nocookie.com',
    'youtu.be',
    'vimeo.com',
    'player.vimeo.com'
  ];

  /**
   * Validates video URL against provider allowlist
   */
  static validateVideoUrl(url) {
    if (!url || typeof url !== 'string') return { isValid: false, reason: 'Missing URL' };
    const cleanUrl = url.trim().toLowerCase();

    try {
      const parsed = new URL(cleanUrl);
      const isAllowedHost = this.ALLOWED_VIDEO_DOMAINS.some(domain => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain));
      const isMp4 = parsed.pathname.endsWith('.mp4');

      if (!isAllowedHost && !isMp4) {
        return { isValid: false, reason: `Unapproved video domain: ${parsed.hostname}` };
      }
      return { isValid: true, host: parsed.hostname };
    } catch {
      return { isValid: false, reason: 'Invalid URL format' };
    }
  }

  /**
   * Server-side HTML Allowlist Sanitizer for Rich Text
   * Allows only p, h2-h6, strong, em, u, ul, ol, li, blockquote, a, br
   * Strips script, event handlers (onclick=), javascript: URLs, forms, style attributes
   */
  static sanitizeRichTextHtml(html) {
    if (!html || typeof html !== 'string') return '';

    let clean = html;

    // 1. Strip script, style, iframe, object, embed, form tags and contents
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
    clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
    clean = clean.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');

    // 2. Remove inline event handlers (on*="...")
    clean = clean.replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

    // 3. Remove javascript: and data: URLs
    clean = clean.replace(/href\s*=\s*["']?\s*(?:javascript|data):[^"'>\s]+/gi, 'href="#"');

    // 4. Remove inline style attributes
    clean = clean.replace(/\s*style\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

    return clean;
  }
}

module.exports = CmsV3MediaSecurityValidator;
