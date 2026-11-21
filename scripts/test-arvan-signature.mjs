/**
 * تست امضای SigV4 برای آروان: مقایسه با بردار رسمی مستندات AWS و بررسی
 * ساخت کلید آبجکت و اعتبارسنجی مسیر.
 */

import {
  buildCompleteXml,
  buildObjectKey,
  getArvanConfig,
  isSafeArvanKey,
  keyFromPublicUrl,
  presignObject,
  presignUrl,
  publicUrlFor,
} from '../functions/api/_shared/arvan.ts';

let failures = 0;

function check(name, actual, expected) {
  if (actual === expected) {
    console.log(`ok   ${name}`);
    return;
  }
  failures += 1;
  console.error(`FAIL ${name}`);
  console.error(`  expected: ${expected}`);
  console.error(`  actual:   ${actual}`);
}

// بردار رسمی مستندات AWS (sigv4-query-string-auth). توجه: کلید Secret در
// مستند با «/» نوشته شده است، نه «+».
const awsUrl = await presignUrl({
  method: 'GET',
  endpoint: 'https://examplebucket.s3.amazonaws.com',
  path: '/test.txt',
  accessKey: 'AKIAIOSFODNN7EXAMPLE',
  secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  region: 'us-east-1',
  expires: 86400,
  date: new Date('2013-05-24T00:00:00Z'),
});

check(
  'AWS presign signature',
  new URL(awsUrl).searchParams.get('X-Amz-Signature'),
  'aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404',
);

check(
  'AWS presign credential scope',
  new URL(awsUrl).searchParams.get('X-Amz-Credential'),
  'AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request',
);

const config = getArvanConfig({
  ARVAN_S3_ENDPOINT: 'https://s3.ir-thr-at1.arvanstorage.ir',
  ARVAN_S3_REGION: 'ir-thr-at1',
  ARVAN_S3_BUCKET: 'sinazarghamimedia',
  ARVAN_S3_ACCESS_KEY: 'test-access',
  ARVAN_S3_SECRET_KEY: 'test-secret',
});

check('config parses', config !== null, true);
check(
  'default public base',
  config.publicBase,
  'https://s3.ir-thr-at1.arvanstorage.ir/sinazarghamimedia',
);
check('default prefix', config.prefix, 'media');

check('config rejects incomplete env', getArvanConfig({ ARVAN_S3_BUCKET: 'x' }), null);

const key = buildObjectKey(config, 'My Photo 01.JPG', 'image/jpeg');
check('object key prefix', key.startsWith('media/'), true);
check('object key extension', key.endsWith('.jpg'), true);
check('object key is safe', isSafeArvanKey(config, key), true);
check('rejects traversal', isSafeArvanKey(config, 'media/../secret.txt'), false);
check('rejects foreign prefix', isSafeArvanKey(config, 'other/file.jpg'), false);
check('rejects unicode key', isSafeArvanKey(config, 'media/عکس.jpg'), false);
check('rejects unknown extension', buildObjectKey(config, 'clip.avi', 'video/x-msvideo'), null);

check(
  'public url',
  publicUrlFor(config, 'media/2026/01/a-b.jpg'),
  'https://s3.ir-thr-at1.arvanstorage.ir/sinazarghamimedia/media/2026/01/a-b.jpg',
);

check(
  'key from public url',
  keyFromPublicUrl(
    config,
    'https://s3.ir-thr-at1.arvanstorage.ir/sinazarghamimedia/media/2026/01/a-b.jpg',
  ),
  'media/2026/01/a-b.jpg',
);
check(
  'key from public url with query',
  keyFromPublicUrl(config, `${publicUrlFor(config, 'media/2026/01/c.jpg')}?v=2`),
  'media/2026/01/c.jpg',
);
check(
  'key rejects foreign bucket',
  keyFromPublicUrl(config, 'https://s3.ir-thr-at1.arvanstorage.ir/other-bucket/media/a.jpg'),
  null,
);

const partUrl = await presignObject(
  config,
  'PUT',
  'media/2026/01/a-b.mp4',
  { partNumber: '3', uploadId: 'abc+123/def=' },
  3600,
);
const partParams = new URL(partUrl).searchParams;
check('part url keeps partNumber', partParams.get('partNumber'), '3');
check('part url keeps uploadId', partParams.get('uploadId'), 'abc+123/def=');
check('part url is path style', new URL(partUrl).pathname, '/sinazarghamimedia/media/2026/01/a-b.mp4');
check('part url signs only host', partParams.get('X-Amz-SignedHeaders'), 'host');
check(
  'part url query is sorted',
  partParams.toString().split('&')[0],
  'X-Amz-Algorithm=AWS4-HMAC-SHA256',
);

check(
  'complete xml',
  buildCompleteXml([
    { partNumber: 1, etag: '"a&b"' },
    { partNumber: 2, etag: '"c"' },
  ]),
  '<CompleteMultipartUpload><Part><PartNumber>1</PartNumber><ETag>&quot;a&amp;b&quot;</ETag></Part>' +
    '<Part><PartNumber>2</PartNumber><ETag>&quot;c&quot;</ETag></Part></CompleteMultipartUpload>',
);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}

console.log('\nAll Arvan signature checks passed.');
