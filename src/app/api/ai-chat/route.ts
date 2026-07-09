import { NextRequest, NextResponse } from 'next/server';

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const ALLOWED_ORIGINS = ['https://revy.my.id', 'https://dev.revy.my.id'];

// Rate limiter: 5 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function getCorsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '';
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  const cors = getCorsHeaders(origin);

  // CORS check
  if (!ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: cors });
  }

  // Rate limit
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429, headers: cors });
  }

  try {
    const { messages } = await req.json();

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400, headers: cors });
    }

    // Limit conversation length to prevent abuse
    if (messages.length > 20) {
      return NextResponse.json({ error: 'Conversation too long' }, { status: 400, headers: cors });
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== 'string') {
        return NextResponse.json({ error: 'Invalid message format' }, { status: 400, headers: cors });
      }
      // Limit individual message length
      if (msg.content.length > 500) {
        return NextResponse.json({ error: 'Message too long (max 500 chars)' }, { status: 400, headers: cors });
      }
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500, headers: cors });
    }

    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [
          { role: 'system', content: 'You are Revy, a friendly AI assistant embedded in a portfolio website. Keep responses concise and helpful. Use a casual, friendly tone. You can help with coding questions, general knowledge, or just chat.' },
          ...messages.slice(-10), // Only keep last 10 messages for context
        ],
        temperature: 0.7,
        max_tokens: 512,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error('NVIDIA API error:', response.status);
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 502, headers: cors });
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ message: aiMessage }, { headers: cors });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: cors });
  }
}