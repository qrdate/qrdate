import {
  randomBytes,
  sign as cryptoSign,
  verify as cryptoVerify,
  type KeyLike,
} from 'node:crypto';

export const ENTROPY_LENGTH = 32;

/**
 * Format the cleartext value before signing
 * @param {number} timestamp UNIX timestamp
 * @param {string} salt Random salt
 * @returns {string} Formatted string ready for signing
 */
export function formatClearTextSignature(timestamp: number, salt: string) {
  return timestamp.toString()+salt;
}

/**
 * Generate some random entropy for a salt
 * @param {number} entropyLength Number of bytes to read
 * @returns {string} Salt as base64url
 */
export function generateSalt(entropyLength: number = ENTROPY_LENGTH) {
  return randomBytes(entropyLength).toString('base64url');
}

/**
 * Sign a QR Date string and return it as base64url
 * @param {string} str String to sign
 * @param {KeyLike} key Key to use
 * @returns {string} base64url-encoded signature
 */
export function sign(
  str: string,
  key: KeyLike,
): string {
  return cryptoSign(null, Buffer.from(str), key).toString('base64url');
}

/**
 * Verify a signature on a QR Date string
 * @param {string} signature Signature
 * @param {string} str Unsigned cleartext string from formatClearTextSignature
 * @param {KeyLike} key Public key to use
 * @returns {boolean} True if signature is valid
 */
export function verify(
  str: string,
  key: KeyLike,
  signature: string,
): boolean {
  return cryptoVerify(null, Buffer.from(str), key, Buffer.from(signature, 'base64url'));
}

/**
 * Type for the input parameters to create a QR Date URL.
 */
export type QRDateURLParameters = {
  urlBase?: string;
  publicKey?: KeyLike;
  timestamp: number;
  signature: string;
  salt: string;
}

/**
 * Type for a custom QR Date URL formatter.
 * It is recommended that you stay within the spec of the QR Date URL to stay compatible with other implementations, so
 * return a GET query with the parameters `s` for signature), `t` for timestamp and `e` for salt (entropy), and `p` if
 * the public key is supplied and urlBase starts with qrdate://.
 * See the default implementation below for the exact format.
 */
export type CustomQRDateURLFormatter = (params: QRDateURLParameters) => string;

/**
 * Creates a QR Code URL
 * @param {object} obj
 * @param {string} obj.urlBase URL base (no trailing slash- https://host/folder or qrdate://)
 * @param {number} obj.timestamp Timestamp
 * @param {string} obj.signature Signature
 * @param {string} obj.salt Salt
 * @param {string} [obj.publicKey] Optional public key if using the qrdate:// scheme- in base64url format
 * @param {CustomQRDateURLFormatter} formatter Custom URL formatter function
 * @returns {string} URL
 */
export function createQRDateURL({
  urlBase,
  timestamp,
  signature,
  salt,
  publicKey,
  formatter
}: QRDateURLParameters & { formatter?: CustomQRDateURLFormatter; }): string {
  if (formatter) {
    return formatter({
      urlBase,
      publicKey,
      timestamp,
      signature,
      salt
    });
  }
  const base = new URL(urlBase);
  if (urlBase.startsWith('qrdate://')) {
    // V1 Static type URI
    return `qrdate://v?s=${signature}&t=${timestamp}&e=${salt}&p=${publicKey}`;
  }
  // V1 Dynamic type URL
  return `${base.origin}${base.pathname}?s=${signature}&t=${timestamp}&e=${salt}`;
}
