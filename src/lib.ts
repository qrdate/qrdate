import {
  createHash,
  createHmac,
  randomBytes,
  sign as cryptoSign,
  verify as cryptoVerify,
  type KeyLike,
} from 'node:crypto';

/**
 * Sign a QR Date string and return it as base64url
 * @param {number|string} timestamp Timestamp
 * @param {KeyLike} key Key to use
 * @returns {string} base64url-encoded signature
 */
export function sign(
  timestamp: number|string,
  key: KeyLike,
): string {
  if(typeof timestamp === 'number') timestamp = timestamp.toString();
  return cryptoSign(null, Buffer.from(timestamp), key).toString('base64url');
}

/**
 * Verify a signature on a QR Date string
 * @param {string} signature Signature
 * @param {number|string} timestamp Timestamp
 * @param {KeyLike} key Public key to use
 * @returns {boolean} True if signature is valid
 */
export function verify(
  timestamp: number|string,
  key: KeyLike,
  signature: string,
): boolean {
  if(typeof timestamp === 'number') timestamp = timestamp.toString();
  return cryptoVerify(null, Buffer.from(timestamp), key, Buffer.from(signature, 'base64url'));
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
}

/**
 * Type for a custom QR Date URL formatter.
 * It is recommended that you stay within the spec of the QR Date URL to stay compatible with other implementations, so
 * return a GET query with the parameters `s` for signature), `t` for timestamp.
 * See the default implementation below for the exact format.
 */
export type CustomQRDateURLFormatter = (params: DynamicQRDateURLParams) => string;

/**
 * Creates a dynamic QR Code URL
 * @param {object} obj
 * @param {string} obj.urlBase URL base for verification endpoint (https://host/folder)
 * @param {number} obj.timestamp Timestamp
 * @param {string} obj.signature Signature
 * @param {CustomQRDateURLFormatter} formatter Custom URL formatter function
 * @returns {string} Dynamic QR Date verification URL
 */
export function createDynamicQRDateURL({
  urlBase,
  timestamp,
  signature,
  formatter
}: DynamicQRDateURLParams): string {
  if (formatter) {
    return formatter({
      urlBase,
      timestamp,
      signature,
    });
  }
  const base = new URL(urlBase);
  return `${base.origin}${base.pathname}?s=${signature}&t=${timestamp}`;
}

/**
 * Type for the input parameters to create a static QR Date URL.
 */
export type StaticQRDateURLParams = {
  timestamp: number;
  signature: string;
  fingerprint: string;
}

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
 * @returns {string} Static QR Date verification URL
 */
export function createStaticQRDateURL({
  timestamp,
  signature,
  fingerprint,
}: StaticQRDateURLParams): string {
  return `qrdate://v?s=${signature}&t=${timestamp}&f=${fingerprint}`;
}

