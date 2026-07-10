# Revy Platform — Knowledge Base

## About
Revy is a full-stack developer platform at revy.my.id by revyid.
Contact: revy8k@gmail.com | github.com/revyid | instagram.com/revy.id | linkedin.com/in/revyid

## Pages

### Home (/)
Portfolio homepage. Shows profile, skills, projects, experience, education, testimonials.

### Dashboard (/dashboard)
User dashboard for managing API keys and short URLs. Requires sign-in.

### API Keys (/dashboard/api-keys)
Create, view, delete API keys. Keys have optional expiry (30d, 90d, 6mo, 1yr, unlimited). Rate limit: 100 requests/min per key.

### URL Shortener Dashboard (/dashboard/shorten)
Create short URLs with custom slugs, view click analytics.

### Documentation Hub (/docs)
Links to all documentation and tools.

### Guide (/docs/guide)
Getting started: Sign in → Dashboard → API Keys → Create Key → Use x-api-key header.
Authentication: All requests need x-api-key header.
GitHub API: GET /api/github?path=users/{username}
URL Shortener: POST /api/shorten
Rate Limits: 100 requests/min per key, 429 on exceed.

### API Reference (/docs/api-reference)
Base URL: https://revy.my.id
APIs: GitHub API (REST, API Key), URL Shortener (REST), Code Sandbox (Interactive)

### GitHub API (/docs/api-reference/github)
Proxy for GitHub profiles, repos, activity.
Endpoints:
- GET /api/github?path=users/{username} — User profile
- GET /api/github?path=users/{username}/repos — User repos
- GET /api/github?path=users/{username}/events — User activity
- GET /api/github?path=repos/{owner}/{repo} — Repo details
Auth: x-api-key header required. Rate: 100/min, cached 5min.

### URL Shortener API (/docs/api-reference/shorten)
Create short links, track clicks.
Endpoints:
- POST /api/shorten — Create (body: {url, slug?})
- GET /api/shorten?slug={slug} — Get stats
- GET /s/{slug} — Redirect (302)
- DELETE /api/shorten?slug={slug} — Delete
Slug rules: 3-16 chars, lowercase + hyphens, unique.

### Code Sandbox (/docs/sandbox)
Run JavaScript, Python, TypeScript, cURL in-browser with real HTTP support.

### curl-ts (/docs/curl-ts)
Parse and execute curl commands in TypeScript.

### Privacy Policy (/privacy)
Collects: account data, usage data, short URLs. No payment/biometrics. Data in Supabase with RLS. API keys salted hash.

### Terms of Service (/terms)
No spam, no abuse, no reverse engineering. Rate: 100/hr. Contact: revy8k@gmail.com

## Features
- GitHub API Proxy — access GitHub data via REST
- URL Shortener — create short links with analytics
- Code Sandbox — run code in-browser
- curl-ts — curl parser for TypeScript
- Dashboard — manage API keys and URLs

## Tech Stack
Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase (PostgreSQL), Vercel

## Auth
Supabase Auth with GitHub, Google, Passkeys. Dashboard at dashboard.revy.my.id.

## Social
GitHub: revyid | Instagram: revy.id | LinkedIn: revyid | Email: revy8k@gmail.com

## Easter Eggs
- Ctrl+Alt+L di homepage → liat surprise Nawa ❤️
- Nawa adalah bintang spesial Revy 💕
