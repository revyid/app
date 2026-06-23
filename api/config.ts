export default function handler() {
  return new Response(JSON.stringify({
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
