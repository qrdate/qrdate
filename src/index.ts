import {
  createPublicKey,
  generateKeyPairSync,
  randomBytes,
  type KeyLike,
} from 'node:crypto';

import {
  createQRDateURL,
  formatClearTextSignature,
  generateSalt,
  sign,
  verify,
  type CustomQRDateURLFormatter
} from './lib.js';

export * from './lib.js';

/**
 * QR Date object
 */
export type QRDate = {
  timestamp: number;
  salt: string;
  url: string;
  signature: string;
  publicKey: string;
};

/**
 * Create a QR Date object with the current time.
 * The URL can be formatted using the `formatter` function, which has a signature of `CustomQRDateURLFormatter`.
 * You need to provide either the urlBase or formatter function. If you provide a formatter, urlBase is ignored.
 * For more info, see https://github.com/qrdate/qrdate/tree/main#createqrdate.
 * @param {Object} obj
 * @param {string} [obj.urlBase] URL base to use (https://host/folder - no trailing slash)
 * @param {KeyLike} obj.privateKey Private key to use
 * @param {CustomQRDateURLFormatter} obj.[formatter] Custom URL formatter function
 * @param {number} obj.[entropyLength] Amount of entropy to use as salt, default 32 bytes
 * @returns {QRDate} QR Date object
 */
export function createQRDate({
  urlBase,
  privateKey,
  formatter,
  entropyLength
}: {
  urlBase?: string;
  privateKey: KeyLike;
  formatter?: CustomQRDateURLFormatter;
  entropyLength?: number;
}): QRDate {
  if (!urlBase && !formatter) throw 'urlBase or formatter is required';
  if (!privateKey) throw 'privateKey is required';
  
  // If there's no public key passed, derive one from the private key
  const publicKey = createPublicKey(privateKey).export({ format: 'der', type: 'spki' }).toString('base64url');

  // Generate a timestamp
  const timestamp = new Date().getTime();

  // Get some random entropy
  const salt = generateSalt(entropyLength);

  // Sign the timestamp + salt
  const signature = sign(formatClearTextSignature(timestamp, salt), privateKey);

  // Create the QR code url
  const url = createQRDateURL({
    urlBase,
    timestamp,
    signature,
    salt,
    formatter,
    publicKey,
  });

  return {
    timestamp,
    salt,
    url,
    signature,
    publicKey,
  }
}

/**
 * Verify that the signature on a signed QR Date string is valid.
 * For more info, see https://github.com/qrdate/qrdate/tree/main#verifyqrdate.
 * @param {Object} obj
 * @param {number} obj.timestamp Timestamp
 * @param {string} obj.salt Salt value
 * @param {string} obj.signature Signature
 * @param {KeyLike} [obj.privateKey] Private key to use - OR
 * @param {KeyLike} [obj.publicKey] Public key to use
 * @returns {boolean} True if valid
 */
export function verifyQRDate({
  timestamp,
  salt,
  signature,
  privateKey,
  publicKey,
}:{
  timestamp: number;
  salt: string;
  signature: string;
  privateKey?: KeyLike;
  publicKey?: KeyLike;
}): boolean {
  if(!timestamp) throw 'timestamp is required';
  if(!salt) throw 'salt is required';
  if(!publicKey && !privateKey) throw 'privateKey or publicKey is required';

  // If we're being passed base64url format keys, try to turn them into PEM keys
  if (privateKey && typeof privateKey === 'string' && !privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${Buffer.from(privateKey, 'base64url').toString('base64')}\n-----END PRIVATE KEY-----`;
  }

  if (publicKey && typeof publicKey === 'string' && !publicKey.startsWith('-----BEGIN PUBLIC KEY-----')) {
    publicKey = `-----BEGIN PUBLIC KEY-----\n${Buffer.from(publicKey, 'base64url').toString('base64')}\n-----END PUBLIC KEY-----`;
  }

  // If there's a private key passed, derive a public key first if one doesn't exist
  if (!publicKey && privateKey) publicKey = createPublicKey(privateKey);
  return verify(formatClearTextSignature(timestamp, salt), publicKey, signature);
}

/**
 * Generate ed25519 key pair and return them as string or KeyObject
 * @param {boolean} [asString] Return keys as string, not KeyObject (default true)
 * @returns {object} { privateKey: string | KeyObject, publicKey: string | KeyObject }
 */
export function generateKeys(asString: boolean = true) {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    }
  })
  if(asString) {
    return {
      privateKey: privateKey.toString(),
      publicKey: publicKey.toString(),
    }
  }
  return {
    privateKey,
    publicKey,
  }
}
