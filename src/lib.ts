import { type KeyLike, createHash, sign as cryptoSign, verify as cryptoVerify } from 'node:crypto';

/**
 * Sign a QR Date string and return it as base64url
 * @param {number|string} timestamp Timestamp
 * @param {KeyLike} key Key to use
 * @param {number} version Version of QR Date (only 1 supported right now)
 * @returns {string} base64url-encoded signature
 */
export function sign(timestamp: number | string, key: KeyLike, version = 1): string {
    if (typeof timestamp === 'number') timestamp = timestamp.toString();
    const stringToSign = `t=${timestamp}&v=${version}`;
    return cryptoSign(null, Buffer.from(stringToSign), key).toString('base64url');
}

/**
 * Verify a signature on a QR Date string
 * @param {string} signature Signature
 * @param {number|string} timestamp Timestamp
 * @param {KeyLike} key Public key to use
 * @param {number} version Version of QR Date (only 1 supported right now)
 * @returns {boolean} True if signature is valid
 */
export function verify(
    timestamp: number | string,
    key: KeyLike,
    signature: string,
    version = 1,
): boolean {
    if (typeof timestamp === 'number') timestamp = timestamp.toString();
    const stringToVerify = `t=${timestamp}&v=${version}`;
    return cryptoVerify(
        null,
        Buffer.from(stringToVerify),
        key,
        Buffer.from(signature, 'base64url'),
    );
}

/**
 * Type for the input parameters to create a dynamic QR Date URL.
 */
export type DynamicQRDateURLParams = {
    publicKey?: KeyLike;
    timestamp: number;
    signature: string;
    urlBase?: string;
    formatter?: CustomQRDateURLFormatter;
    version: number;
};

/**
 * Type for a custom QR Date URL formatter.
 * It is recommended that you stay within the spec of the QR Date URL to stay compatible with
 * other implementations, so return a GET query with the parameters `s` for signature), `t`
 * for timestamp, and `v` for version.
 * See the default implementation below for the exact format.
 */
export type CustomQRDateURLFormatter = (params: DynamicQRDateURLParams) => string;

/**
 * Creates a dynamic QR Code URL
 * @param {object} obj
 * @param {string} obj.urlBase URL base for verification endpoint (https://host/folder)
 * @param {number} obj.timestamp Timestamp
 * @param {string} obj.signature Signature
 * @param {number} obj.version QR Date version
 * @param {CustomQRDateURLFormatter} formatter Custom URL formatter function
 * @returns {string} Dynamic QR Date verification URL
 */
export function createDynamicQRDateURL({
    urlBase,
    timestamp,
    signature,
    formatter,
    version = 1,
}: DynamicQRDateURLParams): string {
    if (formatter) {
        return formatter({
            urlBase,
            timestamp,
            signature,
            version,
        });
    }
    const base = new URL(urlBase);
    return `${base.origin}${base.pathname}?s=${signature}&t=${timestamp}&v=${version}`;
}

/**
 * Type for the input parameters to create a static QR Date URL.
 */
export type StaticQRDateURLParams = {
    timestamp: number;
    signature: string;
    fingerprint: string;
    version: number;
};

/**
 * Hash a public key to get a fingerprint
 * @param {KeyLike} publicKey Public key to use
 * @returns {string} Key fingerprint in base64url
 */
export function createFingerprint(publicKey: KeyLike) {
    const hash = createHash('sha256');
    hash.update(publicKey.toString('utf8'));
    return hash.digest('base64url');
}

/**
 * Creates a static QR Code URL.
 * Do not feed a public key directly into this function. Derive a fingerprint first.
 * @param {object} obj
 * @param {number} obj.timestamp Timestamp
 * @param {string} obj.signature Signature
 * @param {string} obj.fingerprint Public key fingerprint to be used as key ID
 * @param {number} obj.version QR Date version
 * @returns {string} Static QR Date verification URL
 */
export function createStaticQRDateURL({
    timestamp,
    signature,
    fingerprint,
    version,
}: StaticQRDateURLParams): string {
    return `qrdate://v?s=${signature}&t=${timestamp}&f=${fingerprint}&v=${version}`;
}
