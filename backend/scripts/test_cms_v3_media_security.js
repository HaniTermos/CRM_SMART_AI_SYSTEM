/**
 * SmartStore Website Studio (CMS V3) — Media Security & Sanitization Test Suite
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const CmsV3MediaSecurityValidator = require('../validators/cmsV3MediaSecurityValidator');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASSED: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    failedTests++;
  }
}

function runMediaSecurityTests() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Media Security & Sanitizer Test Suite');
  console.log('====================================================\n');

  console.log('[TEST GROUP 1] Video Provider Allowlist Validation:');

  const youtubeVal = CmsV3MediaSecurityValidator.validateVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert(youtubeVal.isValid, 'YouTube provider URL accepted by security validator.');

  const vimeoVal = CmsV3MediaSecurityValidator.validateVideoUrl('https://vimeo.com/76979871');
  assert(vimeoVal.isValid, 'Vimeo provider URL accepted by security validator.');

  const mp4Val = CmsV3MediaSecurityValidator.validateVideoUrl('https://cdn.smartstore.ai/assets/promo.mp4');
  assert(mp4Val.isValid, 'MP4 direct media URL accepted by security validator.');

  const maliciousVal = CmsV3MediaSecurityValidator.validateVideoUrl('https://malicious-site.com/video.exe');
  assert(!maliciousVal.isValid, 'Unapproved external video domain rejected by security validator.');

  console.log('\n[TEST GROUP 2] Rich Text HTML Allowlist Sanitization:');

  const maliciousHtml = '<p>Safe Text</p><script>alert("XSS")</script><a href="javascript:hack()">Link</a><iframe src="evil.com"></iframe>';
  const cleanHtml = CmsV3MediaSecurityValidator.sanitizeRichTextHtml(maliciousHtml);

  assert(!cleanHtml.includes('<script>'), 'Sanitizer strips <script> tags from rich text HTML.');
  assert(!cleanHtml.includes('<iframe>'), 'Sanitizer strips <iframe> tags from rich text HTML.');
  assert(!cleanHtml.includes('javascript:'), 'Sanitizer strips javascript: protocol from links.');
  assert(cleanHtml.includes('<p>Safe Text</p>'), 'Sanitizer preserves safe HTML formatting tags.');

  console.log('\n====================================================');
  console.log(`MEDIA SECURITY SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runMediaSecurityTests();
