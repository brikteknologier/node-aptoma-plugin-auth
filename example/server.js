var app = require('express')();
var auth = require(__dirname + '/../auth');

app.get('/auth', auth(
  'example-app',
  'DrPublish',
  'http://drpubapp.example.com/'
));

app.listen(8080);
