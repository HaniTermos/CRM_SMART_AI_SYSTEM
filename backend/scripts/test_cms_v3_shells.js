/**
 * SmartStore Website Studio (CMS V3) — Route Shell Isolation Test Suite
 */

const fs = require('fs');
const path = require('path');

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

function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
}

function runShellTests() {
  console.log('====================================================');
  console.log('SmartStore Website Studio (CMS V3) Shell Isolation Test');
  console.log('====================================================\n');

  const rootDir = path.resolve(__dirname, '../..');

  // 1. Verify CmsStudioShell file exists and contains top-level layout
  const studioShellPath = path.join(rootDir, 'src/cms-v3/shell/CmsStudioShell.tsx');
  assert(fs.existsSync(studioShellPath), 'CmsStudioShell component file exists.');

  const studioCode = stripComments(fs.readFileSync(studioShellPath, 'utf8'));
  assert(!studioCode.includes('AdminSidebar'), 'CmsStudioShell does NOT import or render AdminSidebar.');
  assert(!studioCode.includes('BottomDock'), 'CmsStudioShell does NOT import or render BottomDock.');
  assert(!studioCode.includes('TopNavbar'), 'CmsStudioShell does NOT import or render TopNavbar.');
  assert(!studioCode.includes('FloatingAIV3'), 'CmsStudioShell does NOT import or render FloatingAIV3.');

  // 2. Verify EditorShell file exists and contains fullscreen dark workspace
  const editorShellPath = path.join(rootDir, 'src/cms-v3/editor/EditorShell.tsx');
  assert(fs.existsSync(editorShellPath), 'EditorShell component file exists.');

  const editorCode = stripComments(fs.readFileSync(editorShellPath, 'utf8'));
  assert(!editorCode.includes('AdminSidebar'), 'EditorShell does NOT import or render AdminSidebar.');
  assert(!editorCode.includes('BottomDock'), 'EditorShell does NOT import or render BottomDock.');
  assert(!editorCode.includes('TopNavbar'), 'EditorShell does NOT import or render TopNavbar.');
  assert(!editorCode.includes('FloatingAIV3'), 'EditorShell does NOT import or render FloatingAIV3.');

  // Verify exact 100dvh scroll layout CSS classes
  assert(editorCode.includes('editor-root'), 'EditorShell establishes .editor-root layout container.');
  assert(editorCode.includes('editor-body'), 'EditorShell establishes .editor-body 3-column grid container.');
  assert(editorCode.includes('editor-canvas'), 'EditorShell establishes .editor-canvas scroll container.');

  // 3. Verify top-level routes exist outside _admin.tsx
  const v3RoutePath = path.join(rootDir, 'src/routes/cms-v3.tsx');
  assert(fs.existsSync(v3RoutePath), 'Top-level /cms-v3 route file exists under src/routes/cms-v3.tsx.');

  const v3RouteContent = fs.readFileSync(v3RoutePath, 'utf8');
  assert(!v3RouteContent.includes('_admin'), 'Route cms-v3.tsx is registered top-level (does NOT inherit _admin.tsx).');

  const editorRoutePath = path.join(rootDir, 'src/routes/cms-v3.editor.$pageId.tsx');
  assert(fs.existsSync(editorRoutePath), 'Top-level /cms-v3/editor/$pageId route file exists.');

  // 4. Verify existing legacy routes are untouched
  const legacyCmsPath = path.join(rootDir, 'src/routes/_admin.cms.tsx');
  assert(fs.existsSync(legacyCmsPath), 'Legacy /cms route remains intact.');

  const shopSlugPath = path.join(rootDir, 'src/routes/shop.$slug.tsx');
  assert(fs.existsSync(shopSlugPath), 'Legacy public storefront /shop/$slug route remains intact.');

  console.log('\n====================================================');
  console.log(`SHELL ISOLATION SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runShellTests();
