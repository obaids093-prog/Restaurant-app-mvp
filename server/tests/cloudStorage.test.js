const path = require('path');
const fs = require('fs');
const cloudStorageService = require('../services/cloudStorageService');
const { uploadImage } = require('../controllers/uploadController');

describe('Feature / Bug Fix #3: Cloud Object Storage for Uploaded Dish Photos', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CLOUDINARY_URL;
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Configuration & Detection', () => {
    it('returns false for isCloudinaryConfigured when env vars are missing', () => {
      expect(cloudStorageService.isCloudinaryConfigured()).toBe(false);
      expect(cloudStorageService.getCloudinaryConfig()).toBeNull();
    });

    it('returns true for isCloudinaryConfigured when discrete environment keys are set', () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'aura-test-cloud';
      process.env.CLOUDINARY_API_KEY = '1234567890';
      process.env.CLOUDINARY_API_SECRET = 'secret_abc_123';

      expect(cloudStorageService.isCloudinaryConfigured()).toBe(true);
      const config = cloudStorageService.getCloudinaryConfig();
      expect(config).toEqual({
        cloudName: 'aura-test-cloud',
        apiKey: '1234567890',
        apiSecret: 'secret_abc_123',
      });
    });

    it('parses and accepts CLOUDINARY_URL connection string format', () => {
      process.env.CLOUDINARY_URL = 'cloudinary://my_key:my_secret@my_cloud_demo';

      expect(cloudStorageService.isCloudinaryConfigured()).toBe(true);
      const config = cloudStorageService.getCloudinaryConfig();
      expect(config).toEqual({
        cloudName: 'my_cloud_demo',
        apiKey: 'my_key',
        apiSecret: 'my_secret',
      });
    });
  });

  describe('Cryptographic Signature Generation', () => {
    it('generates consistent, sorted SHA-1 signature for Cloudinary REST API', () => {
      const params = {
        folder: 'aura/dishes',
        timestamp: 1700000000,
      };
      const apiSecret = 'test_secret_key';

      // Alphabetical order: folder=aura/dishes&timestamp=1700000000test_secret_key
      const signature = cloudStorageService.generateSignature(params, apiSecret);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(40); // SHA-1 hex output length
    });
  });

  describe('Graceful Local Storage Fallback', () => {
    it('returns local provider and error message when uploadToCloudinary is called without config', async () => {
      const result = await cloudStorageService.uploadToCloudinary({
        filePath: 'nonexistent/dummy.jpg',
      });

      expect(result.success).toBe(false);
      expect(result.provider).toBe('local');
      expect(result.url).toBeNull();
      expect(result.error).toMatch(/Cloudinary is not configured/i);
    });

    it('handles missing file path gracefully without crashing', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'demo';
      process.env.CLOUDINARY_API_KEY = '123';
      process.env.CLOUDINARY_API_SECRET = 'abc';

      const result = await cloudStorageService.uploadToCloudinary({
        filePath: 'path/to/missing_dish.jpg',
      });

      expect(result.success).toBe(false);
      expect(result.provider).toBe('local');
      expect(result.error).toMatch(/File not found/i);
    });

    it('uploadImage controller returns local URL with storageProvider="local" when Cloudinary is unconfigured', async () => {
      const req = {
        protocol: 'https',
        get: () => 'aura-app-49n0.onrender.com',
        file: {
          filename: 'dish_test_123.jpg',
          size: 154320,
          mimetype: 'image/jpeg',
          path: '/tmp/dish_test_123.jpg',
        },
      };

      let statusCode = null;
      let jsonBody = null;

      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(body) {
          jsonBody = body;
          return this;
        },
      };

      await uploadImage(req, res);

      expect(statusCode).toBe(201);
      expect(jsonBody.imageUrl).toBe('https://aura-app-49n0.onrender.com/uploads/dish_test_123.jpg');
      expect(jsonBody.storageProvider).toBe('local');
      expect(jsonBody.filename).toBe('dish_test_123.jpg');
    });

    it('rejects upload with 400 if no image file was provided in request', async () => {
      const req = { file: null };
      let statusCode = null;
      let jsonBody = null;

      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(body) {
          jsonBody = body;
          return this;
        },
      };

      await uploadImage(req, res);

      expect(statusCode).toBe(400);
      expect(jsonBody.message).toMatch(/No image file provided/i);
    });
  });

  describe('Client Image URL Optimization', () => {
    const imageUrlPath = path.resolve(__dirname, '../../src/utils/imageUrl.js');

    it('imageUrl.js injects Cloudinary auto-format and auto-quality mobile optimizations', () => {
      const code = fs.readFileSync(imageUrlPath, 'utf8');
      expect(code).toContain('res.cloudinary.com');
      expect(code).toContain('/image/upload/f_auto,q_auto,w_800/');
    });
  });
});
