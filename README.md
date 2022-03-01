# QR Date

This is the reference TS implementation for QR Date, a signed date inside a QR code.

### What is it for?

This is a proof-of-concept for verifying the date in (near-) real-time reporting and live streams. It does not work against the past (taking pictures of the code and using them later) but could be used to verify the date in rapidly disseminated information.

### How does it work?

A timestamp is generated on the server and attached to a bit of randomness. They are then signed using a private key to produce a verification signature. The QR code contains a URL with the timestamp, the bit of randomness, and the signature. The signature can also be verified using a separately published public key.

We welcome contributions and people adopting this idea into other languages and environments, but ask to conform to the QR Date spec below. We recommend using ed25519 signature keys. There is a convenience function (`generateKeys`) exposed that you can use to generate your own.

For more information, please see [qrdate.org](https://qrdate.org).

## QR Date spec: With web hosting

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

## QR Date spec: Without web hosting

There is no parser for a `qrdate://` type URI yet, but this is the decided form as you need to include the public key:

```
qrdate://v?s=x9hKYrJH0e0BPyVqwnKMAMmxEudkvJccqzjHgaheWFJEd86rW_XdwCKZid7k0teMq7Ygp1PfAJhnT64WcyD6CA&t=1646109781467&e=bsCmuR7InOXGSns6vHYEzpJFvLhwqBYVu1g2-aVK-lI&p=MCowBQYDK2VwAyEAJH6tPGKF1ZCMP3DUdpiin7rDLmVb_9A1zyllxaU6cjg
```

Parameter | Type   | Explanation
----------|--------|-------------
`t`       | number | Timestamp (UNIX)
`s`       | string | Signature
`e`       | string | Random salt (32 bytes by default) - `e` for entropy
`p`       | string | Public key to use
