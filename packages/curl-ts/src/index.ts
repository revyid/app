/**
 * curl-ts — cURL for TypeScript
 *
 * Parse and execute curl commands in browser and Node.js.
 *
 * @example Browser
 * ```ts
 * import { curl } from 'curl-ts';
 * const res = await curl('curl -H "x-api-key: rv_xxx" "https://api.example.com/data"');
 * console.log(res.body);
 * ```
 *
 * @example With proxy (bypasses CORS)
 * ```ts
 * import { curl } from 'curl-ts';
 * const res = await curl('curl https://api.example.com/data', '/api/curl-proxy');
 * console.log(res.body);
 * ```
 *
 * @example Parse only
 * ```ts
 * import { parseCurlCommand } from 'curl-ts';
 * const options = parseCurlCommand('curl -X POST -d \'{"a":1}\' https://api.example.com');
 * console.log(options); // { method: 'POST', url: '...', body: '{"a":1}', ... }
 * ```
 */

export { parseCurlCommand } from './parser';
export type { CurlOptions } from './parser';
export { curl, toCurl } from './browser';
export type { CurlResponse } from './browser';
