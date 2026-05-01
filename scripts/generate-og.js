// scripts/generate-og.js
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT  = path.resolve(__dirname, '../public/og-image.html');
const OUTPUT = path.resolve(__dirname, '../public/og-image.png');

// Ensure output directory exists
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

const browser = await chromium.launch();
const page    = await browser.newPage();

await page.setViewportSize({ width: 1200, height: 630 });
await page.goto(`file://${INPUT}`, { waitUntil: 'networkidle' });

await page.screenshot({
  path: OUTPUT,
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});

await browser.close();
console.log(`✅  OG image written to ${OUTPUT}`);
