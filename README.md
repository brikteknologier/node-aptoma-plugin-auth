# node-aptoma-plugin-auth

This is a NodeJS adaptation of the Aptoma Plugin API's auth module,
originally implemented in PHP.

It is exposed as an `express` compatible request handler.

## Example usage

```
var app = require('express')();
var auth = require('node-aptoma-plugin-auth');

app.get('/auth', auth(
  'example-app',
  'DrPublish',
  'http://drpubapp.example.com/'
));

app.listen(8080);
```

## Prerequisites

The `mcrypt` library is used for encryption and decryption, and must
be installed for this module to work.

Example install command for Ubuntu:

```
apt-get install libmcrypt4 libmcrypt-dev
```
