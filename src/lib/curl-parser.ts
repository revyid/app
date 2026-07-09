/**
 * curl-parser.ts — Shared curl command parser.
 * Handles all common curl flags, short flag combos, --flag=value syntax,
 * quoted strings, escaped characters, line continuations, and edge cases.
 */

export interface CurlOptions {
  method?: string;
  url: string;
  headers: Record<string, string>;
  body?: string | Record<string, string> | [string, string][];
  queryParams?: Record<string, string>;
  timeout?: number;
  verbose: boolean;
  user?: string;
  redirect: 'follow' | 'error' | 'manual';
  userAgent: string;
  referer?: string;
  cookie?: string;
  cookieJar?: string;
  includeHeaders: boolean;
  insecure: boolean;
  compressed: boolean;
}

// Flags that consume the next argument as their value
const FLAGS_WITH_VALUE = new Set([
  '-X', '--request',
  '-H', '--header',
  '-d', '--data', '--data-raw', '--data-binary', '--data-urlencode',
  '-F', '--form',
  '-A', '--user-agent',
  '-u', '--user',
  '-b', '--cookie',
  '-c', '--cookie-jar',
  '-e', '--referer',
  '--max-time', '--connect-timeout', '--retry', '--retry-delay',
]);

// Boolean flags (no argument consumed)
const BOOLEAN_FLAGS = new Set([
  '-L', '--location', '--follow',
  '-v', '--verbose',
  '-i', '--include',
  '-G', '--get',
  '-k', '--insecure',
  '--compressed',
  '-I', '--head',
  '-s', '--silent',
  '-S', '--show-error',
  '-N', '--no-buffer',
]);

// Alias map for short flags that expand to multiple flags
const FLAG_ALIASES: Record<string, string[]> = {
  '-v': ['-v'],
  '-k': ['-k'],
  '-L': ['-L'],
  '-s': ['-s'],
  '-S': ['-S'],
  '-N': ['-N'],
};

export function parseCurlCommand(command: string): CurlOptions {
  const tokens = tokenize(command);

  // Skip program name
  let start = 0;
  if (tokens.length > 0 && (tokens[0] === 'curl' || tokens[0].endsWith('/curl'))) start = 1;

  const options: CurlOptions = {
    url: '',
    headers: {},
    verbose: false,
    redirect: 'error',
    userAgent: 'curl/7.81.0',
    includeHeaders: false,
    insecure: false,
    compressed: false,
  };

  let i = start;
  while (i < tokens.length) {
    const token = tokens[i];

    // Handle --flag=value syntax
    if (token.startsWith('--') && token.includes('=')) {
      const eqIdx = token.indexOf('=');
      const flag = token.substring(0, eqIdx);
      const value = token.substring(eqIdx + 1);

      if (flag === '--request' || flag === '-X') options.method = value;
      else if (flag === '--header' || flag === '-H') addHeader(options, value);
      else if (flag === '--data' || flag === '--data-raw' || flag === '--data-binary') addData(options, value);
      else if (flag === '--data-urlencode') addUrlEncode(options, value);
      else if (flag === '--form' || flag === '-F') addForm(options, value);
      else if (flag === '--user-agent' || flag === '-A') options.userAgent = value;
      else if (flag === '--user' || flag === '-u') options.user = value;
      else if (flag === '--cookie' || flag === '-b') options.cookie = value;
      else if (flag === '--cookie-jar' || flag === '-c') options.cookieJar = value;
      else if (flag === '--referer' || flag === '-e') options.referer = value;
      else if (flag === '--max-time' || flag === '--connect-timeout') options.timeout = parseFloat(value) * 1000;

      i++;
      continue;
    }

    // Handle short flag combinations: -Lvk → -L, -v, -k
    if (token.startsWith('-') && !token.startsWith('--') && token.length > 2) {
      const flags = token.substring(1).split('');
      for (const ch of flags) {
        const flag = '-' + ch;
        if (FLAGS_WITH_VALUE.has(flag)) {
          // This flag needs the next token as its value
          options.method = flag === '-X' ? tokens[++i] : options.method;
          if (flag === '-H') addHeader(options, tokens[++i]);
          else if (flag === '-d') addData(options, tokens[++i]);
          else if (flag === '-F') addForm(options, tokens[++i]);
          else if (flag === '-A') options.userAgent = tokens[++i];
          else if (flag === '-u') options.user = tokens[++i];
          else if (flag === '-b') options.cookie = tokens[++i];
          else if (flag === '-c') options.cookieJar = tokens[++i];
          else if (flag === '-e') options.referer = tokens[++i];
        } else if (flag === '-X') {
          options.method = tokens[++i];
        } else if (flag === '-H') {
          addHeader(options, tokens[++i]);
        } else if (flag === '-d') {
          addData(options, tokens[++i]);
        } else if (flag === '-F') {
          addForm(options, tokens[++i]);
        } else if (flag === '-A') {
          options.userAgent = tokens[++i];
        } else if (flag === '-u') {
          options.user = tokens[++i];
        } else if (flag === '-b') {
          options.cookie = tokens[++i];
        } else if (flag === '-c') {
          options.cookieJar = tokens[++i];
        } else if (flag === '-e') {
          options.referer = tokens[++i];
        } else if (flag === '-v') options.verbose = true;
        else if (flag === '-k') options.insecure = true;
        else if (flag === '-L') options.redirect = 'follow';
        else if (flag === '-i') options.includeHeaders = true;
        else if (flag === '-I') options.method = 'HEAD';
        else if (flag === '-s') {} // silent, ignore
        else if (flag === '-G') { options.method = 'GET'; }
        else if (flag === '--compressed') options.compressed = true;
      }
      i++;
      continue;
    }

    // Handle long flags
    switch (token) {
      case '-X': case '--request': options.method = tokens[++i]; break;
      case '-I': case '--head': options.method = 'HEAD'; break;
      case '-H': case '--header': addHeader(options, tokens[++i]); break;
      case '-d': case '--data': case '--data-raw': case '--data-binary':
        addData(options, tokens[++i]); break;
      case '--data-urlencode': addUrlEncode(options, tokens[++i]); break;
      case '-F': case '--form': addForm(options, tokens[++i]); break;
      case '-A': case '--user-agent': options.userAgent = tokens[++i]; break;
      case '-u': case '--user': options.user = tokens[++i]; break;
      case '-L': case '--location': options.redirect = 'follow'; break;
      case '-v': case '--verbose': options.verbose = true; break;
      case '-i': case '--include': options.includeHeaders = true; break;
      case '-G': case '--get': options.method = 'GET'; break;
      case '-b': case '--cookie': options.cookie = tokens[++i]; break;
      case '-c': case '--cookie-jar': options.cookieJar = tokens[++i]; break;
      case '-e': case '--referer': options.referer = tokens[++i]; break;
      case '-k': case '--insecure': options.insecure = true; break;
      case '--compressed': options.compressed = true; break;
      case '-s': case '--silent': break; // ignore
      case '--max-time': case '--connect-timeout':
        options.timeout = parseFloat(tokens[++i]) * 1000; break;
      default:
        // Non-flag arg = URL
        if (!options.url && !token.startsWith('-')) options.url = token;
        break;
    }
    i++;
  }

  if (!options.url) throw new Error('No URL provided in curl command.');
  return options;
}

function addHeader(opts: CurlOptions, value: string) {
  const colonIdx = value.indexOf(':');
  if (colonIdx === -1) {
    // Header with no value (e.g., -H "X-Test")
    opts.headers[value.trim()] = '';
  } else {
    const key = value.substring(0, colonIdx).trim();
    const val = value.substring(colonIdx + 1).trim();
    opts.headers[key] = val;
  }
}

function addData(opts: CurlOptions, value: string) {
  if (!opts.body) opts.body = value;
  else if (typeof opts.body === 'string') opts.body += '&' + value;
  if (!opts.method) opts.method = 'POST';
}

function addUrlEncode(opts: CurlOptions, value: string) {
  if (!opts.queryParams) opts.queryParams = {};
  const eqIdx = value.indexOf('=');
  if (eqIdx > -1) {
    const key = value.substring(0, eqIdx);
    const raw = value.substring(eqIdx + 1);
    // Safe decode — handles newlines and special chars that break decodeURIComponent
    try { opts.queryParams[key] = decodeURIComponent(raw); }
    catch { opts.queryParams[key] = raw; }
  }
  if (!opts.method) opts.method = 'POST';
}

function addForm(opts: CurlOptions, value: string) {
  if (!opts.body || !Array.isArray(opts.body)) opts.body = [];
  const eqIdx = value.indexOf('=');
  if (eqIdx > -1) {
    const key = value.substring(0, eqIdx);
    const val = value.substring(eqIdx + 1);
    opts.body.push([key, val]);
  } else {
    opts.body.push([value, '']);
  }
  if (!opts.method) opts.method = 'POST';
}

function tokenize(command: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\' && !inSingle) {
      // Inside double quotes: \" means literal quote
      if (inDouble && i + 1 < command.length && command[i + 1] === '"') {
        current += '"';
        i++;
        continue;
      }
      // Line continuation
      if (i + 1 < command.length && command[i + 1] === '\n') {
        i++;
        continue;
      }
      escaped = true;
      continue;
    }

    if (char === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }

    if (char === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }

    if ((char === ' ' || char === '\t' || char === '\n' || char === '\r') && !inSingle && !inDouble) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) tokens.push(current);
  return tokens;
}
