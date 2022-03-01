import {
  createHash,
  createPublicKey,
  generateKeyPairSync,
  randomBytes,
  type KeyLike,
} from 'node:crypto';

import {
  createDynamicQRDateURL,
  createFingerprint,
  createStaticQRDateURL,
  sign,
  verify,
  type CustomQRDateURLFormatter
} from './lib.js';

export * from './lib.js';

/**
 * Dynamic QR Date object
 */
export type DynamicQRDate = {
  timestamp: number;
  url: string;
  signature: string;
  publicKey: string;
};

/**
 * Static QR Date object
 */
export type StaticQRDate = {
  timestamp: number;
  url: string;
  signature: string;
  fingerprint: string;
};

/**
 * Create a DYNAMIC QR Date object with the current time.
 * The URL can be formatted using the `formatter` function, which has a signature of `CustomQRDateURLFormatter`.
 * You need to provide either the urlBase or formatter function. If you provide a formatter, urlBase is ignored.
 * For more info, see https://github.com/qrdate/qrdate/tree/main#createdynamicqrdate.
 * @param {Object} obj
 * @param {string} [obj.urlBase] URL base to use (https://host/folder - no trailing slash)
 * @param {KeyLike} obj.privateKey Private key to use
 * @param {CustomQRDateURLFormatter} obj.[formatter] Custom URL formatter function
 * @returns {DynamicQRDate} Dynamic QR Date object
 */
export function createDynamicQRDate({
  privateKey,
  urlBase,
  formatter,
}: {
  privateKey: KeyLike;
  urlBase?: string;
  formatter?: CustomQRDateURLFormatter;
}): DynamicQRDate {
  if (!privateKey) throw 'privateKey is required';
  if (!urlBase && !formatter) throw 'urlBase or formatter is required';
  
  // If there's no public key passed, derive one from the private key
  const publicKey = createPublicKey(privateKey).export({ format: 'der', type: 'spki' }).toString('base64url');

  // Generate a timestamp
  const timestamp = new Date().getTime();

  // Sign the timestamp
  const signature = sign(timestamp, privateKey);

  // Create the QR code url
  const url = createDynamicQRDateURL({
    urlBase,
    timestamp,
    signature,
    formatter,
  });

  return {
    timestamp,
    url,
    signature,
    publicKey,
  }
}

/**
 * Create a STATIC QR Date object with the current time.
 * The URL can be formatted using the `formatter` function, which has a signature of `CustomQRDateURLFormatter`.
 * You need to provide either the urlBase or formatter function. If you provide a formatter, urlBase is ignored.
 * For more info, see https://github.com/qrdate/qrdate/tree/main#createqrdate.
 * @param {Object} obj
 * @param {string} [obj.urlBase] URL base to use (https://host/folder - no trailing slash)
 * @param {KeyLike} obj.privateKey Private key to use
 * @returns {StaticQRDate} QR Date object
 */
export function createStaticQRDate({
  privateKey,
}: {
  privateKey: KeyLike;
}): StaticQRDate {
  if (!privateKey) throw 'privateKey is required';
  
  // If there's no public key passed, derive one from the private key
  const publicKey = createPublicKey(privateKey);

  // Generate a timestamp
  const timestamp = new Date().getTime();

  // Sign the timestamp
  const signature = sign(timestamp, privateKey);

  const fingerprint = createFingerprint(publicKey);

  // Create the QR code url
  const url = createStaticQRDateURL({
    timestamp,
    signature,
    fingerprint,
  });

  return {
    timestamp,
    url,
    signature,
    fingerprint
  }
}

function formatPrivateKey(privateKey: KeyLike) {
  // If we're being passed base64url format keys, try to turn them into PEM keys
  if (privateKey && typeof privateKey === 'string' && !privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${Buffer.from(privateKey, 'base64url').toString('base64')}\n-----END PRIVATE KEY-----`;
  }
  return privateKey;
}

function formatPublicKey(publicKey: KeyLike) {
  if (publicKey && typeof publicKey === 'string' && !publicKey.startsWith('-----BEGIN PUBLIC KEY-----')) {
    publicKey = `-----BEGIN PUBLIC KEY-----\n${Buffer.from(publicKey, 'base64url').toString('base64')}\n-----END PUBLIC KEY-----`;
  }
  return publicKey;
}

/**
 * Verify that the signature on a signed QR Date string is valid.
 * For more info, see https://github.com/qrdate/qrdate/tree/main#verifydynamicqrdate.
 * @param {Object} obj
 * @param {number} obj.timestamp Timestamp
 * @param {string} obj.signature Signature
 * @param {KeyLike} [obj.privateKey] Private key to use - OR
 * @param {KeyLike} [obj.publicKey] Public key to use
 * @returns {boolean} True if valid
 */
export function verifyDynamicQRDate({
  timestamp,
  signature,
  privateKey,
  publicKey,
}:{
  timestamp: number;
  signature: string;
  privateKey?: KeyLike;
  publicKey?: KeyLike;
}): boolean {
  if(!timestamp) throw 'timestamp is required';
  if(!signature) throw 'signature is required';
  if(!publicKey && !privateKey) throw 'privateKey or publicKey is required';

  privateKey = formatPrivateKey(privateKey);
  publicKey = formatPublicKey(publicKey);

  // If there's a private key passed, derive a public key first if one doesn't exist
  if (!publicKey && privateKey) publicKey = createPublicKey(privateKey);
  return verify(timestamp, publicKey, signature);
}

/**
 * Verify that the signature on a static signed QR Date string is valid based on its fingerprint.
 * @param {Object} obj
 * @param {number} obj.timestamp Timestamp
 * @param {string} obj.signature Signature
 * @param {string} obj.fingerprint Public key fingerprint
 * @param {KeyLike} [obj.publicKey] Public key to use
 * @returns {boolean} True if valid
 */
export function verifyStaticQRDate({
  timestamp,
  signature,
  fingerprint,
  publicKey,
}:{
  timestamp: number;
  signature: string;
  fingerprint: string;
  privateKey?: KeyLike;
  publicKey?: KeyLike;
}): boolean {
  if(!timestamp) throw 'timestamp is required';
  if(!signature) throw 'signature is required';
  if(!fingerprint) throw 'fingerprint is required';
  if(!publicKey) throw 'publicKey is required';

  publicKey = formatPublicKey(publicKey);

  // If there's a private key passed, derive a public key first if one doesn't exist
  const verifyFingerprint = createFingerprint(publicKey);

  console.log('verifyFingerprint', verifyFingerprint)
  console.log(fingerprint);

  if(verifyFingerprint !== fingerprint) return false;
  return verify(timestamp, publicKey, signature);
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
