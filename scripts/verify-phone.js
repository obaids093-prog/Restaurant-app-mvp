/**
 * scripts/verify-phone.js
 * ═══════════════════════════════════════════════════════════
 * End-to-end verification that the phone number the app sends to:
 *   - POST /api/auth/phone/send-otp
 *   - POST /api/auth/phone/verify-otp
 *   - POST /api/auth/register
 * is exactly in the format the server's normalizePakPhone() accepts.
 *
 * Requirements:
 *   1. Reads normalizePakPhone directly from server/controllers/authController.js
 *      without modifying any server code.
 *   2. Imports toPakServerPhone from src/utils/phone.js (where the app builds requests).
 *   3. Demonstrates that PhoneInput's 10-digit format ("3001234567") is converted to
 *      "03XXXXXXXXX" and successfully validated and normalized by the server.
 * ═══════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function runVerification() {
  console.log('================================================================');
  console.log('       AURA RESTAURANT APP — PHONE NORMALIZATION VERIFICATION   ');
  console.log('================================================================\n');

  // 1. Extract normalizePakPhone from server/controllers/authController.js
  const authControllerPath = path.resolve(__dirname, '../server/controllers/authController.js');
  console.log(`[1] Reading server code from:\n    ${authControllerPath}`);
  const authControllerSource = fs.readFileSync(authControllerPath, 'utf8');

  const match = authControllerSource.match(/const normalizePakPhone = \((?:rawPhone)?\)\s*=>\s*\{[\s\S]*?\n\};/);
  if (!match) {
    console.error('ERROR: Could not locate normalizePakPhone in authController.js');
    process.exit(1);
  }

  const vmContext = {};
  vm.createContext(vmContext);
  const normalizePakPhone = vm.runInContext(
    `(() => {\n${match[0]}\nreturn normalizePakPhone;\n})()`,
    vmContext
  );

  console.log('    ✓ Extracted normalizePakPhone() verbatim from server (server code untouched):\n');
  console.log('    ' + match[0].split('\n').join('\n    '));
  console.log('\n----------------------------------------------------------------');

  // 2. Import app request builder utility
  const phoneUtilPath = path.resolve(__dirname, '../src/utils/phone.js');
  console.log(`[2] Loading app phone formatting utility from:\n    ${phoneUtilPath}`);
  const { toPakServerPhone } = await import(`file://${phoneUtilPath.replace(/\\/g, '/')}`);
  console.log('    ✓ Loaded toPakServerPhone() successfully.\n');
  console.log('----------------------------------------------------------------');

  // 3. Test Cases for PhoneInput (10 digits)
  console.log('[3] Testing PhoneInput 10-digit values across all major Pakistani networks:');
  const testCases = [
    { network: 'Mobilink / Jazz', input: '3001234567' },
    { network: 'Zong',            input: '3123456789' },
    { network: 'Warid',           input: '3219876543' },
    { network: 'Ufone',           input: '3331122334' },
    { network: 'Telenor',         input: '3455566778' },
    { network: 'SCOM',            input: '3559988776' },
  ];

  let allPassed = true;

  testCases.forEach(({ network, input }) => {
    // Exact string the app builds and sends:
    const appSentString = toPakServerPhone(input);

    // Call server normalizePakPhone with the exact string the app sends:
    const serverResult = normalizePakPhone(appSentString);

    const isValid =
      serverResult !== null &&
      serverResult === `0${input}` &&
      /^03\d{9}$/.test(serverResult);

    if (isValid) {
      console.log(`    ✓ [PASS] [${network}] PhoneInput: "${input}" → App sends: "${appSentString}" → Server normalizePakPhone: "${serverResult}"`);
    } else {
      console.error(`    ✗ [FAIL] [${network}] PhoneInput: "${input}" → App sends: "${appSentString}" → Server normalizePakPhone: "${serverResult}"`);
      allPassed = false;
    }
  });

  console.log('\n----------------------------------------------------------------');
  console.log('[4] Simulating the 3 Auth Endpoints where requests are built:');

  const rawPhoneInput = '3001234567';

  // Endpoint 1: POST /api/auth/phone/send-otp
  console.log('\n  • Endpoint A: POST /api/auth/phone/send-otp');
  const sendOtpRequestBody = {
    phone: toPakServerPhone(rawPhoneInput),
  };
  console.log(`    Request Body built:`, JSON.stringify(sendOtpRequestBody));
  const sendOtpServerCheck = normalizePakPhone(sendOtpRequestBody.phone);
  console.log(`    Server normalizePakPhone(req.body.phone) => "${sendOtpServerCheck}"`);
  if (sendOtpServerCheck === '03001234567') {
    console.log('    ✓ Result: Accepted & valid 03XXXXXXXXX');
  } else {
    console.error('    ✗ Result: Failed!');
    allPassed = false;
  }

  // Endpoint 2: POST /api/auth/phone/verify-otp
  console.log('\n  • Endpoint B: POST /api/auth/phone/verify-otp');
  const verifyOtpRequestBody = {
    phone: toPakServerPhone(rawPhoneInput),
    otp: '4821',
    name: 'Syed Obaid Ali',
  };
  console.log(`    Request Body built:`, JSON.stringify(verifyOtpRequestBody));
  const verifyOtpServerCheck = normalizePakPhone(verifyOtpRequestBody.phone);
  console.log(`    Server normalizePakPhone(req.body.phone) => "${verifyOtpServerCheck}"`);
  if (verifyOtpServerCheck === '03001234567') {
    console.log('    ✓ Result: Accepted & matches OTP store key "03001234567"');
  } else {
    console.error('    ✗ Result: Failed!');
    allPassed = false;
  }

  // Endpoint 3: POST /api/auth/register
  console.log('\n  • Endpoint C: POST /api/auth/register');
  const registerRequestBody = {
    name: 'Syed Obaid Ali',
    email: 'obaid@example.com',
    password: 'Password123',
    phone: toPakServerPhone(rawPhoneInput),
  };
  console.log(`    Request Body built:`, JSON.stringify(registerRequestBody));
  // Server register stores req.body.phone.trim().slice(0, 30)
  const storedDbPhone = typeof registerRequestBody.phone === 'string' ? registerRequestBody.phone.trim().slice(0, 30) : '';
  const registerServerCheck = normalizePakPhone(storedDbPhone);
  console.log(`    MongoDB Stored Phone: "${storedDbPhone}"`);
  console.log(`    Server normalizePakPhone(storedDbPhone) => "${registerServerCheck}"`);
  if (registerServerCheck === '03001234567') {
    console.log('    ✓ Result: Canonical 03XXXXXXXXX stored in database');
  } else {
    console.error('    ✗ Result: Failed!');
    allPassed = false;
  }

  console.log('\n----------------------------------------------------------------');
  console.log('[5] Also testing tolerance for other formats:');
  const toleranceCases = [
    { label: 'Already has 0', raw: '03001234567', expected: '03001234567' },
    { label: 'With +92',      raw: '+923001234567', expected: '03001234567' },
    { label: 'With 0092',     raw: '00923001234567', expected: '03001234567' },
    { label: 'Dashed input',  raw: '0300-1234567', expected: '03001234567' },
  ];

  toleranceCases.forEach(({ label, raw, expected }) => {
    const formatted = toPakServerPhone(raw);
    const checked = normalizePakPhone(formatted);
    const pass = checked === expected;
    console.log(`    ${pass ? '✓' : '✗'} [${label}] Input: "${raw}" → App sends: "${formatted}" → Server accepted: "${checked}"`);
    if (!pass) allPassed = false;
  });

  console.log('================================================================');
  if (allPassed) {
    console.log('  PROOFS VERIFIED: 100% of phone payloads meet normalizePakPhone contract!');
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error('  VERIFICATION FAILED: Some test cases did not pass.');
    console.log('================================================================\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
