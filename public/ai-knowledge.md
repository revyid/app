# Revy Platform — Complete Knowledge Base

## About Revy
Revy is a full-stack developer platform at revy.my.id offering:
- GitHub API proxy
- URL shortening with analytics
- Interactive code sandbox
- Portfolio website

**Contact:** revy8k@gmail.com | github.com/revyid | instagram.com/revy.id | linkedin.com/in/revyid

---

## Pages

### Home (/)
Portfolio homepage showing: profile, skills, projects, experience, education, testimonials. Global chat feature in bottom-right corner. Floating navbar with theme switcher. Material You 3 design system.

### Dashboard (/dashboard)
User dashboard for managing API keys and short URLs. Shows stats (total URLs, total clicks). Requires sign-in. Separate app at dashboard.revy.my.id.

### API Keys (/dashboard/api-keys)
- Create, view, delete API keys
- Keys have optional expiry: 30 days, 90 days, 6 months, 1 year, or unlimited
- Rate limit: 100 requests per minute per key
- Keys stored as salted hashes (we cannot recover your key)

### URL Shortener (/dashboard/shorten)
- Create short URLs with custom slugs
- View click analytics per URL
- Slug rules: 3-16 characters, lowercase alphanumeric + hyphens only

---

## Documentation

### Guide (/docs/guide)

**Getting Started:**
1. Sign in at revy.my.id
2. Go to Dashboard → API Keys
3. Click "Create Key" and give it a name
4. Copy the key — it won't be shown again
5. Use the key in the `x-api-key` header for all API requests

**Authentication:**
All API requests require an API key passed via the `x-api-key` header.

**Example:**
```bash
curl -s -H "x-api-key: rv_your_key_here" \
  "https://revy.my.id/api/github?path=users/revyid"
```

**Rate Limits:**
Each API key has a rate limit (default: 100 requests/minute). Exceeding returns 429 status.

---

### API Reference (/docs/api-reference)

**Base URL:** https://revy.my.id

APIs available:
1. GitHub API (REST, requires API Key)
2. URL Shortener (REST, requires API Key)
3. Code Sandbox (Interactive, in-browser)

---

### GitHub API (/docs/api-reference/github)

Proxy endpoint for GitHub data — profiles, repositories, and activity.

**Base:** https://revy.my.id/api/github
**Key:** Dashboard → API Keys

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/github?path=users/{username} | User profile |
| GET | /api/github?path=users/{username}/repos | User repositories |
| GET | /api/github?path=users/{username}/events | User activity |
| GET | /api/github?path=repos/{owner}/{repo} | Repository details |

**Quick Start:**
```bash
curl -H "x-api-key: rv_your_key" \
  "https://revy.my.id/api/github?path=users/torvalds"
```

**Response fields (user profile):**
- login: string (username)
- name: string (display name)
- bio: string (biography)
- public_repos: number
- followers: number
- created_at: string (ISO 8601 date)

**Response fields (repositories):**
- name: string (repo name)
- full_name: string (owner/name)
- stargazers_count: number
- language: string (primary language)
- updated_at: string (ISO 8601 date)

**Errors:**
| Status | Cause |
|--------|-------|
| 400 | Missing or invalid ?path= parameter |
| 401 | Missing or invalid API key |
| 403 | Path not allowed (only users/*, repos/*) |
| 429 | Rate limit exceeded (100/min per key) |

**Rate Limits:** 100 requests per minute per API key. Responses cached for 5 minutes.

---

### URL Shortener API (/docs/api-reference/shorten)

Create short links, track clicks, and manage your URLs.

**Base:** https://revy.my.id/api/shorten
**Redirects:** https://revy.my.id/s/{slug}

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/shorten | Create short URL |
| GET | /api/shorten?slug={slug} | Get click stats |
| GET | /s/{slug} | Redirect (302) |
| DELETE | /api/shorten?slug={slug} | Delete short URL |

**Create Short URL:**
```bash
curl -X POST https://revy.my.id/api/shorten \
  -H "x-api-key: rv_your_key" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/revyid/app","slug":"my-app"}'
```

**Response:**
```json
{
  "id": "uuid",
  "slug": "my-app",
  "short_url": "https://revy.my.id/s/my-app",
  "original_url": "https://github.com/revyid/app",
  "created_at": "2026-07-04T12:00:00Z"
}
```

**Slug Rules:**
- 3-16 characters, lowercase alphanumeric + hyphens only
- If omitted, a random 7-character slug is auto-generated
- Slugs are unique — duplicate slugs return an error

---

### Code Sandbox (/docs/sandbox)
Interactive code sandbox supporting:
- JavaScript
- Python
- TypeScript
- cURL commands

All with real HTTP support, runs in-browser.

---

### curl-ts (/docs/curl-ts)
cURL parser for TypeScript. Parse and execute curl commands in browser and Node.js.

---

## Privacy Policy (/privacy)

**Last updated:** July 2026

### Information We Collect
- Account data: email, display name, avatar URL, authentication provider
- Usage data: API call counts, request metadata (user agent, IP), timestamps
- Short URL data: original URLs, slugs, click counts
- We do NOT collect: payment information, government IDs, or biometric data

### How We Use Your Information
- Authenticate your sessions and API requests
- Track API usage for rate limiting
- Monitor service performance and reliability
- Display your profile information in the dashboard
- We do NOT sell, rent, or share your personal data with third parties for advertising

### Data Storage & Security
- All data stored in Supabase (PostgreSQL) with row-level security
- API keys stored as salted hashes — we cannot recover your key
- Sessions expire after 30 days of inactivity
- Data transmitted over TLS/HTTPS encryption
- Industry-standard security practices

### Data Retention
- Account data: retained while account is active
- API keys: retained until deleted or expired
- Short URLs: retained until deleted
- Session data: expires after 30 days
- Usage logs: retained for 90 days for analytics

### Your Rights
- Access all data we hold about you
- Delete your account and all associated data
- Export your data in a portable format
- Opt out of non-essential data collection

---

## Terms of Service (/terms)

**Last updated:** July 2026

### Description of Service
Revy provides:
- GitHub API proxy for accessing public GitHub data
- URL shortening and click tracking
- Interactive code sandbox (JavaScript, Python, TypeScript, cURL)
- Dashboard for managing API keys and short URLs

### User Responsibilities
You agree to:
- Use the service only for lawful purposes
- Not attempt to abuse, overload, or disrupt the service
- Not share your API keys with unauthorized parties
- Not use the service to circumvent rate limits or access controls
- Keep your account credentials secure

### Prohibited Uses
You must NOT use Revy to:
- Send spam, phishing, or malicious content
- Create short URLs that lead to harmful or illegal content
- Attempt to gain unauthorized access to other users' data
- Reverse engineer or exploit the service
- Violate any applicable laws or regulations

### API Usage & Rate Limits
- Each API key has a rate limit (default: 100 requests/hour)
- Exceeding the limit returns a 429 status code
- Abusive usage may result in permanent key revocation
- Automated scraping or bulk downloading is prohibited

### Limitation of Liability
- Revy is provided "as is" without warranties
- Not liable for any indirect, incidental, or consequential damages
- Total liability shall not exceed the amount paid for the service (currently free)
- No guarantee of uptime, availability, or data accuracy

---

## Tech Stack
- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
- Backend: Next.js API Routes (Edge Runtime)
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth (GitHub, Google, Passkeys)
- Deployment: Vercel
- Design: Material You 3 color system

---

## Social Links
- GitHub: github.com/revyid
- Instagram: instagram.com/revy.id
- LinkedIn: linkedin.com/in/revyid
- Email: revy8k@gmail.com
- Website: revy.my.id
