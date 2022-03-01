import * as assert from 'uvu/assert';

import { createQRDate, verifyQRDate } from '../src/index.js';

import { createPublicKey } from 'node:crypto';
import { generateSalt } from '../src/lib.js';
import { test } from 'uvu';

const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIDgQtOtTyj6rlKFp2+qwlrgzGeA2sxJz4agZKzsCFGKw
-----END PRIVATE KEY-----`;

const TEST_URL_BASE = 'https://localhost'
const TEST_TIMESTAMP = 1646109781467;
const TEST_SALT = 'bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI';
const TEST_STRING_TO_SIGN = '1646109781467bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI';
const TEST_SIGNATURE = 'x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA';

test('[createQRDate] creates a QR Date', () => {
  const qrDate = createQRDate({
    urlBase: 'https://localhost',
    privateKey: TEST_PRIVATE_KEY,
  });

  assert.type(qrDate.publicKey, 'string');
  assert.type(qrDate.salt, 'string');
  assert.type(qrDate.signature, 'string');
  assert.type(qrDate.timestamp, 'number');
  assert.type(qrDate.url, 'string');

  assert.is(qrDate.salt.length, 43);
  assert.is(qrDate.url.startsWith('https://localhost'), true);

  const url = new URL(qrDate.url);

  assert.is(url.searchParams.get('s'), qrDate.signature);
  assert.is(url.searchParams.get('t'), qrDate.timestamp.toString());
  assert.is(url.searchParams.get('e'), qrDate.salt);
});

test('[createQRDate] throws when you do not define urlBase AND formatter, or private key', () => {

  assert.throws(() => { createQRDate({
    urlBase: 'https://localhost',
  } as any)});

  assert.throws(() => { createQRDate({} as any)});

  assert.throws(() => { createQRDate({
    privateKey: TEST_PRIVATE_KEY
  } as any)});

});

test('[verifyQRDate] returns true on a valid QR Date', () => {
  const valid = verifyQRDate({
    signature: TEST_SIGNATURE, 
    timestamp: TEST_TIMESTAMP,
    salt: TEST_SALT,
    privateKey: TEST_PRIVATE_KEY,
  });

  assert.type(valid, 'boolean');
  assert.ok(valid);
});

test('[verifyQRDate] returns false on an invalid QR Date', () => {
  const valid = verifyQRDate({
    signature: TEST_SIGNATURE+'foo', 
    timestamp: TEST_TIMESTAMP+123,
    salt: TEST_SALT+'foo',
    privateKey: TEST_PRIVATE_KEY,
  });

  assert.type(valid, 'boolean');
  assert.not.ok(valid);
});

test('[verifyQRDate] throws when you do not define signature, timestamp, salt or either private or public key', () => {

  assert.throws(() => { verifyQRDate({
    timestamp: TEST_TIMESTAMP,
    salt: TEST_SALT,
    privateKey: TEST_PRIVATE_KEY,
  } as any)});

  assert.throws(() => { verifyQRDate({
    signature: TEST_SIGNATURE, 
    salt: TEST_SALT,
    privateKey: TEST_PRIVATE_KEY,
  } as any)});

  assert.throws(() => { verifyQRDate({
    signature: TEST_SIGNATURE, 
    timestamp: TEST_TIMESTAMP,
    privateKey: TEST_PRIVATE_KEY,
  } as any)});

  assert.throws(() => { verifyQRDate({
    signature: TEST_SIGNATURE+'foo', 
    timestamp: TEST_TIMESTAMP+123,
    salt: TEST_SALT+'foo',
  })})

});

test.run();

