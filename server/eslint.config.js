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
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-constant-condition': 'warn',
    },
  },
];
