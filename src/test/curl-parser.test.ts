import { describe, it, expect } from 'vitest';
import { parseCurlCommand } from '../lib/curl-parser';

describe('CurlParser', () => {
  it('basic GET', () => {
    const r = parseCurlCommand('curl https://httpbin.org/get');
    expect(r.url).toBe('https://httpbin.org/get');
    expect(r.method).toBeUndefined();
  });

  it('short flags: -Lvk', () => {
    const r = parseCurlCommand('curl -Lvk https://httpbin.org/get');
    expect(r.url).toBe('https://httpbin.org/get');
    expect(r.redirect).toBe('follow');
    expect(r.verbose).toBe(true);
    expect(r.insecure).toBe(true);
  });

  it('long option with =', () => {
    const r = parseCurlCommand('curl --request=POST --header="Accept: application/json" --data=\'{"hello":true}\' https://httpbin.org/post');
    expect(r.url).toBe('https://httpbin.org/post');
    expect(r.method).toBe('POST');
    expect(r.headers['Accept']).toBe('application/json');
    expect(r.body).toBe('{"hello":true}');
  });

  it('URL before body', () => {
    const r = parseCurlCommand('curl https://httpbin.org/post -d \'{"a":1}\'');
    expect(r.url).toBe('https://httpbin.org/post');
    expect(r.body).toBe('{"a":1}');
    expect(r.method).toBe('POST');
  });

  it('URL after body', () => {
    const r = parseCurlCommand('curl -d \'{"a":1}\' https://httpbin.org/post');
    expect(r.url).toBe('https://httpbin.org/post');
    expect(r.body).toBe('{"a":1}');
  });

  it('header with multiple colons', () => {
    const r = parseCurlCommand('curl -H "Authorization: Bearer aaa:bbb:ccc" https://httpbin.org/get');
    expect(r.headers['Authorization']).toBe('Bearer aaa:bbb:ccc');
  });

  it('header with empty value', () => {
    const r = parseCurlCommand('curl -H "X-Test:" https://httpbin.org/get');
    expect(r.headers['X-Test']).toBe('');
  });

  it('header without value', () => {
    const r = parseCurlCommand('curl -H "X-Test" https://httpbin.org/get');
    expect(r.headers['X-Test']).toBe('');
  });

  it('mixed quotes', () => {
    const r = parseCurlCommand(`curl https://httpbin.org/post -H 'Accept: application/json' -H "X-Test: abc" -d '{"hello":"world"}'`);
    expect(r.headers['Accept']).toBe('application/json');
    expect(r.headers['X-Test']).toBe('abc');
    expect(r.body).toBe('{"hello":"world"}');
  });

  it('escaped backslash in data', () => {
    // Parser strips one backslash per escape: \\ → \
    const r = parseCurlCommand('curl https://httpbin.org/post -d "path\\\\to\\\\file"');
    expect(r.body).toBe('path\\to\\file');
  });

  it('multiple -d', () => {
    const r = parseCurlCommand('curl https://httpbin.org/post -d a=1 -d b=2 -d c=3');
    expect(r.body).toBe('a=1&b=2&c=3');
  });

  it('data-urlencode', () => {
    const r = parseCurlCommand('curl https://httpbin.org/post --data-urlencode "q=hello world"');
    expect(r.queryParams!['q']).toBe('hello world');
  });

  it('multipart -F', () => {
    const r = parseCurlCommand('curl https://httpbin.org/post -F "name=Rama" -F "bio=Hello World"');
    expect(Array.isArray(r.body)).toBe(true);
    expect(r.body).toEqual([['name', 'Rama'], ['bio', 'Hello World']]);
  });

  it('cookie', () => {
    const r = parseCurlCommand('curl -b "a=1; b=2" https://httpbin.org/get');
    expect(r.cookie).toBe('a=1; b=2');
  });

  it('cookie jar', () => {
    const r = parseCurlCommand('curl -c cookies.txt https://httpbin.org/get');
    expect(r.cookieJar).toBe('cookies.txt');
    expect(r.url).toBe('https://httpbin.org/get');
  });

  it('basic auth', () => {
    const r = parseCurlCommand('curl -u user:pass https://httpbin.org/basic-auth/user/pass');
    expect(r.user).toBe('user:pass');
  });

  it('repeat headers', () => {
    const r = parseCurlCommand('curl -H "A:1" -H "B:2" -H "C:3" https://httpbin.org/get');
    expect(r.headers['A']).toBe('1');
    expect(r.headers['B']).toBe('2');
    expect(r.headers['C']).toBe('3');
  });

  it('URL with query params', () => {
    const r = parseCurlCommand('curl "https://httpbin.org/get?a=1&b=2&c=3"');
    expect(r.url).toBe('https://httpbin.org/get?a=1&b=2&c=3');
  });

  it('line continuation', () => {
    const r = parseCurlCommand('curl -s -H "x-api-key: test" \\\n  "https://httpbin.org/get"');
    expect(r.url).toBe('https://httpbin.org/get');
    expect(r.headers['x-api-key']).toBe('test');
  });

  it('missing URL throws', () => {
    expect(() => parseCurlCommand('curl -X POST')).toThrow('No URL');
  });

  it('stress test', () => {
    const r = parseCurlCommand(`curl "https://httpbin.org/anything?x=1&y=2" -X PATCH -H "Accept: application/json" -H "Authorization: Bearer abc:def:ghi" -H "X-Test: Hello World" -b "theme=dark; session=abc123" --compressed --location --max-time 20 --data-raw '{"hello":"world","nested":{"a":[1,2,3]}}'`);
    expect(r.url).toBe('https://httpbin.org/anything?x=1&y=2');
    expect(r.method).toBe('PATCH');
    expect(r.headers['Accept']).toBe('application/json');
    expect(r.headers['Authorization']).toBe('Bearer abc:def:ghi');
    expect(r.headers['X-Test']).toBe('Hello World');
    expect(r.cookie).toBe('theme=dark; session=abc123');
    expect(r.compressed).toBe(true);
    expect(r.redirect).toBe('follow');
    expect(r.timeout).toBe(20000);
    expect(r.body).toBe('{"hello":"world","nested":{"a":[1,2,3]}}');
  });
});
