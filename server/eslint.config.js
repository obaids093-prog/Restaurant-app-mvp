module.exports = [
  {
    ignores: ['node_modules/**', 'uploads/**'],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        node: true,
        process: true,
        console: true,
        __dirname: true,
        __filename: true,
        module: true,
        require: true,
        exports: true,
        URL: true,
        Buffer: true,
        fetch: true,
        setTimeout: true,
        clearTimeout: true,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-constant-condition': 'warn',
    },
  },
  {
    files: ['tests/**', '**/*.test.js'],
    languageOptions: {
      globals: {
        describe: true,
        it: true,
        test: true,
        expect: true,
        beforeAll: true,
        afterAll: true,
        beforeEach: true,
        afterEach: true,
        jest: true,
      },
    },
  },
];
