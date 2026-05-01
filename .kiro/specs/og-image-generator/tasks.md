# Tasks: OG Image Generator

## Task List

- [x] 1. Create the HTML source file
  - [x] 1.1 Create `public/og-image.html` with the 1200×630 canvas, M3 color tokens, and CSS reset
  - [x] 1.2 Add three decorative background blobs (radial gradients, blur, positioned absolutely)
  - [x] 1.3 Add the main card element (surface-container background, 28px border-radius, elevation-2 shadow, flex column layout)
  - [x] 1.4 Add the name "Revy" in Display Large typography with gradient text effect
  - [x] 1.5 Add the job title "Full-Stack Software Engineer" in Headline Medium typography
  - [x] 1.6 Add the location chip "📍 Jambi, Indonesia" as a pill-shaped M3 Assist Chip
  - [x] 1.7 Add all nine skill chips as M3 Suggestion Chips in a wrapping flex row
  - [x] 1.8 Add the URL footer "revy.my.id" in M3 primary color at the bottom of the card
  - [x] 1.9 Add Google Fonts link for Google Sans with system font fallback stack

- [x] 2. Create the screenshot script
  - [x] 2.1 Create `scripts/generate-og.js` as an ES module using Playwright
  - [x] 2.2 Set viewport to 1200×630 and navigate to the HTML file using `file://` protocol
  - [x] 2.3 Wait for `networkidle` to ensure fonts are loaded before screenshotting
  - [x] 2.4 Write screenshot to `public/og-image.png` with exact 1200×630 clip
  - [x] 2.5 Add `generate:og` script to `package.json` and add `playwright` to devDependencies

- [x] 3. Verify static asset integration
  - [x] 3.1 Run `node scripts/generate-og.js` and confirm `public/og-image.png` is created at 1200×630px
  - [x] 3.2 Open `public/og-image.html` in a browser and visually verify the layout matches the design spec
  - [x] 3.3 Confirm no changes were made to `src/`, `vite.config.ts`, or `index.html`
