const crypto = require('crypto');
const mongoose = require('mongoose');
const Table = require('../models/Table');

const BRANCH_MAP = {
  lhr_gulberg: {
    branchId: 'lhr_gulberg',
    branchName: 'AURA • Gulberg III, Lahore',
    branchCity: 'Lahore',
  },
  isb_blue_area: {
    branchId: 'isb_blue_area',
    branchName: 'AURA • Blue Area, Islamabad',
    branchCity: 'Islamabad',
  },
};

/**
 * Retrieves secret key for HMAC table QR signing.
 * Refuses execution in production if TABLE_QR_SECRET is missing.
 */
function getTableQRSecret() {
  const secret = process.env.TABLE_QR_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: TABLE_QR_SECRET environment variable is missing in production.');
    }
    return process.env.JWT_SECRET || 'aura_qr_dev_secret_2026';
  }
  return secret;
}

/**
 * Validates TABLE_QR_SECRET is configured for production.
 */
function validateTableQRConfig() {
  if (process.env.NODE_ENV === 'production' && !process.env.TABLE_QR_SECRET) {
    console.error('FATAL: TABLE_QR_SECRET environment variable is required in production.');
    process.exit(1);
  }
}

/**
 * Generates HMAC-SHA256 signature for authenticating table QR codes.
 * Prevents diners or attackers from spoofing arbitrary table links.
 */
function signTableQR(branchId, tableNumber, exp = null) {
  const secret = getTableQRSecret();
  const data = exp ? `${branchId}:${tableNumber}:${exp}` : `${branchId}:${tableNumber}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex').slice(0, 16);
}

/**
 * Verifies whether a provided signature matches the branch and table number
 */
function verifyTableQRSignature(branchId, tableNumber, exp, sig) {
  if (!sig || typeof sig !== 'string') return false;
  if (exp) {
    const expNum = Number(exp);
    if (Number.isNaN(expNum) || Date.now() > expNum) {
      return false; // Expired
    }
  }
  const expectedWithExp = signTableQR(branchId, tableNumber, exp);
  const expectedWithoutExp = signTableQR(branchId, tableNumber);
  return sig === expectedWithExp || sig === expectedWithoutExp;
}

/**
 * Parses table QR code payload from URL, JSON, or table number string
 */
function parseTableQRPayload(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  // Format 1: aura://table?branch=lhr_gulberg&table=4&sig=...&exp=...
  if (trimmed.startsWith('aura://')) {
    try {
      const parsedUrl = new URL(trimmed.replace('aura://', 'http://aura.local/'));
      const branch = parsedUrl.searchParams.get('branch') || 'lhr_gulberg';
      const table = parsedUrl.searchParams.get('table');
      const sig = parsedUrl.searchParams.get('sig');
      const exp = parsedUrl.searchParams.get('exp');
      if (table) {
        const payload = { branchId: branch, tableNumber: table };
        if (sig) payload.sig = sig;
        if (exp) payload.exp = exp;
        return payload;
      }
    } catch {
      // ignore URL parse failure
    }
  }

  // Format 2: JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.tableNumber || parsed.table) {
        const payload = {
          branchId: parsed.branchId || parsed.branch || 'lhr_gulberg',
          tableNumber: String(parsed.tableNumber || parsed.table),
        };
        if (parsed.sig) payload.sig = parsed.sig;
        if (parsed.exp) payload.exp = parsed.exp;
        return payload;
      }
    } catch {
      // ignore JSON parse failure
    }
  }

  // Format 3: Raw table number "Table 4" or "4"
  const match = trimmed.match(/\b(?:table[-_\s]*)?(\d{1,3})\b/i);
  if (match) {
    return {
      branchId: 'lhr_gulberg',
      tableNumber: match[1],
    };
  }

  return null;
}

// @desc    Get all tables
// @route   GET /api/tables
// @access  Public
const getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ seats: 1 });
    res.status(200).json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ message: 'Server error fetching tables' });
  }
};

// @desc    Verify scanned table QR payload
// @route   POST /api/tables/verify-qr
// @access  Public
const verifyTableQR = async (req, res) => {
  try {
    const { code, branchId: reqBranchId, tableNumber: reqTableNumber } = req.body || {};

    let extracted = null;
    if (code) {
      extracted = parseTableQRPayload(code);
    } else if (reqTableNumber) {
      extracted = {
        branchId: reqBranchId || 'lhr_gulberg',
        tableNumber: String(reqTableNumber),
      };
    }

    if (!extracted || !extracted.tableNumber) {
      return res.status(400).json({
        valid: false,
        message: 'Invalid table QR payload. Please scan an authentic AURA table standee.',
      });
    }

    const branch = BRANCH_MAP[extracted.branchId] || BRANCH_MAP.lhr_gulberg;
    const tableNumStr = String(extracted.tableNumber);

    // If signature is provided, verify cryptographic authenticity & expiration (Safety Fix #4)
    let isSignatureValid = false;
    if (extracted.sig) {
      if (extracted.exp && Date.now() > Number(extracted.exp)) {
        return res.status(400).json({
          valid: false,
          message: 'Table QR code has expired. Please scan an active table standee.',
        });
      }
      isSignatureValid = verifyTableQRSignature(extracted.branchId, tableNumStr, extracted.exp, extracted.sig);
      if (!isSignatureValid) {
        return res.status(400).json({
          valid: false,
          message: 'Invalid table QR signature. Please scan an authentic AURA table standee.',
        });
      }
    }

    // Look for existing table record in DB if connected
    let dbTable = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        dbTable = await Table.findOne({
          $or: [{ tableNumber: tableNumStr }, { tableNumber: `T${tableNumStr}` }, { name: `Table ${tableNumStr}` }],
        }).lean();
      } catch {
        dbTable = null;
      }
    }

    const tableInfo = {
      valid: true,
      tableNumber: tableNumStr,
      tableName: dbTable?.name || `Table ${tableNumStr}`,
      seats: dbTable?.seats || (parseInt(tableNumStr, 10) % 2 === 0 ? 4 : 2),
      location: dbTable?.location || (parseInt(tableNumStr, 10) <= 4 ? 'Window View' : 'Main Dining Hall'),
      isWindow: dbTable?.isWindow || parseInt(tableNumStr, 10) <= 4,
      branch,
      verifiedSignature: isSignatureValid,
      isTamperProof: isSignatureValid,
      deepLink: extracted.sig
        ? `aura://table?branch=${branch.branchId}&table=${tableNumStr}&sig=${extracted.sig}`
        : `aura://table?branch=${branch.branchId}&table=${tableNumStr}`,
      scannedAt: new Date().toISOString(),
    };

    return res.status(200).json(tableInfo);
  } catch (error) {
    console.error('Error verifying table QR:', error);
    return res.status(500).json({ message: 'Internal server error verifying table QR.' });
  }
};

// @desc    Get printable table QR standee metadata for a branch
// @route   GET /api/tables/qr-standees
// @access  Public
const getTableStandees = async (req, res) => {
  try {
    const branchId = req.query.branchId || 'lhr_gulberg';
    const branch = BRANCH_MAP[branchId] || BRANCH_MAP.lhr_gulberg;

    let dbTables = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        dbTables = await Table.find().sort({ tableNumber: 1 }).lean();
      } catch {
        dbTables = [];
      }
    }

    const rawList = dbTables && dbTables.length > 0 ? dbTables : Array.from({ length: 12 }, (_, i) => ({
      tableNumber: String(i + 1),
      name: `Table ${i + 1}`,
      seats: (i + 1) % 3 === 0 ? 6 : (i + 1) % 2 === 0 ? 4 : 2,
      location: i < 4 ? 'Window View' : i > 8 ? 'Executive Terrace' : 'Main Dining Hall',
    }));

    const standees = rawList.map((t) => {
      const sig = signTableQR(branch.branchId, String(t.tableNumber));
      return {
        tableNumber: String(t.tableNumber),
        tableName: t.name || `Table ${t.tableNumber}`,
        seats: t.seats || 4,
        location: t.location || 'Main Dining Hall',
        branch,
        signature: sig,
        deepLink: `aura://table?branch=${branch.branchId}&table=${t.tableNumber}&sig=${sig}`,
        instructions: 'Scan with your smartphone camera to browse menu, order, and pay.',
      };
    });

    res.status(200).json({ branch, count: standees.length, standees });
  } catch (error) {
    console.error('Error fetching table standees:', error);
    res.status(500).json({ message: 'Server error generating table QR standees.' });
  }
};

module.exports = {
  getTables,
  verifyTableQR,
  getTableStandees,
  parseTableQRPayload,
  signTableQR,
  verifyTableQRSignature,
  validateTableQRConfig,
  getTableQRSecret,
};
