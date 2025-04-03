import { defineConfig } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';

export default defineConfig([
  {
    ignores: [
      'node_modules/', 
      'dist/',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest', 
      sourceType: 'module', 
      globals: {
        ...globals.node,
        ...globals.es2021, 
      },
    },
    rules: {
      'no-undef': 'error', 
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
]);
