import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['apps/worker/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.config.{js,ts}', '**/*.config.*.{js,ts}'],
    languageOptions: {
      globals: globals.node,
    },
    ...tseslint.configs.disableTypeChecked,
  },
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**', '**/.vite/**', '**/coverage/**'],
  },
)
