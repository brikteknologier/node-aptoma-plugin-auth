var APPNAME = 'example-app';
var KEY = 'DrPublish';
var APPURL = 'http://drpubapp.example.com/';

var express = require('express');
var app = express();
var handlerInit = require(__dirname + '/../auth');

app.use(express.static(__dirname + '/static'));
var handler = handlerInit(APPNAME, KEY, APPURL);
app.get('/auth', handler);

app.listen(8123);
