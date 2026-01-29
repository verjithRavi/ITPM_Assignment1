// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'https://tamil.changathi.com/',
    headless: true
  }
});
