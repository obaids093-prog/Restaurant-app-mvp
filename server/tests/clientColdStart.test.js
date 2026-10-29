const fs = require('fs');
const path = require('path');

describe('Fix 7: Cold Start Retry & Waking Banner', () => {
  const clientPath = path.resolve(__dirname, '../../src/api/client.js');
  const bannerPath = path.resolve(__dirname, '../../src/components/ServerWakingBanner.js');
  const appPath = path.resolve(__dirname, '../../App.js');

  it('client.js configures 45s hard timeout limit and 5s waking banner threshold', () => {
    const clientCode = fs.readFileSync(clientPath, 'utf8');
    expect(clientCode).toMatch(/TIMEOUT_MS\s*=\s*45000/);
    expect(clientCode).toMatch(/WAKING_BANNER_THRESHOLD_MS\s*=\s*5000/);
  });

  it('client.js retries timed out GET requests once automatically', () => {
    const clientCode = fs.readFileSync(clientPath, 'utf8');
    // Asserts GET check and retry flag
    expect(clientCode).toMatch(/method\s*===\s*['"]GET['"]\s*&&\s*!options\._isRetry/);
    expect(clientCode).toMatch(/_isRetry:\s*true/);
  });

  it('client.js never retries POST, PUT, DELETE, or PATCH requests', () => {
    const clientCode = fs.readFileSync(clientPath, 'utf8');
    // Ensure retry condition is strictly gated by method === 'GET'
    expect(clientCode).not.toMatch(/method\s*===\s*['"]POST['"]\s*&&\s*!options\._isRetry/);
    expect(clientCode).not.toMatch(/method\s*===\s*['"]PUT['"]\s*&&\s*!options\._isRetry/);
    expect(clientCode).not.toMatch(/method\s*===\s*['"]DELETE['"]\s*&&\s*!options\._isRetry/);
  });

  it('client.js exports subscribeServerWaking listener and notifies on slow requests', () => {
    const clientCode = fs.readFileSync(clientPath, 'utf8');
    expect(clientCode).toContain('export const subscribeServerWaking');
    expect(clientCode).toContain('notifyServerWaking(true)');
    expect(clientCode).toContain('notifyServerWaking(false)');
  });

  it('ServerWakingBanner component displays exact text copy and subscribes to client', () => {
    const bannerCode = fs.readFileSync(bannerPath, 'utf8');
    expect(bannerCode).toContain('Waking up the server, please wait');
    expect(bannerCode).toContain('subscribeServerWaking');
  });

  it('App.js mounts ServerWakingBanner at the application root', () => {
    const appCode = fs.readFileSync(appPath, 'utf8');
    expect(appCode).toMatch(/import\s*\{\s*ServerWakingBanner\s*\}\s*from\s*['"]\.\/src\/components\/ServerWakingBanner['"]/);
    expect(appCode).toContain('<ServerWakingBanner />');
  });
});
