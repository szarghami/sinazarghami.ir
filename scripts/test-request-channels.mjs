import { readRequestJson } from '../functions/api/_shared/request.ts';

const b64url = (text) =>
  Buffer.from(text, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const payload = { kind: 'content', total: 3 };
const json = JSON.stringify(payload);

const results = [];

const viaGet = await readRequestJson(
  new Request(`https://example.com/api/upload/init?p=${b64url(json)}`, { method: 'GET' }),
);
results.push(['GET ?p=', JSON.stringify(viaGet) === json]);

const viaText = await readRequestJson(
  new Request('https://example.com/api/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: b64url(json),
  }),
);
results.push(['POST text/plain', JSON.stringify(viaText) === json]);

const viaJson = await readRequestJson(
  new Request('https://example.com/api/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: json,
  }),
);
results.push(['POST application/json', JSON.stringify(viaJson) === json]);

const broken = await readRequestJson(
  new Request('https://example.com/api/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not json',
  }),
);
results.push(['invalid body -> null', broken === null]);

for (const [name, ok] of results) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
process.exit(results.every(([, ok]) => ok) ? 0 : 1);
