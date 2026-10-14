import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfig([
  globalIgnores(['**/dist/**', '**/node_modules/**']),
  {
    files: ['**/*.{vue,js,mjs,jsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['server/**/*.js', 'scripts/**/*.js', 'vite.config.js'],
    languageOptions: { globals: globals.node },
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
  skipFormatting,
])
