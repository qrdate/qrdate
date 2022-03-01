<a href="https://qrdate.org" target="_blank">![QR Date - Signed timestamps inside QR codes for verifying dates in realtime reporting.](https://user-images.githubusercontent.com/55932282/156223938-b229f473-476b-4376-bd2f-08d1746457bf.png)</a>


# QR Date (QR Time)

This is the reference implementation for the first version of [QR Date](https://qrdate.org), a signed timestamp inside a QR code that you can use to verify the date in (near-) real-time photojournalism, photo/video uploads and live streams.

### What is it for?

QR Date is a specification for verifying the date a photo or video was taken by having a trusted third party sign timestamps and encode them in a QR code visible in the frame. It can be used to verify the date in rapidly disseminated photo- or videography where a large amount of people will be able to see and verify the code shown within a reasonable time from publishing, which is measured in seconds to minutes today.

It provides a kind of social proof of other people observing a clock, given to you by a *trusted third party*, that you are holding up in a photo instead of writing the date on a piece of paper. It does *not* work against the past (taking snapshots of the produced codes and using them later) - the point is to try to guard media against the *future*. Therefore, unseen QR Dates are meant to have a lifespan after which they should be considered tainted.

**The need to use something like QR Date arises, when..**

1. You have a photograph or video you want to make and send to many people, rapidly.
2. You need to prove beyond a reasonable doubt that the event or subject you are photographing *happened or existed* at the moment you took the photo or video.

The traditional method is to write the current date on a piece of paper or, if one is available, hold up a newspaper from the day. Besides requiring materials, neither does not *definitely* verify that the event in the picture *happened right now*. It is impossible to validate past events in this way, but if you include a timestamp that was signed by a trusted third party *within your photo, in a reasonably non-fakeable way*, it is then provable beyond a reasonable doubt that you indeed are **photographing the near-present**.

When disseminated rapidly to hundreds or thousands of people, a QR Date displayed in a photo or video can constitute social proof — you can say "thousands of people confirmed this individually" while feasibly expecting that the code could not have been faked within the short period of time between you taking the photo, distributing it, and others confirming the code contained in it.

The physical act of using a QR Date involves either:

1. Holding up a smartphone or tablet in view of the camera, displaying the QR Date from a website or broadcast TV (in case a TV station would be broadcasting it), or
2. Holding up a printed version of the QR Date in a photo or video, replacing regular written text on paper.

It is also possible to implement QR Dates as a middleman service for app backends, which would then be acting as the trusted third party.

For example, when uploading photos through a messenger service, the service can sign the photos upon upload date and superimpose the QR Date onto it. Any further uploads to date the photo again would have to either crop the code out or otherwise mangle it so much that it would raise suspicion. For videos, the QR Date can be superimposed as either moving around in the frame, switch places, or other motion to make it harder to superimpose another code later.

### How does it work?

The principle is very simple. A timestamp is generated on the server and attached to a bit of randomness. They are then signed using a private key to produce a verification signature. The QR code that you're seeing contains a URL with the timestamp, the bit of randomness, and the signature. The signature can also be verified using a separately published public key. Technical explanation follows.

### Types of QR Dates

There are two types; Dynamic and Static.

- Dynamic is for when you're hosting a verification page
- Static is for QR Dates that need to be verified without another connection to your site

You can find the exact spec for both below the usage.

## Using this library

**This library does NOT generate the QR code image for you!** It only helps you conform to the QR Date spec. You need to feed the output of the date creation function (specifically, the `url` value) into a QR code image generator to get the correct output image.

**This is an ES module written in TypeScript.** CommonJS is *not* supported. The minimum NodeJS version is 14.19.0.

### Installation

```sh
npm i --save qrdate
```

## API

### `createDynamicQRDate(params: { privateKey: KeyLike; urlBase?: string; formatter?: CustomQRDateURLFormatter; }): DynamicQRDate`

Create a Dynamic QR Date spec object with web-based verification. Use this function to create QR Date that users can verify on your website. The client flow is:

1. User requests your website.
2. Your server calls `createDynamicQRDate`, returning the results to the client.
3. Draw the QR code on the client from the `url` property on the return object.

#### Input object

You need to specify two of these when calling `createDynamicQRDate()`

Attribute    | Type                     | Required                      | Explanation
-------------|--------------------------|-------------------------------|--------------------
`params.urlBase`    | string                   | Either `params.urlBase` or `params.formatter` are required. If `params.formatter` is defined, `params.urlBase` is not used.  | Your verification base URL - do NOT change this once you have decided on it without some kind of redirection in place! All your QR codes will start with the base URL.
`params.formatter`  | CustomQRDateURLFormatter | See above | A formatter
`params.privateKey` | KeyLike (string / Buffer / KeyObject) | Yes | Your ed25519 private key. The key *can* be base64url encoded, and the function will try to parse it for you.

#### Output object

All the return values are designed to be safe to be shown to the client:

Attribute    | Type                     | Explanation
-------------|--------------------------|---------------------
`timestamp`  | number                   | UNIX timestamp
`url`        | string                   | The text to render into a QR code.
`signature`  | string                   | Base64url-encoded signed timestamp

#### Example

```ts
import { createDynamicQRDate } from 'qrdate';

const urlBase = 'https://localhost/v';
const privateKey = `-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIDgQtOtTyj6rlKFp2+qwlrgzGeA2sxJz4agZKzsCFGKw\n-----END PRIVATE KEY-----`;

const qrDateDynamic = createDynamicQRDate({
  urlBase,
  privateKey, // or a Buffer or KeyObject
});

console.log(qrDateDynamic);
// -----------^
// {
//   timestamp: 1646109781467,
//   url: "https://qrdate.org/v?s=x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA&t=1646109781467",
//   signature: "x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA",
// }

```

### `createStaticQRDate(privateKey: KeyLike): StaticQRDate`

Create a Static QR Date spec object with offline verification. Use this function to create QR Date that users can verify *without* your website using a certificate chain. The client flow is:

For users wanting to display codes:

1. User requests your website.
2. Your server calls `createStaticQRDate`, returning the results to the client.
3. Draw the QR code on the client from the `url` property on the return object.

For users wanting to verify the codes:

1. You publish your public key either in a public or private place, depending on what sort of a setup you wish.
2. The user inserts your public key into their key store, with the store creating a SHA256 hash of it as the fingerprint.
3. The user can verify the signature by looking up the public key in their keystore using the fingerprint supplied in the QR Date and use that to perform the verification.

Attribute    | Type                     | Required                      | Explanation
-------------|--------------------------|-------------------------------|--------------------
`privateKey` | KeyLike (string / Buffer / KeyObject) | Yes | Your ed25519 private key. The key *can* be base64url encoded, and the function will try to parse it for you.

#### Output object

All the return values are designed to be safe to be shown to the client:

Attribute     | Type                     | Explanation
--------------|--------------------------|---------------------
`timestamp`   | number                   | UNIX timestamp
`url`         | string                   | The text to render into a QR code.
`signature`   | string                   | Base64url-encoded signed timestamp
`fingerprint` | string                   | Base64url-encoded fingerprint hashed from your public key

#### Example


```ts
import { createStaticQRDate } from 'qrdate';

const privateKey = `-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIDgQtOtTyj6rlKFp2+qwlrgzGeA2sxJz4agZKzsCFGKw\n-----END PRIVATE KEY-----`;

const qrDateStatic = createStaticQRDate({
  privateKey // or a Buffer or KeyObject
});

console.log(qrDateStatic);
// -----------^
// {
//   timestamp: 1646142017145,
//   url: 'qrdate://v?s=tyYD957Q3i6TGUJi7-xzypIl4Be6mM8Jqvc2-nAswRuTadlCEELtMnXWqykcpzneuXJa772vNXc3T0pQFcPBBw&t=1646142017145&f=soyUshlcjtJZ8LQVqu4_ObCykgpFN2EUmfoESVaReiE',
//   signature: 'tyYD957Q3i6TGUJi7-xzypIl4Be6mM8Jqvc2-nAswRuTadlCEELtMnXWqykcpzneuXJa772vNXc3T0pQFcPBBw',
//   fingerprint: 'soyUshlcjtJZ8LQVqu4_ObCykgpFN2EUmfoESVaReiE'
// }
//
// In the above url, `v` has been added after qrdate:// automatically.
// If you are making your own implementation, be sure to include the `v` for compatibility.
// A static URL should always start with `qrdate://v` to keep it universal and not to clutter the produced QR code further.
// Please see the spec for V1 Static URLs for further info.
//
```

### `verifyDynamicQRDate(params: { signature: string; timestamp: string|number; publicKey: KeyLike }): boolean`

Verify that the signature on a signed dynamic QR Date timestamp is valid.

Attribute    | Type                                        | Required | Explanation
-------------|---------------------------------------------|----------|--------------------
`params.signature`  | string                               | Yes      | Signature passed from client
`params.timestamp`  | number / string                      | Yes      | Signature passed from client
`params.publicKey` | KeyLike (string / Buffer / KeyObject) | Yes      | Your ed25519 public key. The key *can* be base64url encoded, and the function will try to parse it for you.

#### Example

```ts
import { verifyDynamicQRDate } from 'qrdate';

const valid = verifyDynamicQRDate({
  signature: "x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA", 
  timestamp: 1646109781467,
  publicKey: `-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAJH6tPGKF1ZCMP3DUdpiin7rDLmVb/9A1zyllxaU6cjg=\n-----END PUBLIC KEY-----`; // or a Buffer or KeyObject
});

console.log(valid);
// boolean ---^
```

### `verifyStaticQRDate(params: { signature: string; timestamp: string|number; fingerprint: string; publicKey: KeyLike }): boolean`

Verify that the signature on a signed static QR Date timestamp is valid.

Attribute            | Type                                  | Required                      | Explanation
---------------------|---------------------------------------|-------------------------------|--------------------
`params.signature`   | string                                | Yes                           | Signature passed from qrdate:// URL
`params.timestamp`   | number / string                       | Yes                           | Timestamp passed from qrdate:// URL
`params.fingerprint` | string                                | Yes                           | Public key fingerprint passed from qrdate:// URL
`params.publicKey`   | KeyLike (string / Buffer / KeyObject) | Yes                           | Ed25519 public key corresponding to the fingerprint. The key *can* be base64url encoded, and the function will try to parse it for you.

#### Example

```ts
import { verifyStaticQRDate } from 'qrdate';

const valid = verifyDynamicQRDate({
  timestamp: 1646147373409,
  signature: 'SARv4c8pJYVxqEK8BCcPy8dgXEAkyWDPRAhvT70RotaHgnko1BkBh-maNzqAicDzqcz7EV65OwLDno7HWT1iAg',
  fingerprint: 'soyUshlcjtJZ8LQVqu4_ObCykgpFN2EUmfoESVaReiE',
  publicKey: `-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAyHAuTvSG6RZaKGOfzI6iZ8NVaebZpFAFEN/85o6c3nE=\n-----END PUBLIC KEY-----` // or Buffer or KeyObject
});

console.log(valid);
// boolean ---^
```

### `generateKeys(): { privateKey: string|KeyObject; publicKey: string|KeyObject }`

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

## Dynamic QR Date v1 spec

Use this spec when you're hosting a verification page for QR Dates on your server. Anyone scanning a QR Date will load your website for verification. The public key will not be included in the generated URL, so it can be shorter.

```
https://qrdate.org/v?s=twBgNlHANnq5BX1IJb6qAWyfeQkARwIFGiOysZAAIcyba08piw30358RiK9GmCbl3LfloNxoUfsdt6eeKJkyDQ&t=1646148299484
```

### Important security considerations

**DO NOT LEAK PRIVATE INFORMATION BY STORING ANY SORT OF STATE IN THE URL. DO NOT STORE IP ADDRESSES OF PEOPLE WHO REQUEST DATES.** It is imperative that you stick to the spec. Do not create any sort of unintended tracking mechanisms by adding your own parameters or state.

### Required query parameters

The query parameters are the contract for parsing the URL. You need to provide these for the URL to be considered a QR Date.

Parameter | Explanation
----------|--------------
`t`       | Timestamp (UNIX)
`s`       | Signature (ed25519)

### Format the beginning of the URL

**Do not point to qrdate.org in your implementation**, as we do not host your private key! `https://qrdate.org/v` is only a placeholder for your domain and hosting setup.

## Static QR Date v1 spec

Use this spec when you want to use QR Date without hosting a separate verification page. When using `createQRDate` from this package, use the base `qrdate://` and you will a URL in the correct format:

```
qrdate://v?s=d4pOIiiOpOv5q0FPaPUYgZDJERwpZ5JKYOex3nOKLCgMWUL9t3VKCHAdRZJs4a6x5HVTeMaSfSyVi4hK3GhCDQ&t=1646148299487&f=soyUshlcjtJZ8LQVqu4_ObCykgpFN2EUmfoESVaReiE
```

### Don't add your own parameters in this one either!

Sticking to the spec means you're only doing the bare necessary thing- signing a timestamp, and not leaking someone's private information by mistake.

### Required origin and pathname

**All** v1 static URLs should start with `qrdate://v` and then immediately proceed to the query parameters. Do **not** add your own parameters or change the URL format in any way. The order of the query parameters does not matter.

### Required query parameters

Parameter | Explanation
----------|--------------
`t`       | Timestamp (UNIX)
`s`       | Signature
`f`       | Public key fingerprint (SHA256) - **NOT** the public key

This type of URL can be parsed without external parties as it contains both the signature and public key **fingerprint** (not the public key itself), which can be compared against a key store that you need to implement in a client application consuming these URLs. Therefore, for example, a system that generates QR Dates every minute through a script to serve on a static website is possible, without needing further web-based validation as long as the user has added the public key (that you must publish elsewhere) into their trusted list. For automatic validation, the consuming client must then implement some sort of a key store, which is outside the scope of this package.

## Contact

- Website: [https://QRDate.org](https://QRDate.org)
- Twitter: [@QRDate](https://twitter.com/QRDate)

## License

We welcome contributions and people adopting this idea into other languages and environments, but ask to conform to the license and QR Date specification to keep things interoperable.

### THIS LIBRARY IS LICENSED UNDER:

MIT &copy; QRDate.org + contributors

### THE QR DATE SPEC IS LICENSED UNDER:

CC Attribution 4.0 International (CC BY 4.0) &copy; QRDate.org + contributors
