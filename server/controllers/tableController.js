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
 * Parses table QR code payload from URL, JSON, or table number string
 */
function parseTableQRPayload(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  // Format 1: aura://table?branch=lhr_gulberg&table=4
  if (trimmed.startsWith('aura://')) {
    try {
      const parsedUrl = new URL(trimmed.replace('aura://', 'http://aura.local/'));
      const branch = parsedUrl.searchParams.get('branch') || 'lhr_gulberg';
      const table = parsedUrl.searchParams.get('table');
      if (table) return { branchId: branch, tableNumber: table };
    } catch {
      // ignore URL parse failure
    }
  }

  // Format 2: JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.tableNumber || parsed.table) {
        return {
          branchId: parsed.branchId || parsed.branch || 'lhr_gulberg',
          tableNumber: String(parsed.tableNumber || parsed.table),
        };
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
      deepLink: `aura://table?branch=${branch.branchId}&table=${tableNumStr}`,
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

    const standees = (dbTables && dbTables.length > 0 ? dbTables : Array.from({ length: 12 }, (_, i) => ({
      tableNumber: String(i + 1),
      name: `Table ${i + 1}`,
      seats: (i + 1) % 3 === 0 ? 6 : (i + 1) % 2 === 0 ? 4 : 2,
      location: i < 4 ? 'Window View' : i > 8 ? 'Executive Terrace' : 'Main Dining Hall',
    }))).map((t) => ({
      tableNumber: String(t.tableNumber),
      tableName: t.name || `Table ${t.tableNumber}`,
      seats: t.seats || 4,
      location: t.location || 'Main Dining Hall',
      branch,
      deepLink: `aura://table?branch=${branch.branchId}&table=${t.tableNumber}`,
      instructions: 'Scan with your smartphone camera to browse menu, order, and pay.',
    }));

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
};
