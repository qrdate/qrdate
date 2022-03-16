import * as assert from 'uvu/assert';

import {
    type DynamicQRDateURLParams,
    createDynamicQRDateURL,
    createFingerprint,
    createStaticQRDateURL,
    sign,
    verify,
} from '../src/lib.js';

import { createPublicKey } from 'node:crypto';
import { suite } from 'uvu';

const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIJNhDPM+bt0wnIz6sIfflgJSuW4+vZ1knYC59r1QUbzJ
-----END PRIVATE KEY-----`;
const TEST_URL_BASE = 'https://localhost.com/v';
const TEST_TIMESTAMP = 1647432994586;
const TEST_SIGNATURE =
    'qnfjbMc_R4DH7VWIgK-bxULmwqEoZxHiA7EBs7NpRvRYEPTdgv1YFR8y2IrS3Uocmzm6jTuJ9ufUhsWb-3DaCA';

//
// createFingerprint
//

const createFingerprintSuite = suite('createFingerprint');

createFingerprintSuite('[createFingerprint] creates a valid fingerprint from a public key', () => {
    const publicKey = createPublicKey(TEST_PRIVATE_KEY);
    const fingerprint = createFingerprint(publicKey);
    assert.ok(fingerprint);
    assert.type(fingerprint, 'string');
    assert.is(fingerprint, 'soyUshlcjtJZ8LQVqu4_ObCykgpFN2EUmfoESVaReiE');
});

createFingerprintSuite('[createFingerprint] throws if public key is mangled', () => {
    assert.throws(() => {
        const publicKey = createPublicKey('23 skidoo');
        const fingerprint = createFingerprint(publicKey);
    });
});

createFingerprintSuite.run();

//
// sign
//

const signSuite = suite('sign');

signSuite('[sign] signs a string with timestamp', () => {
    const signedString = sign(TEST_TIMESTAMP, TEST_PRIVATE_KEY);
    assert.type(signedString, 'string');
    assert.is(signedString, TEST_SIGNATURE);
});

signSuite.run();

//
// verify
//

const verifySuite = suite('verify');

verifySuite('[verify] returns true on a properly signed string', () => {
    const publicKey = createPublicKey(TEST_PRIVATE_KEY);
    const valid = verify(TEST_TIMESTAMP, publicKey, TEST_SIGNATURE);
    assert.type(valid, 'boolean');
    assert.ok(valid);
});

verifySuite('[verify] returns false on a mismatch', () => {
    const publicKey = createPublicKey(TEST_PRIVATE_KEY);
    const valid = verify(TEST_TIMESTAMP + 'foo', publicKey, TEST_SIGNATURE);
    assert.type(valid, 'boolean');
    assert.not.ok(valid);
});

verifySuite.run();

//
// createDynamicQRDateURL
//

const createDynamicQRDateURLSuite = suite('createDynamicQRDateURL');

function CustomFormatter({ urlBase, timestamp, signature }: DynamicQRDateURLParams) {
    return `https://foo.bar/verify?s=${signature}&t=${timestamp}`;
}

createDynamicQRDateURLSuite('creates a valid url', () => {
    const url = new URL(
        createDynamicQRDateURL({
            urlBase: TEST_URL_BASE,
            timestamp: TEST_TIMESTAMP,
            signature: TEST_SIGNATURE,
            version: 1,
        }),
    );

    assert.is(url.origin, TEST_URL_BASE.split('/v')[0]);
    assert.is(url.pathname, '/v');
    assert.is(url.searchParams.get('s'), TEST_SIGNATURE);
    assert.is(url.searchParams.get('t'), TEST_TIMESTAMP.toString());
});

createDynamicQRDateURLSuite('creates a valid url with a custom formatter', () => {
    const url = new URL(
        createDynamicQRDateURL({
            formatter: CustomFormatter,
            urlBase: TEST_URL_BASE,
            timestamp: TEST_TIMESTAMP,
            signature: TEST_SIGNATURE,
            version: 1,
        }),
    );

    assert.is(url.host, 'foo.bar');
    assert.is(url.pathname, '/verify');
    assert.is(url.searchParams.get('s'), TEST_SIGNATURE);
    assert.is(url.searchParams.get('t'), TEST_TIMESTAMP.toString());
});

//
// createStaticQRDateURL
//

const createStaticQRDateURLSuite = suite('createStaticQRDateURL');

createStaticQRDateURLSuite('creates a valid qrdate:// URL', () => {
    const publicKey = createPublicKey(TEST_PRIVATE_KEY);
    const fingerprint = createFingerprint(publicKey);

    const url = new URL(
        createStaticQRDateURL({
            fingerprint,
            timestamp: TEST_TIMESTAMP,
            signature: TEST_SIGNATURE,
            version: 1,
        }),
    );

    assert.is(url.protocol, 'qrdate:');
    assert.is(url.host, 'v');
    assert.is(url.searchParams.get('s'), TEST_SIGNATURE);
    assert.is(url.searchParams.get('t'), TEST_TIMESTAMP.toString());
    assert.is(url.searchParams.get('f'), fingerprint);
});

createStaticQRDateURLSuite.run();
