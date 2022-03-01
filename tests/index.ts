import * as assert from 'uvu/assert';

import { createDynamicQRDate, createStaticQRDate, verifyDynamicQRDate, verifyStaticQRDate } from '../src/index.js';

import { createPublicKey } from 'node:crypto';
import { generateSalt } from '../src/lib.js';
import { test } from 'uvu';

const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEICD8k5Poo6PsLJ6PLN7HDzVnwkMZu5bmnkYDRhkF7iq0
-----END PRIVATE KEY-----`;
const TEST_PUBLIC_KEY = ` -----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEATV2v3k6Z/BIpLbIEeBpc+IzgbKtDK7QVEoMMA8NgStg=
-----END PUBLIC KEY-----`;
const TEST_TIMESTAMP = 1646141569644;
const TEST_SIGNATURE = 'xnNQ8mAM-xAlWGU4DjFAIB6Yy7oi2BDh37m6SYLiiJ0q73ObjYa05P3XwMgiGnXq2NYM641neVMu5BTxUFdABw';

test('[createDynamicQRDate] creates a dynamic QR Date', () => {
  const qrDate = createDynamicQRDate({
    urlBase: 'https://localhost',
    privateKey: TEST_PRIVATE_KEY,
  });

  assert.type(qrDate.publicKey, 'string');
  assert.type(qrDate.signature, 'string');
  assert.type(qrDate.timestamp, 'number');
  assert.type(qrDate.url, 'string');

  assert.is(qrDate.url.startsWith('https://localhost'), true);

  const url = new URL(qrDate.url);

  assert.is(url.searchParams.get('s'), qrDate.signature);
  assert.is(url.searchParams.get('t'), qrDate.timestamp.toString());
});

test('[createDynamicQRDate] throws when you do not define urlBase AND formatter, or private key', () => {
  assert.throws(() => { createDynamicQRDate({
    urlBase: 'https://localhost',
  } as any)});

  assert.throws(() => { createDynamicQRDate({} as any)});

  assert.throws(() => { createDynamicQRDate({
    privateKey: TEST_PRIVATE_KEY
  } as any)});
});

test('[createStaticQRDate] creates a static QR Date', () => {
  const qrDate = createStaticQRDate({
    privateKey: TEST_PRIVATE_KEY,
  });

  assert.type(qrDate.signature, 'string');
  assert.type(qrDate.timestamp, 'number');
  assert.type(qrDate.url, 'string');

  assert.is(qrDate.url.startsWith('qrdate://v?'), true);

  const url = new URL(qrDate.url);

  assert.is(url.searchParams.get('s'), qrDate.signature);
  assert.is(url.searchParams.get('t'), qrDate.timestamp.toString());
  assert.is(url.searchParams.get('f'), qrDate.fingerprint);
});

test('[createStaticQRDate] throws when you do not define public key or when public key is mangled', () => {

  assert.throws(() => { createStaticQRDate({} as any)});

  assert.throws(() => { createStaticQRDate({
    privateKey: '23 skidoo'
  })});

});

test('[verifyDynamicQRDate] returns true on a valid QR Date', () => {
  const valid = verifyDynamicQRDate({
    signature: TEST_SIGNATURE, 
    timestamp: TEST_TIMESTAMP,
    privateKey: TEST_PRIVATE_KEY,
  });

  assert.type(valid, 'boolean');
  assert.ok(valid);
});

test('[verifyDynamicQRDate] returns false on an invalid QR Date', () => {
  const valid = verifyDynamicQRDate({
    signature: TEST_SIGNATURE+'foo', 
    timestamp: TEST_TIMESTAMP+123,
    privateKey: TEST_PRIVATE_KEY,
  });

  assert.type(valid, 'boolean');
  assert.not.ok(valid);
});

test('[verifyDynamicQRDate] throws when you do not define signature, timestamp or either private or public key', () => {

  assert.throws(() => { verifyDynamicQRDate({} as any)});

  assert.throws(() => { verifyDynamicQRDate({
    timestamp: TEST_TIMESTAMP,
    privateKey: TEST_PRIVATE_KEY,
  } as any)});

  assert.throws(() => { verifyDynamicQRDate({
    signature: TEST_SIGNATURE, 
    privateKey: TEST_PRIVATE_KEY,
  } as any)});

  assert.throws(() => { verifyDynamicQRDate({
    signature: TEST_SIGNATURE+'foo', 
    timestamp: TEST_TIMESTAMP+123,
  })})

});

test('[verifyStaticQRDate] returns true on a valid QR Date', () => {
  const valid = verifyStaticQRDate({
    signature: TEST_SIGNATURE, 
    timestamp: TEST_TIMESTAMP,
    fingerprint: TEST_FINGERPRINT,
    publicKey: TEST_PRIVATE_KEY,
  });

  assert.type(valid, 'boolean');
  assert.ok(valid);
});

test('[verifyDynamicQRDate] returns false on an invalid QR Date', () => {
  const valid = verifyDynamicQRDate({
    signature: TEST_SIGNATURE+'foo', 
    timestamp: TEST_TIMESTAMP+123,
    privateKey: TEST_PRIVATE_KEY,
  });

  assert.type(valid, 'boolean');
  assert.not.ok(valid);
});

test('[verifyDynamicQRDate] throws when you do not define signature, timestamp or either private or public key', () => {

  assert.throws(() => { verifyDynamicQRDate({} as any)});

  assert.throws(() => { verifyDynamicQRDate({
    timestamp: TEST_TIMESTAMP,
    privateKey: TEST_PRIVATE_KEY,
  } as any)});

  assert.throws(() => { verifyDynamicQRDate({
    signature: TEST_SIGNATURE, 
    privateKey: TEST_PRIVATE_KEY,
  } as any)});

  assert.throws(() => { verifyDynamicQRDate({
    signature: TEST_SIGNATURE+'foo', 
    timestamp: TEST_TIMESTAMP+123,
  })})

});

test.run();

