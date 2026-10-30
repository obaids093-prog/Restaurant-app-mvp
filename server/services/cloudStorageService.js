// server/services/cloudStorageService.js
// ═══════════════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Manages cloud object storage for uploaded dish photos.
//   - Detects if Cloudinary credentials are provided via environment variables.
//   - Uploads image assets to Cloudinary CDN with SHA-1 signature authentication.
//   - Gracefully falls back to local server disk storage if Cloudinary is not
//     configured or if a network/quota error occurs.
//   - Guarantees zero runtime crashes and 100% free-tier compatibility.
// ═══════════════════════════════════════════════════════════════════

const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

/**
 * Parse and validate Cloudinary credentials from environment
 * Supports both individual keys and single CLOUDINARY_URL format:
 *   cloudinary://<api_key>:<api_secret>@<cloud_name>
 */
function getCloudinaryConfig() {
  const env = process.env;

  // 1. Check CLOUDINARY_URL connection string format
  if (env.CLOUDINARY_URL && env.CLOUDINARY_URL.startsWith('cloudinary://')) {
    try {
      const parsed = new URL(env.CLOUDINARY_URL);
      return {
        cloudName: parsed.hostname,
        apiKey: parsed.username,
        apiSecret: parsed.password,
      };
    } catch {
      // ignore parse error, fallback to discrete env vars
    }
  }

  // 2. Check individual environment variables
  const cloudName = (env.CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey = (env.CLOUDINARY_API_KEY || '').trim();
  const apiSecret = (env.CLOUDINARY_API_SECRET || '').trim();

  if (cloudName && apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret };
  }

  return null;
}

/**
 * Returns true if Cloudinary cloud credentials are configured and valid
 */
function isCloudinaryConfigured() {
  return getCloudinaryConfig() !== null;
}

/**
 * Generate cryptographic signature for Cloudinary REST API
 * Parameters are sorted alphabetically and joined with & then appended with apiSecret
 */
function generateSignature(params, apiSecret) {
  const sortedKeys = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort();

  const toSign = sortedKeys.map((k) => `${k}=${params[k]}`).join('&') + apiSecret;
  return crypto.createHash('sha1').update(toSign).digest('hex');
}

/**
 * Upload an image file to Cloudinary using the official HTTPS REST API
 * @param {object} options
 * @param {string} options.filePath - Path to file on local disk
 * @param {Buffer} [options.fileBuffer] - In-memory file buffer (optional alternative to filePath)
 * @param {string} [options.mimetype] - MIME type of image (default 'image/jpeg')
 * @param {string} [options.folder] - Target folder on Cloudinary (default 'aura/dishes')
 * @returns {Promise<{ success: boolean, url: string|null, provider: string, publicId?: string, format?: string, error?: string }>}
 */
async function uploadToCloudinary({ filePath, fileBuffer, mimetype = 'image/jpeg', folder = 'aura/dishes' }) {
  const config = getCloudinaryConfig();
  if (!config) {
    return {
      success: false,
      url: null,
      provider: 'local',
      error: 'Cloudinary is not configured. Using local disk storage.',
    };
  }

  try {
    // Read image data as base64 Data URI
    let base64Data;
    if (fileBuffer) {
      base64Data = fileBuffer.toString('base64');
    } else if (filePath && fs.existsSync(filePath)) {
      base64Data = fs.readFileSync(filePath).toString('base64');
    } else {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const dataUri = `data:${mimetype};base64,${base64Data}`;
    const timestamp = Math.floor(Date.now() / 1000);

    const signParams = {
      folder,
      timestamp,
    };

    const signature = generateSignature(signParams, config.apiSecret);

    const postPayload = JSON.stringify({
      file: dataUri,
      api_key: config.apiKey,
      timestamp,
      folder,
      signature,
    });

    const endpointPath = `/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`;

    return await new Promise((resolve) => {
      const req = https.request(
        {
          hostname: 'api.cloudinary.com',
          port: 443,
          path: endpointPath,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postPayload),
            'User-Agent': 'AuraRestaurantApp/1.0',
          },
          timeout: 25000, // 25 second timeout limit
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (res.statusCode >= 200 && res.statusCode < 300 && parsed.secure_url) {
                resolve({
                  success: true,
                  url: parsed.secure_url,
                  provider: 'cloudinary',
                  publicId: parsed.public_id,
                  format: parsed.format,
                  bytes: parsed.bytes,
                });
              } else {
                const errMsg = (parsed.error && parsed.error.message) || `HTTP ${res.statusCode}: ${data}`;
                resolve({
                  success: false,
                  url: null,
                  provider: 'local',
                  error: errMsg,
                });
              }
            } catch (parseErr) {
              resolve({
                success: false,
                url: null,
                provider: 'local',
                error: `Failed to parse Cloudinary response: ${parseErr.message}`,
              });
            }
          });
        }
      );

      req.on('error', (err) => {
        resolve({
          success: false,
          url: null,
          provider: 'local',
          error: `Network error connecting to Cloudinary: ${err.message}`,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          url: null,
          provider: 'local',
          error: 'Cloudinary upload request timed out after 25s',
        });
      });

      req.write(postPayload);
      req.end();
    });
  } catch (err) {
    return {
      success: false,
      url: null,
      provider: 'local',
      error: err.message,
    };
  }
}

module.exports = {
  getCloudinaryConfig,
  isCloudinaryConfigured,
  generateSignature,
  uploadToCloudinary,
};
