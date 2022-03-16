import * as assert from 'uvu/assert';

import { suite } from 'uvu';

import {
    createDynamicQRDate,
    createStaticQRDate,
    verifyDynamicQRDate,
    verifyStaticQRDate,
} from '../src/index.js';

const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIKcHWlNrhVUkCfwZa5d1AUKAE3iXvzzpI4SIyuqMD7CC
-----END PRIVATE KEY-----`;
const TEST_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAT/d6LZ1RboU5sKcBIr+XhQh1tZzd8ZRepxwhJGH9icw=
-----END PUBLIC KEY-----`;

const TEST_DYNAMIC_TIMESTAMP = 1647432931202;
const TEST_DYNAMIC_SIGNATURE =
    'IXQ7fjV1dLzhmU6CWuHLJGzWBI_lp4wS5wwdfvx89stiuA9FCLXAb5Rs9W0SX-uMfTFrmE9CR_NDHNnSvhv9Bg';

const TEST_STATIC_TIMESTAMP = 1647432931203;
const TEST_STATIC_FINGERPRINT = 'soyUshlcjtJZ8LQVqu4_ObCykgpFN2EUmfoESVaReiE';
const TEST_STATIC_SIGNATURE =
    'EY-ck4q7OodDIfkwJozy_0Q7UQKxHiBZCfm-S6ZxTTXplg6tUjUCa8FHHfCq2-sivNsEYkVR-7Vui1bGdObeAQ';

//
// createDynamicQRDate
//

const createDynamicQRDateSuite = suite('createDynamicQRDate');

createDynamicQRDateSuite('creates a dynamic QR Date', () => {
    const qrDate = createDynamicQRDate({
        urlBase: 'https://localhost',
        privateKey: TEST_PRIVATE_KEY,
    });

    assert.type(qrDate.signature, 'string');
    assert.type(qrDate.timestamp, 'number');
    assert.type(qrDate.url, 'string');

    assert.is(qrDate.url.startsWith('https://localhost'), true);

    const url = new URL(qrDate.url);

    assert.is(url.searchParams.get('s'), qrDate.signature);
    assert.is(url.searchParams.get('t'), qrDate.timestamp.toString());
});

createDynamicQRDateSuite(
    'throws when you do not define urlBase AND formatter, or private key',
    () => {
        assert.throws(() => {
            createDynamicQRDate({
                urlBase: 'https://localhost',
            } as any);
        });

        assert.throws(() => {
            createDynamicQRDate({} as any);
        });

        assert.throws(() => {
            createDynamicQRDate({
                privateKey: TEST_PRIVATE_KEY,
            } as any);
        });
    },
);

createDynamicQRDateSuite.run();

//
// createStaticQRDate
//

const createStaticQRDateSuite = suite('createStaticQRDate');

createStaticQRDateSuite('creates a static QR Date', () => {
    const qrDate = createStaticQRDate(TEST_PRIVATE_KEY);

    assert.type(qrDate.signature, 'string');
    assert.type(qrDate.timestamp, 'number');
    assert.type(qrDate.url, 'string');

    assert.is(qrDate.url.startsWith('qrdate://v?'), true);

    const url = new URL(qrDate.url);

    assert.is(url.searchParams.get('s'), qrDate.signature);
    assert.is(url.searchParams.get('t'), qrDate.timestamp.toString());
    assert.is(url.searchParams.get('f'), qrDate.fingerprint);
});

createStaticQRDateSuite(
    'throws when you do not define public key or when public key is mangled',
    () => {
        assert.throws(() => {
            createStaticQRDate({ foo: 'bar' } as any);
        });
        assert.throws(() => {
            createStaticQRDate('23 skidoo');
        });
    },
);

createStaticQRDateSuite.run();

//
// verifyDynamicQRDate
//

const verifyDynamicQRDateSuite = suite('verifyDynamicQRDate');

verifyDynamicQRDateSuite('returns true on a valid QR Date', () => {
    const valid = verifyDynamicQRDate({
        signature: TEST_DYNAMIC_SIGNATURE,
        timestamp: TEST_DYNAMIC_TIMESTAMP,
        publicKey: TEST_PUBLIC_KEY,
    });

    assert.type(valid, 'boolean');
    assert.ok(valid);
});

verifyDynamicQRDateSuite('returns false on an invalid QR Date', () => {
    const valid = verifyDynamicQRDate({
        signature: TEST_DYNAMIC_SIGNATURE + 'foo',
        timestamp: TEST_DYNAMIC_TIMESTAMP + 123,
        publicKey: TEST_PUBLIC_KEY,
    });

    assert.type(valid, 'boolean');
    assert.not.ok(valid);
});

verifyDynamicQRDateSuite('throws when you do not define signature, timestamp or public key', () => {
    assert.throws(() => {
        verifyDynamicQRDate({} as any);
    });

    assert.throws(() => {
        verifyDynamicQRDate({
            timestamp: TEST_DYNAMIC_TIMESTAMP,
            publicKey: TEST_PUBLIC_KEY,
        } as any);
    });

    assert.throws(() => {
        verifyDynamicQRDate({
            signature: TEST_DYNAMIC_SIGNATURE,
            publicKey: TEST_PUBLIC_KEY,
        } as any);
    });

    assert.throws(() => {
        verifyDynamicQRDate({
            signature: TEST_DYNAMIC_SIGNATURE + 'foo',
            timestamp: TEST_DYNAMIC_TIMESTAMP + 123,
        } as any);
    });
});

verifyDynamicQRDateSuite.run();

//
// verifyStaticQRDate
//

const verifyStaticQRDateSuite = suite('verifyStaticQRDate');

verifyStaticQRDateSuite('returns true on a valid QR Date', () => {
    const opts = {
        signature: TEST_STATIC_SIGNATURE,
        timestamp: TEST_STATIC_TIMESTAMP,
        fingerprint: TEST_STATIC_FINGERPRINT,
        publicKey: TEST_PUBLIC_KEY,
    };

    const valid = verifyStaticQRDate(opts);

    assert.type(valid, 'boolean');
    assert.ok(valid);
});

verifyStaticQRDateSuite('returns false on an invalid QR Date', () => {
    const valid = verifyStaticQRDate({
        signature: TEST_STATIC_SIGNATURE + 'foo',
        fingerprint: TEST_STATIC_FINGERPRINT + 'sdfsdf',
        timestamp: TEST_STATIC_TIMESTAMP + 123,
        publicKey: TEST_PUBLIC_KEY,
    });

    assert.type(valid, 'boolean');
    assert.not.ok(valid);
});

verifyStaticQRDateSuite(
    'throws when you do not define signature, timestamp, fingerprint or public key',
    () => {
        assert.throws(() => {
            verifyStaticQRDate({} as any);
        });

        assert.throws(() => {
            verifyStaticQRDate({
                timestamp: TEST_STATIC_TIMESTAMP,
                publicKey: TEST_PUBLIC_KEY,
            } as any);
        });

        assert.throws(() => {
            verifyStaticQRDate({
                signature: TEST_STATIC_SIGNATURE,
                publicKey: TEST_PUBLIC_KEY,
            } as any);
        });

        assert.throws(() => {
            verifyStaticQRDate({
                signature: TEST_STATIC_SIGNATURE + 'foo',
                timestamp: TEST_STATIC_TIMESTAMP + 123,
            } as any);
        });

        assert.throws(() => {
            verifyStaticQRDate({
                fingerprint: TEST_STATIC_FINGERPRINT,
                publicKey: TEST_PUBLIC_KEY,
            } as any);
        });
    },
);

verifyStaticQRDateSuite.run();
