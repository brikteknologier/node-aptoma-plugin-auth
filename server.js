var express = require('express');
var app = express();
var aptomaAppInit = require('./src/auth');

app.use(express.static(__dirname + '/static'));

app.get('/auth', function(req, res) {
  var aptomaApp = aptomaAppInit('brik-video', 'DrPublish', 'http://drpubapp.brik.no/');
  var auth = req.query.auth;
  var iv = req.query.iv;
  var token = aptomaApp.validate(auth, iv);
  res.json(token);
});

app.listen(8123);
