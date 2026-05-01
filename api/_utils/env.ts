/**
 * Shared env helper for API routes.
 * In Vercel production: reads from process.env (set via dashboard).
 * In Vite dev: reads from process.env (loaded by the apiDevPlugin).
 */
export function env(key: string): string | undefined {
  return process.env[key];
}
