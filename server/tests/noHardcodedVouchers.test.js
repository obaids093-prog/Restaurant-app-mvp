const fs = require('fs');
const path = require('path');

describe('Codebase Hygiene: No Hardcoded Vouchers in Client src/', () => {
  const FORBIDDEN_STRINGS = [
    'WELCOME10',
    'FEAST20',
    'AURA30',
    'SAVE20',
    'CHEF15',
    'GOURMET30',
    "Chef's Tasting",
  ];

  const srcDir = path.resolve(__dirname, '../../src');

  function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFiles(fullPath));
      } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(fullPath);
      }
    });
    return results;
  }

  it('scans all src/ files to ensure no hardcoded voucher codes or promo titles exist', () => {
    const files = getFiles(srcDir);
    expect(files.length).toBeGreaterThan(0);

    const violations = [];

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const forbidden of FORBIDDEN_STRINGS) {
        if (content.includes(forbidden)) {
          const relative = path.relative(srcDir, filePath);
          violations.push(`${relative} contains forbidden string "${forbidden}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
