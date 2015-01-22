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
  'DrPublish'
));

app.listen(8080);
```

## Documentation

The module `node-aptoma-plugin-auth` provides an initializer
function. Let's call it `auth`, as in:

```
var auth = require('node-aptoma-plugin-auth');
```

`auth` takes 3 parameters:

* `appName`
* `key`
* `pluginUrl` (optional)

And returns an `express` compatible GET request hander `function(req,
res)` that you can plug in anywhere.  See quick example above.

The `pluginUrl` parameter, if supplied, can be a `string` or a
`function (req)` that outputs the URL after being fed a request
object.  If omitted, the resulting handler will "autodetect" and
assume that whatever URL it is being called as is the plugin URL.
