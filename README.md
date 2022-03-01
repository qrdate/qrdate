# QR Date

This is the reference TS implementation for QR Date, a signed date inside a QR code.

### What is it for?

This is a proof-of-concept for verifying the date in (near-) real-time reporting and live streams. It does not work against the past (taking pictures of the code and using them later) but could be used to verify the date in rapidly disseminated information.

### How does it work?

A timestamp is generated on the server and attached to a bit of randomness. They are then signed using a private key to produce a verification signature. The QR code contains a URL with the timestamp, the bit of randomness, and the signature. The signature can also be verified using a separately published public key.

We welcome contributions and people adopting this idea into other languages and environments, but ask to conform to the QR Date spec below. We recommend using ed25519 signature keys. There is a convenience function (`generateKeys`) exposed that you can use to generate your own.

For more information, please see [qrdate.org](https://qrdate.org).

## Dynamic QR Date spec — Hosting a verification page

Use this spec when you're hosting a verification page for QR Dates on your server. Anyone scanning a QR Date will load your website for verification. The public key will not be included in the QR code, so it can be shorter.

```
https://qrdate.org/v?s=x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA&t=1646109781467&e=bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI
```

1. **The only necessary thing is the query parameters**, so that they can be parsed in the same way everywhere.
2. Format the beginning of the URL (https://qrdate.org/v) to suit your hosting setup. We recommend keeping it short to keep the QR code clear.

Parameter | Type   | Explanation
----------|--------|-------------
`t`       | number | Timestamp (UNIX)
`s`       | string | Signature
`e`       | string | Random salt (32 bytes by default) - `e` for entropy

## Static QR Date spec — Not hosting a verification page

**You can use QR Date without hosting a verification page.** Use the URL base `qrdate://` and `createQRDate` will include the public key in the URL:

```
qrdate://v?s=x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA&t=1646109781467&e=bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI&p=MCowBQYDK2VwAyEAJH6tPGKF1ZCMP3DUdpiin7rDLmVb_9A1zyllxaU6cjg
```

Parameter | Type   | Explanation
----------|--------|-------------
`t`       | number | Timestamp (UNIX)
`s`       | string | Signature
`e`       | string | Random salt (32 bytes by default) - `e` for entropy
`p`       | string | Public key to use

This type of URL can be parsed without external parties as it contains both the signature and public key. Therefore, for example, a system that generates QR Dates every minute through a script to serve on a static website is possible.

## Using this library

### Installation

```sh
npm i --save qrdate
```

### `generateKeys`

Use to generate a pair of keys. You can use only the `privateKey` to interact with the library - any public keys that are required can be derived from it. **Store your private key in a safe place!** When used with QR Date it is essentially *a key to the future*.

### `createQRDate`

Create a QR Date spec object. Pass the generated `url` property to a QR code generator.

```ts
import { createQRDate, generateKeys } from 'qrdate';

//
// Generating a V1 Dynamic URL:
//

const qrDateDynamic = createQRDate({
  baseUrl: 'https://localhost',
  privateKey: `-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIDgQtOtTyj6rlKFp2+qwlrgzGeA2sxJz4agZKzsCFGKw\n-----END PRIVATE KEY-----`; // or a Buffer or KeyObject
});

console.log(qrDateDynamic);
// -----------^
// {
//   timestamp: 1646109781467,
//   salt: "bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI",
//   url: "https://localhost/v?s=x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA&t=1646109781467&e=bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI",
//   signature: "x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA",
//   publicKey: "MCowBQYDK2VwAyEAJH6tPGKF1ZCMP3DUdpiin7rDLmVb_9A1zyllxaU6cjg"
// }

//
// Generating a V1 Static URL:
// 

const qrDateStatic = createQRDate({
  baseUrl: 'qrdate://',
  privateKey: `-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIDgQtOtTyj6rlKFp2+qwlrgzGeA2sxJz4agZKzsCFGKw\n-----END PRIVATE KEY-----`; // or a Buffer or KeyObject
});

console.log(qrDateStatic);
// -----------^
// {
//   timestamp: 1646109781467,
//   salt: "bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI",
//   url: "qrdate://v?s=x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA&t=1646109781467&e=bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI&p=MCowBQYDK2VwAyEAJH6tPGKF1ZCMP3DUdpiin7rDLmVb_9A1zyllxaU6cjg",
//   signature: "x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA",
//   publicKey: "MCowBQYDK2VwAyEAJH6tPGKF1ZCMP3DUdpiin7rDLmVb_9A1zyllxaU6cjg"
// }
```

### `verifyQRDate`

Verify that the signature on a signed QR Date string is valid.

```ts
import { verifyQRDate, generateKeys } from 'qrdate';

const qrDate = verifyQRDate({
  signature: "x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA", 
  timestamp: 1646109781467,
  salt: bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI,
  privateKey: `-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIDgQtOtTyj6rlKFp2+qwlrgzGeA2sxJz4agZKzsCFGKw\n-----END PRIVATE KEY-----`; // or a Buffer or KeyObject
});

// OR

const qrDate = verifyQRDate({
  signature: "x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA", 
  timestamp: 1646109781467,
  salt: bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI,
  publicKey: `-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAJH6tPGKF1ZCMP3DUdpiin7rDLmVb/9A1zyllxaU6cjg=\n-----END PUBLIC KEY-----`; // or a Buffer or KeyObject
});

console.log(valid);
// boolean ---^
```
