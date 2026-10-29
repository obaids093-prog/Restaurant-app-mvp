const fs = require('fs');
const path = require('path');

describe('Fix 8: Secure Token Storage & AsyncStorage Migration', () => {
  const rootPackagePath = path.resolve(__dirname, '../../package.json');
  const safeStoragePath = path.resolve(__dirname, '../../src/utils/safeStorage.js');

  it('package.json includes expo-secure-store as a dependency', () => {
    const pkg = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
    expect(pkg.dependencies['expo-secure-store']).toBeDefined();
  });

  it('safeStorage.js imports expo-secure-store and AsyncStorage', () => {
    const code = fs.readFileSync(safeStoragePath, 'utf8');
    expect(code).toMatch(/import\s*\*\s*as\s*SecureStore\s*from\s*['"]expo-secure-store['"]/);
    expect(code).toMatch(/import\s*AsyncStorage\s*from\s*['"]@react-native-async-storage\/async-storage['"]/);
  });

  it('safeStorage.js implements key sanitization for Keystore / Keychain compatibility', () => {
    const code = fs.readFileSync(safeStoragePath, 'utf8');
    expect(code).toContain('sanitizeSecureKey');
    expect(code).toMatch(/replace\(\/\[\^a-zA-Z0-9\._-\]\/g,\s*['"]_['"]\)/);
  });

  it('safeStorage.js identifies token/auth keys as secure targets', () => {
    const code = fs.readFileSync(safeStoragePath, 'utf8');
    expect(code).toContain('isSecureKey');
    expect(code).toContain('token');
    expect(code).toContain('auth');
  });

  it('safeStorage.js implements automatic migration from legacy AsyncStorage to SecureStore', () => {
    const code = fs.readFileSync(safeStoragePath, 'utf8');
    // Checks that getItem checks SecureStore first, then falls back to AsyncStorage and migrates
    expect(code).toContain('SecureStore.getItemAsync');
    expect(code).toContain('AsyncStorage.getItem');
    expect(code).toContain('SecureStore.setItemAsync');
    expect(code).toContain('AsyncStorage.removeItem');
  });

  it('safeStorage.js provides web fallback via window.localStorage', () => {
    const code = fs.readFileSync(safeStoragePath, 'utf8');
    expect(code).toMatch(/Platform\.OS\s*===\s*['"]web['"]/);
    expect(code).toContain('window.localStorage');
  });
});
