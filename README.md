# node-aptoma-plugin-auth

This is a NodeJS adaptation of the
[Aptoma Plugin API](https://github.com/aptoma/no.aptoma.plugin-api)'s auth module,
originally implemented in PHP.

It is exposed as an `express` compatible request handler.  The
intention is that you attach it to any endpoint you wish.

For more details, see the original module.

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
