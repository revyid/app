# curl-ts

**cURL for TypeScript** — parse and execute curl commands in browser and Node.js.

## Install

```bash
npm install curl-ts
```

## Usage

### Execute a curl command

```ts
import { curl } from 'curl-ts';

const res = await curl('curl -H "x-api-key: rv_xxx" "https://api.example.com/data"');
console.log(res.body);
```

### Parse only

```ts
import { parseCurlCommand } from 'curl-ts';

const options = parseCurlCommand('curl -X POST -d \'{"a":1}\' https://api.example.com');
console.log(options);
// { method: 'POST', url: 'https://api.example.com', body: '{"a":1}', headers: {}, ... }
```

### With proxy (bypasses CORS)

```ts
import { curl } from 'curl-ts';

const res = await curl(
  'curl -H "Authorization: Bearer token" "https://api.example.com/data"',
  '/api/curl-proxy'
);
console.log(res.body);
```

## Supported Flags

| Flag | Description |
|------|-------------|
| `-X`, `--request` | HTTP method |
| `-H`, `--header` | Custom header |
| `-d`, `--data`, `--data-raw` | Request body |
| `-F`, `--form` | Multipart form data |
| `-A`, `--user-agent` | User-Agent string |
| `-u`, `--user` | Basic auth (user:pass) |
| `-b`, `--cookie` | Cookie string |
| `-c`, `--cookie-jar` | Cookie jar filename |
| `-e`, `--referer` | Referer header |
| `-L`, `--location` | Follow redirects |
| `-v`, `--verbose` | Verbose output |
| `-i`, `--include` | Include response headers |
| `-G`, `--get` | Force GET with data |
| `-k`, `--insecure` | Skip SSL verification (ignored in browser) |
| `-s`, `--silent` | Silent mode (ignored) |
| `--max-time` | Request timeout (seconds) |
| `--compressed` | Enable compression |
| `--data-urlencode` | URL-encoded data |

Also supports:
- Short flag combos: `-Lvk` → `-L`, `-v`, `-k`
- `--flag=value` syntax
- Line continuations: `\` + newline
- Single and double quotes
- Escaped characters

## Types

```ts
interface CurlOptions {
  method?: string;
  url: string;
  headers: Record<string, string>;
  body?: string | Record<string, string> | [string, string][];
  timeout?: number;
  verbose: boolean;
  user?: string;
  redirect: 'follow' | 'error' | 'manual';
  userAgent: string;
  referer?: string;
  cookie?: string;
  cookieJar?: string;
  insecure: boolean;
  compressed: boolean;
}

interface CurlResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: T;
  url: string;
  ok: boolean;
  duration: number;
  curlCommand: string;
}
```

## License

MIT
