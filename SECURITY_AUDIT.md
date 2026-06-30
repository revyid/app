# Security Audit — Revy Portfolio

## CRITICAL
1. **GitHub secrets in .env** — `GITHUB_CLIENT_SECRET` + `GITHUB_TOKEN` live di .env. Pastikan gak pernah ke-commit. Rotate segera kalau repo pernah public.

## HIGH
2. **Session token di localStorage** — Vulnerable XSS → full account takeover. Fix: pake HttpOnly cookie.

## MEDIUM-HIGH
3. **chat_messages INSERT policy** — `WITH CHECK (true)` → siapa aja bisa insert pakai user_id siapa aja (impersonation).
4. **deleteTheme bypasses admin check** — Direct Supabase delete tanpa admin verification.

## MEDIUM
5. **Google OAuth nonce gak diverifikasi** di callback
6. **GitHub OAuth state gak di-verify server-side**
7. **CSP: `http:` di img-src** — insecure
8. **No `form-action` / `frame-ancestors` CSP** — clickjacking possible

## LOW
9. **No rate limiting** di `/api/github` dan `/api/auth/github`
10. **In-memory rate limiter** gak work di serverless
11. **Pusher di CSP** gak dipake
12. **`generateId()` pake Math.random()** — gak cryptographically secure
