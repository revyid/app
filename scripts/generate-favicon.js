// scripts/generate-favicon.js
// Run: node scripts/generate-favicon.js
// Generates: favicon.svg, favicon-32x32.png, favicon-16x16.png, apple-touch-icon.png (180x180)

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT  = path.resolve(__dirname, '../public/favicon-source.html');
const PUBLIC = path.resolve(__dirname, '../public');

fs.mkdirSync(PUBLIC, { recursive: true });

const browser = await chromium.launch();

// Generate PNG at each required size
const sizes = [
  { name: 'favicon-32x32.png',    size: 32  },
  { name: 'favicon-16x16.png',    size: 16  },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-512.png',      size: 512 }, // source for SVG trace
];

for (const { name, size } of sizes) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 512, height: 512 });
  await page.goto(`file://${INPUT}`, { waitUntil: 'networkidle' });

  // Scale the icon element to target size
  await page.evaluate((s) => {
    document.body.style.transform = `scale(${s / 512})`;
    document.body.style.transformOrigin = 'top left';
    document.body.style.width = '512px';
    document.body.style.height = '512px';
  }, size);

  await page.screenshot({
    path: path.join(PUBLIC, name),
    clip: { x: 0, y: 0, width: size, height: size },
    omitBackground: true,
  });

  await page.close();
  console.log(`✅  ${name} (${size}×${size})`);
}

await browser.close();

// Generate favicon.svg — inline SVG with M3 gradient curly braces { R }
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7965AF"/>
      <stop offset="50%" stop-color="#6750A4"/>
      <stop offset="100%" stop-color="#4F378B"/>
    </linearGradient>
    <linearGradient id="shine" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.15)"/>
      <stop offset="60%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="115" ry="115" fill="url(#bg)"/>
  <rect width="512" height="512" rx="115" ry="115" fill="url(#shine)"/>
  <text
    x="256"
    y="340"
    font-family="'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
    font-size="220"
    font-weight="500"
    fill="#FFFFFF"
    fill-opacity="0.96"
    text-anchor="middle"
    letter-spacing="2"
  >{ R }</text>
  <rect width="512" height="512" rx="115" ry="115" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
</svg>`;

fs.writeFileSync(path.join(PUBLIC, 'favicon.svg'), svg, 'utf8');
console.log('✅  favicon.svg');

console.log('\n🎉  All favicon assets generated in public/');
