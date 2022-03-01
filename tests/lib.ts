import * as assert from 'uvu/assert';

import { createQRDateURL, formatClearTextSignature, generateSalt, sign, verify, type QRDateURLParameters } from '../src/lib.js';

import { createPublicKey } from 'node:crypto';
import { test } from 'uvu';

const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIDgQtOtTyj6rlKFp2+qwlrgzGeA2sxJz4agZKzsCFGKw
-----END PRIVATE KEY-----`;

const TEST_URL_BASE = 'https://localhost'
const TEST_TIMESTAMP = 1646109781467;
const TEST_SALT = 'bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI';
const TEST_STRING_TO_SIGN = '1646109781467bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI';
const TEST_SIGNATURE = 'x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA';

test('[generateSalt] generates a suitable salt', () => {
  const salt = generateSalt();
  assert.ok(salt);
  assert.type(salt, 'string');
  assert.is(salt.length, TEST_SALT.length);
});

test('[formatClearTextSignature] formats a suitable string for signing', () => {
  const stringToSign = formatClearTextSignature(TEST_TIMESTAMP, TEST_SALT);
  assert.ok(stringToSign);
  assert.type(stringToSign, 'string');
  assert.is(stringToSign, TEST_STRING_TO_SIGN);
});

test('[sign] signs a string with timestamp and salt', () => {
  const signedString = sign(TEST_STRING_TO_SIGN, TEST_PRIVATE_KEY);
  assert.type(signedString, 'string');
  assert.is(signedString, TEST_SIGNATURE);
});

test('[verify] returns true on a properly signed string', () => {
  const publicKey = createPublicKey(TEST_PRIVATE_KEY);
  const valid = verify(TEST_STRING_TO_SIGN, publicKey, TEST_SIGNATURE);
  assert.type(valid, 'boolean');
  assert.ok(valid);
});

test('[verify] returns false on a mismatch', () => {
  const publicKey = createPublicKey(TEST_PRIVATE_KEY);
  const valid = verify(TEST_STRING_TO_SIGN+'foo', publicKey, TEST_SIGNATURE);
  assert.type(valid, 'boolean');
  assert.not.ok(valid);
});

test('[createQRDateURL] creates a valid url', () => {
  const url = new URL(createQRDateURL({
    urlBase: TEST_URL_BASE,
    timestamp: TEST_TIMESTAMP,
    signature: TEST_SIGNATURE,
    salt: TEST_SALT
  }));

  assert.is(url.origin, TEST_URL_BASE);
  assert.is(url.pathname, '/v');
  assert.is(url.searchParams.get('s'), TEST_SIGNATURE);
  assert.is(url.searchParams.get('t'), TEST_TIMESTAMP.toString());
  assert.is(url.searchParams.get('e'), TEST_SALT);
});

function CustomFormatter({
  urlBase,
  timestamp,
  signature,
  salt
}: QRDateURLParameters) {
  return `https://foo.bar/verify?s=${signature}&t=${timestamp}&e=${salt}`;
}

test('[createQRDateURL] creates a valid url with a custom formatter', () => {
  const url = new URL(createQRDateURL({
    formatter: CustomFormatter,
    urlBase: TEST_URL_BASE,
    timestamp: TEST_TIMESTAMP,
    signature: TEST_SIGNATURE,
    salt: TEST_SALT
  }));

  assert.is(url.host, 'foo.bar');
  assert.is(url.pathname, '/verify');
  assert.is(url.searchParams.get('s'), TEST_SIGNATURE);
  assert.is(url.searchParams.get('t'), TEST_TIMESTAMP.toString());
  assert.is(url.searchParams.get('e'), TEST_SALT);
});

test('[createQRDateURL] creates a valid qrdate:// URI', () => {
  const publicKey = createPublicKey(TEST_PRIVATE_KEY).export({ format: 'der', type: 'spki' }).toString('base64url');
  
  const url = new URL(createQRDateURL({
    urlBase: 'qrdate://',
    publicKey,
    timestamp: TEST_TIMESTAMP,
    signature: TEST_SIGNATURE,
    salt: TEST_SALT
  }));

  assert.is(url.protocol, 'qrdate:');
  assert.is(url.host, 'v');
  assert.is(url.searchParams.get('s'), TEST_SIGNATURE);
  assert.is(url.searchParams.get('t'), TEST_TIMESTAMP.toString());
  assert.is(url.searchParams.get('e'), TEST_SALT);
  assert.is(url.searchParams.get('p'), publicKey);
});

test.run();