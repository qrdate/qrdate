//
// Test consuming javascript file
//

import { createDynamicQRDate, createStaticQRDate, generateKeys, verifyDynamicQRDate, verifyStaticQRDate } from './dist/index.js';

const { privateKey, publicKey } = generateKeys();

console.log('generateKeys:');
console.log('---------------------------------------------');

console.log(privateKey, publicKey)

console.log('---------------------------------------------');

const ddate = createDynamicQRDate({
  urlBase: 'https://localhost.com/v',
  privateKey
});

console.log('new dynamic date:', ddate);

console.log('---------------------------------------------');

const sdate = createStaticQRDate(privateKey);

console.log('new static date:', sdate);

console.log('---------------------------------------------');

const v = {
  timestamp: 1646141569644,
  signature: 'xnNQ8mAM-xAlWGU4DjFAIB6Yy7oi2BDh37m6SYLiiJ0q73ObjYa05P3XwMgiGnXq2NYM641neVMu5BTxUFdABw',
  publicKey: 'MCowBQYDK2VwAyEATV2v3k6Z_BIpLbIEeBpc-IzgbKtDK7QVEoMMA8NgStg'
};

console.log('test 1 valid:', v, verifyDynamicQRDate(v));

console.log('---------------------------------------------');

const v2 = {
  timestamp: 1646151957315,
  signature: 'RQ_o83c9T8fA9l0Dt1WdKKSu8fVivhMPXii159tXGK9DbZQvRpyWPtN5jKwfuLx6GK3-uYzkLKduulczHMOACg',
  fingerprint: 'soyUshlcjtJZ8LQVqu4_ObCykgpFN2EUmfoESVaReiE',
  publicKey: `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAErp45uy1csIzQOObCbmLKJX+o3Xq+or0986XSPC24Lo=
-----END PUBLIC KEY-----`
};

console.log('test 2 valid:', v2, verifyStaticQRDate(v2));

console.log('---------------------------------------------');
