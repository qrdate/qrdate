# QR Date

This is the reference TS implementation for [QR Date](https://qrdate.org), a trusted timestamp inside a QR code that you can use to verify the date in (near-) real-time photojournalism, photo/video uploads, and live streams.

### What is it for?

QR Date is a specification for verifying the date a photo or video was taken by having a trusted third party sign timestamps and encode them in a QR code visible in the frame. It can be used to verify the date in rapidly disseminated photo- or videography where a large amount of people will be able to see and verify the code shown within a reasonable time from publishing (which is measured in seconds to minutes today). It therefore aims to provide a kind of social proof of other people observing a clock, borrowed from a trusted third party, that you are holding up in a photo instead of writing the date on a piece of paper. It does not work against the past (taking snapshots of the produced codes and using them later) - the point is to try to guard media against the *future*.

**The need to use something like QR Date arises, when..**

1. You have a photograph or video you want to make and send to many people, rapidly.
2. You need to prove beyond a reasonable doubt that the event or subject you are photographing *happened or existed* at the moment you took the photo or video.

The traditional method is to write the current date on a piece of paper or, if one is available, hold up a newspaper from the day. Besides requiring materials, neither does not *definitely* verify that the event in the picture *happened right now*. It is impossible to validate past events in this way, but if you include a timestamp that was signed by a trusted third party *within your photo, in a reasonably non-fakeable way*, it is then verifiable that you are **photographing the near-present**.

When disseminated rapidly to hundreds or thousands of people, a QR Date displayed in a photo or video can constitute social proof — you can say "thousands of people confirmed this individually" while feasibly expecting that the code could not have been faked within the short period of time between you taking the photo, distributing it, and others confirming the code contained in it.

The physical act of using a QR Date involves either:

1. Holding up a smartphone or tablet in view of the camera, displaying the QR Date from a website or broadcast TV (in case a TV station would be broadcasting it), or
2. Holding up a printed version of the QR Date in a photo or video, replacing regular written text on paper.

It is also possible to implement QR Dates as a middleman service for apps, which would then be acting as the trusted third party; for example, when uploading photos through a messenger service, the service can sign the photos upon upload date and superimpose the QR Date onto it. Any further uploads to date the photo again would have to either crop the code out or otherwise mangle it so much that it would raise suspicion. For videos, the QR Date can be superimposed as either moving around in the frame, switch places, or other motion to make it harder to superimpose another code later.

### How does it work?

The principle is very simple. A timestamp is generated on the server and attached to a bit of randomness. They are then signed using a private key to produce a verification signature. The QR code that you're seeing contains a URL with the timestamp, the bit of randomness, and the signature. The signature can also be verified using a separately published public key. Technical explanation follows.

### Types of QR Dates

There are two types; Dynamic and Static.

- Dynamic is for when you're hosting a verification page
- Static is for QR Dates that need to be verified without another connection to your site

You can find the exact spec for both below the usage.

## Using this library

### Installation

```sh
npm i --save qrdate
```

### `createQRDate`

Create a QR Date spec object. Pass the generated `url` property that you get back to a QR code generator and display to user.

#### Example

```ts
import { createQRDate } from 'qrdate';

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

#### Example

```ts
import { verifyQRDate } from 'qrdate';

const valid = verifyQRDate({
  signature: "x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA", 
  timestamp: 1646109781467,
  salt: bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI,
  privateKey: `-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIDgQtOtTyj6rlKFp2+qwlrgzGeA2sxJz4agZKzsCFGKw\n-----END PRIVATE KEY-----`; // or a Buffer or KeyObject
});

// OR

const valid = verifyQRDate({
  signature: "x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA", 
  timestamp: 1646109781467,
  salt: bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI,
  publicKey: `-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAJH6tPGKF1ZCMP3DUdpiin7rDLmVb/9A1zyllxaU6cjg=\n-----END PUBLIC KEY-----`; // or a Buffer or KeyObject
});

console.log(valid);
// boolean ---^
```

### `generateKeys`

Use to generate a pair of keys. You can use only the `privateKey` to interact with the library - any public keys that are required can be derived from it. **Store your private key in a safe place!** When used with QR Date it is essentially *a key to the future*.

#### Example

```ts
import { generateKeys } from 'qrdate';
const { privateKey, publicKey } = generateKeys(true);
// true will return keys as string (default)
// false returns them as KeyObjects
console.log(privateKey); // -----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----
console.log(publicKey); // -----BEGIN PUBLIC KEY----- ... -----END PUBLIC KEY-----
```


## QR Date V1 Dynamic spec

Use this spec when you're hosting a verification page for QR Dates on your server. Anyone scanning a QR Date will load your website for verification. The public key will not be included in the generated URL, so it can be shorter.

```
https://qrdate.org/v?s=x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA&t=1646109781467&e=bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI
```

### Required query parameters

The query parameters are the contract for parsing the URL. You need to provide these for the URL to be considered a QR Date.

Parameter | Explanation
----------|--------------
`t`       | Timestamp (UNIX)
`s`       | Signature (ed25519)
`e`       | Random salt (32 bytes by default) - `e` for entropy

### Format the beginning of the URL

**Do not point to qrdate.org in your implementation**, as we do not host your private key! `https://qrdate.org/v` is only a placeholder for your domain and hosting setup.

## QR Date V1 Static spec

Use this spec when you want to use QR Date without hosting a separate verification page. When using `createQRDate` from this package, use the URL base `qrdate://` and you will a URI in the correct format:

```
qrdate://v?s=x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA&t=1646109781467&e=bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI&p=MCowBQYDK2VwAyEAJH6tPGKF1ZCMP3DUdpiin7rDLmVb_9A1zyllxaU6cjg
```

### Required query parameters

Parameter | Explanation
----------|--------------
`t`       | Timestamp (UNIX)
`s`       | Signature
`e`       | Random salt (32 bytes by default) - `e` for entropy
`p`       | Public key to use

This type of URL can be parsed without external parties as it contains both the signature and public key. Therefore, for example, a system that generates QR Dates every minute through a script to serve on a static website is possible.

## License

We welcome contributions and people adopting this idea into other languages and environments, but ask to conform to the license and QR Date specification to keep things interoperable.

### THIS LIBRARY IS LICENSED UNDER:

MIT &copy; [qrdate.org](https://qrdate.org) + contributors

### THE QR DATE SPEC IS LICENSED UNDER:

CC Attribution 4.0 International (CC BY 4.0) &copy; [qrdate.org](https://qrdate.org) + contributors
