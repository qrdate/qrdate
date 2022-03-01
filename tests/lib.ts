import * as assert from 'uvu/assert';

import {
  createDynamicQRDateURL,
  createFingerprint,
  createStaticQRDateURL,
  sign,
  verify,
  type DynamicQRDateURLParams,
  type StaticQRDateURLParams
} from '../src/lib.js';

import { createPublicKey } from 'node:crypto';
import { test } from 'uvu';

const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEICD8k5Poo6PsLJ6PLN7HDzVnwkMZu5bmnkYDRhkF7iq0
-----END PRIVATE KEY-----`;
const TEST_PUBLIC_KEY = ` -----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEATV2v3k6Z/BIpLbIEeBpc+IzgbKtDK7QVEoMMA8NgStg=
-----END PUBLIC KEY-----`;
const TEST_URL_BASE = 'https://localhost.com/v'
const TEST_TIMESTAMP = 1646141569644;
const TEST_SIGNATURE = 'xnNQ8mAM-xAlWGU4DjFAIB6Yy7oi2BDh37m6SYLiiJ0q73ObjYa05P3XwMgiGnXq2NYM641neVMu5BTxUFdABw';

test('[createFingerprint] creates a valid fingerprint from a public key', () => {
  const publicKey = createPublicKey(TEST_PRIVATE_KEY);
  const fingerprint = createFingerprint(publicKey);
  assert.ok(fingerprint);
  assert.type(fingerprint, 'string');
  assert.is(fingerprint, 'soyUshlcjtJZ8LQVqu4_ObCykgpFN2EUmfoESVaReiE');
});

test('[createFingerprint] throws if private key is mangled', () => {
  assert.throws((() => {
    const publicKey = createPublicKey('23 skidoo');
    const fingerprint = createFingerprint(publicKey);
  }));
});

test('[sign] signs a string with timestamp', () => {
  const signedString = sign(TEST_TIMESTAMP, TEST_PRIVATE_KEY);
  assert.type(signedString, 'string');
  assert.is(signedString, TEST_SIGNATURE);
});

test('[verify] returns true on a properly signed string', () => {
  const publicKey = createPublicKey(TEST_PRIVATE_KEY);
  const valid = verify(TEST_TIMESTAMP, publicKey, TEST_SIGNATURE);
  assert.type(valid, 'boolean');
  assert.ok(valid);
});

test('[verify] returns false on a mismatch', () => {
  const publicKey = createPublicKey(TEST_PRIVATE_KEY);
  const valid = verify(TEST_TIMESTAMP+'foo', publicKey, TEST_SIGNATURE);
  assert.type(valid, 'boolean');
  assert.not.ok(valid);
});

test('[createDynamicQRDateURL] creates a valid url', () => {
  const url = new URL(createDynamicQRDateURL({
    urlBase: TEST_URL_BASE,
    timestamp: TEST_TIMESTAMP,
    signature: TEST_SIGNATURE,
  }));

  assert.is(url.origin, TEST_URL_BASE.split('/v')[0]);
  assert.is(url.pathname, '/v');
  assert.is(url.searchParams.get('s'), TEST_SIGNATURE);
  assert.is(url.searchParams.get('t'), TEST_TIMESTAMP.toString());
});

function CustomFormatter({
  urlBase,
  timestamp,
  signature,
}: DynamicQRDateURLParams) {
  return `https://foo.bar/verify?s=${signature}&t=${timestamp}`;
}

test('[createDynamicQRDateURL] creates a valid url with a custom formatter', () => {
  const url = new URL(createDynamicQRDateURL({
    formatter: CustomFormatter,
    urlBase: TEST_URL_BASE,
    timestamp: TEST_TIMESTAMP,
    signature: TEST_SIGNATURE,
  }));

  assert.is(url.host, 'foo.bar');
  assert.is(url.pathname, '/verify');
  assert.is(url.searchParams.get('s'), TEST_SIGNATURE);
  assert.is(url.searchParams.get('t'), TEST_TIMESTAMP.toString());
});

test('[createStaticQRDateURL] creates a valid qrdate:// URL', () => {
  const publicKey = createPublicKey(TEST_PRIVATE_KEY);
  const fingerprint = createFingerprint(publicKey);
  
  const url = new URL(createStaticQRDateURL({
    fingerprint,
    timestamp: TEST_TIMESTAMP,
    signature: TEST_SIGNATURE,
  }));

  assert.is(url.protocol, 'qrdate:');
  assert.is(url.host, 'v');
  assert.is(url.searchParams.get('s'), TEST_SIGNATURE);
  assert.is(url.searchParams.get('t'), TEST_TIMESTAMP.toString());
  assert.is(url.searchParams.get('f'), fingerprint);
});

test.run();