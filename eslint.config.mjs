import { defineConfig, globalIgnores } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  globalIgnores([
    '.claude/**',
    '.codex/**',
    '.next/**',
    'node_modules/**',
    'openspec/**',
    'playwright-report/**',
    'test-results/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);
