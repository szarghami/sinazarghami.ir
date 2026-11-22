import assert from 'node:assert/strict';
import { callGemini } from '../functions/api/_shared/ai';
import { prepareEnglishFields } from '../functions/api/_shared/translateContent';

const before = { photos: [{ id: 'one', titleFa: 'old', titleEn: 'old translation', descriptionFa: 'same', descriptionEn: 'saved translation' }] };
const next = { photos: [{ id: 'one', titleFa: 'new', titleEn: 'old translation', descriptionFa: 'same', descriptionEn: '' }] };
assert.equal(prepareEnglishFields(next, before), 1);
assert.equal(next.photos[0].titleEn, '');
assert.equal(next.photos[0].descriptionEn, 'saved translation');
const added = { photos: [{ id: 'new', titleFa: 'new', titleEn: 'placeholder', descriptionFa: '', descriptionEn: '' }] };
assert.equal(prepareEnglishFields(added, before), 1);
assert.equal(added.photos[0].titleEn, '');

const calls: string[] = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input) => {
  const url = String(input); calls.push(url);
  if (url.includes('generativelanguage')) return new Response('quota', { status: 429 });
  if (url.includes('anthropic')) return Response.json({ content: [{ type: 'text', text: '{"titleFa":"ok"}' }] });
  throw new Error('Paid fallback should not be called');
};
try {
  const kv = { get: async () => JSON.stringify({ order: ['gemini', 'anthropic'], paidFallback: 'openai' }), put: async () => {}, delete: async () => {}, list: async () => ({ keys: [] }) };
  const result = await callGemini({ ADMIN_KV: kv, GEMINI_API_KEY: 'a', ANTHROPIC_API_KEY: 'b', ANTHROPIC_MODEL: 'configured', OPENAI_API_KEY: 'c', OPENAI_MODEL: 'configured' }, { system: 'test', parts: [{ text: 'test' }], json: true });
  assert.equal(JSON.parse(result).titleFa, 'ok');
  assert.equal(calls.length, 2);
  assert.match(calls[0], /generativelanguage/);
  assert.match(calls[1], /anthropic/);
} finally { globalThis.fetch = originalFetch; }
console.log('AI failover and translation preparation passed');
