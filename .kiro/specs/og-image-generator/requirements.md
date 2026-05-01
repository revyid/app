# Requirements: OG Image Generator

## Overview

Generate a static 1200×630px Open Graph image for Revy's portfolio website (`https://revy.my.id`). The image is produced from a self-contained HTML file rendered by a Node.js screenshot script, and the resulting PNG is served as a static asset.

---

## Requirements

### 1. HTML Source File

#### 1.1 Self-Contained HTML
The system MUST provide a self-contained HTML file at `public/og-image.html` that renders the OG image layout at exactly 1200×630px without requiring any JavaScript execution.

**Acceptance Criteria**:
- `public/og-image.html` exists and is valid HTML5
- The file has no runtime JavaScript dependencies
- Opening the file in a browser at 1200×630 viewport renders the complete OG image layout
- The only external resource is a Google Fonts CSS link (with a system font fallback)

#### 1.2 Material You Design Language
The HTML file MUST implement the Material You (M3) light color scheme and typography scale.

**Acceptance Criteria**:
- Background color is `#FFFBFE` (M3 surface)
- Card background is `#F3EDF7` (M3 surface-container)
- Card has `border-radius: 28px` (M3 extra-large shape token)
- Card has M3 elevation-2 box-shadow
- Primary color `#6750A4` is used for the URL text and name gradient accent
- Skill chips use `#EADDFF` background and `#21005D` text (M3 primary-container scheme)
- Location chip uses `#E8DEF8` background and `#1D192B` text (M3 secondary-container scheme)

#### 1.3 Decorative Background Blobs
The HTML file MUST include three decorative radial-gradient blobs positioned in the background.

**Acceptance Criteria**:
- Blob 1: top-right, `#EADDFF`-based radial gradient, ~420×420px, `opacity: 0.75`
- Blob 2: bottom-left, `#E8DEF8`-based radial gradient, ~360×360px, `opacity: 0.65`
- Blob 3: center-right, `#D0BCFF`-based radial gradient, ~260×260px, `opacity: 0.4`
- All blobs use `filter: blur(60px)` for soft edges
- Blobs do not overlap or obscure card content

#### 1.4 Name Display
The HTML file MUST display the name "Revy" in Display Large typography.

**Acceptance Criteria**:
- Text content is exactly `Revy`
- Font size is `76px`
- Font weight is `400`
- Uses a gradient from `#1C1B1F` to `#6750A4` via CSS `background-clip: text`
- Letter spacing is `-1.5px`

#### 1.5 Job Title
The HTML file MUST display the job title in Headline Medium typography.

**Acceptance Criteria**:
- Text content is exactly `Full-Stack Software Engineer`
- Font size is `28px`
- Font weight is `400`
- Color is `#49454F` (M3 on-surface-variant)

#### 1.6 Location Chip
The HTML file MUST display a pill-shaped M3 Assist Chip for the location.

**Acceptance Criteria**:
- Text content is `📍 Jambi, Indonesia`
- `border-radius: 9999px` (pill shape)
- Background `#E8DEF8`, text color `#1D192B`, border `1px solid #CAC4D0`
- Font size `14px`, font weight `500`

#### 1.7 Skill Chips
The HTML file MUST display all nine skills as M3 Suggestion Chips.

**Acceptance Criteria**:
- All nine skills are present: `JavaScript`, `React`, `Python`, `Git`, `CI/CD`, `Node.js`, `Docker`, `MongoDB`, `TypeScript`
- Each chip has `border-radius: 9999px`, background `#EADDFF`, text `#21005D`, border `1px solid #D0BCFF`
- Font size `13px`, font weight `500`
- Chips wrap to a second row if needed

#### 1.8 URL Footer
The HTML file MUST display the website URL at the bottom of the card.

**Acceptance Criteria**:
- Text content is exactly `revy.my.id`
- Color is `#6750A4` (M3 primary)
- Font size `16px`, font weight `500`
- Positioned at the bottom of the card (pushed down via flex layout)

#### 1.9 Font Loading
The HTML file MUST load Google Sans from Google Fonts CDN with a system font fallback.

**Acceptance Criteria**:
- `<link>` tag for Google Fonts is present in `<head>` with `Google+Sans` family
- Font stack fallback: `'Google Sans', 'Inter', system-ui, sans-serif`
- If CDN is unavailable, layout remains intact using fallback fonts

---

### 2. Screenshot Script

#### 2.1 Script Existence
The system MUST provide a Node.js script at `scripts/generate-og.js` that screenshots the HTML file to PNG.

**Acceptance Criteria**:
- `scripts/generate-og.js` exists and is valid ES module JavaScript
- Running `node scripts/generate-og.js` completes without error when Playwright is installed
- The script prints a success message with the output path on completion

#### 2.2 Output Dimensions
The screenshot script MUST produce a PNG at exactly 1200×630px.

**Acceptance Criteria**:
- Output file `public/og-image.png` has width = 1200px and height = 630px
- Viewport is set to `{ width: 1200, height: 630 }` before screenshot
- Screenshot clip is `{ x: 0, y: 0, width: 1200, height: 630 }`

#### 2.3 Output Path
The script MUST write the PNG to `public/og-image.png`.

**Acceptance Criteria**:
- Output file is created at `public/og-image.png` relative to project root
- Any existing file at that path is overwritten
- The output directory is created if it does not exist

#### 2.4 Font Rendering
The script MUST wait for fonts to load before taking the screenshot.

**Acceptance Criteria**:
- `page.goto()` uses `waitUntil: 'networkidle'` to ensure Google Fonts CSS is loaded
- Screenshot is taken only after the page is fully rendered

#### 2.5 Playwright Dependency
The script MUST use Playwright (or Puppeteer) as a dev dependency.

**Acceptance Criteria**:
- `playwright` is listed in `devDependencies` in `package.json`
- A `generate:og` npm script is added to `package.json`: `"generate:og": "node scripts/generate-og.js"`

---

### 3. Static Asset Integration

#### 3.1 OG Meta Tag Compatibility
The generated PNG MUST be compatible with the existing OG meta tags in `index.html`.

**Acceptance Criteria**:
- `public/og-image.png` is accessible at the path referenced by `<meta property="og:image" content="https://revy.my.id/og-image.png" />`
- Image dimensions match the declared `og:image:width` (1200) and `og:image:height` (630) meta tags
- The file is a valid PNG

#### 3.2 No Runtime Changes Required
The feature MUST NOT require any changes to the React application source code or Vite build configuration.

**Acceptance Criteria**:
- No changes to `src/` files
- No changes to `vite.config.ts`
- No changes to `index.html` (OG meta tags already reference the correct path)
- The PNG is a static file served directly from `public/`
