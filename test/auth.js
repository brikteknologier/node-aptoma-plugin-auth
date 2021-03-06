var appInit = require('../src/aptomaApp');
var assert = require('assert');
var crypto = require('crypto');
var mcrypt = require('mcrypt');

describe("node-aptoma-auth", function() {
  var app = null;
  var APPKEY = 'DrPublish';
  var AUTH = "VwrfUNpTSILU4pB0gindSIc1kcZfqqpppY3Z67h4Vv YeWmhSXXRYnjUXWcJGW/DKvDsPoDUzpNeCnFxXsmn3UanSiYE06Wfz0EYP6pIIZFh7E8lRJyy7Fc3Du5I22sx2GmjkQej5JK0NyMk4IQiUGr17tyandwodaDkPtsGSijnj9X824YuGHhX4AsDOTCEVP26bz18bEXwTymPanbpkq2AIQ0oZ7msZ0TM44QP7wmtk9ZDsTHWtEyY2aGP6mCzXtqNwPDo9EGoiHAex i6ea/gNsRfd63kLZAKhfKVHvav3ysf1iB82x5NdcGXXbaPKVPiEnNm0 tHcg2H Zq3BVKNwRWwJ96DSs4BpDQDZT2ExZ6r/DZ0jFzzvmmOhhxClqqwDyp0BsSl/5DFofIlz2pXuc7qkSqRICs2q8SY14bq7cl2ze2GxuP4cqm5v5io5TVrVm9zXeH34SRBOv3s/Sp6YaNqG lNBXGT0X3QDg3gy SNqo5ZeEttoheZNI3Wo5Rklxxd7zkoeSEnK3vtKM64dZovk3ZlffZaDxymsVP5niggg8a0E49Zh/MjU28aLiyg9t7N7iG W4vv92BbVEPRre5AkfJxGcQyxQum2BhNgpBFRACFMt4lOGdvquT9";
  var IV = "bddf86c1af538c02";
  var keyBuf = (function() {
    var keyBase = APPKEY + 'http://drpubapp.brik.no:80';
    var keySha1 = crypto.createHash('sha1').update(keyBase).digest('hex');
    var keyHex = keySha1.slice(0, 32);
    return new Buffer(keyHex);
  })();

  beforeEach(function() {
    app = appInit(
      'brik-video-test',
      APPKEY,
      'http://drpubapp.brik.no/auth',
      { allowReplayAttacks: "Sure thing!" }
    );
  });

  it("exists", function() {
    assert(app);
  });

  it("can be asked to validate a valid auth request", function() {
    app.validate(AUTH, IV);
  });

  it("does not validate a replay attack", function() {
    var strictApp = appInit(
      'brik-video-test',
      'DrPublish',
      'http://drpubapp.brik.no/auth'
    );
    assert(!strictApp.validate(AUTH, IV));
  });

  it("does not validate given an incorrect key", function() {
    var wrongKeyApp = appInit(
      'brik-video-test',
      'PublishMD',
      'http://drpubapp.brik.no/auth',
      { allowReplayAttacks: "Sure, why not." }
    );
    assert(!wrongKeyApp.validate(AUTH, IV));
  });

  it("validates a valid auth request", function() {
    assert(app.validate(AUTH, IV));
  });

  it("decodes a valid auth request correctly", function() {
    var expected = {
      drpublish: 'http://hivolda.drpublish.aptoma.no:80/drpublish/ajax.php?do=get-signed-app-source&app=brik-video-test',
      time: 1421916536,
      app: 'brik-video-test',
      user: 'helge.holm@brik.no',
      publication: '2'
    };
    var actual = app.validate(AUTH, IV);
    assert.deepEqual(actual, expected);
  });

  it("can return a token object with a signature and IV", function() {
    var token = app.getAuthenticationToken();
    assert(token);
    assert(token.signature);
    assert(token.iv);
  });

  it("returns a valid token object (MCrypt)", function() {
    var token = app.getAuthenticationToken();
    var td = new mcrypt.MCrypt('rijndael-128', 'cbc');
    td.open(keyBuf, token.iv);
    var cipherText = new Buffer(token.signature, 'base64');
    var decrypted = td.decrypt(cipherText).toString().replace(/\x00/g, '');
    assert(decrypted);
    var tokenObject = JSON.parse(decrypted);
    assert.equal(tokenObject.app, 'brik-video-test');
    assert(tokenObject.time);
    assert(tokenObject.salt);
  });

  it("returns a valid token object (OpenSSL)", function() {
    var token = app.getAuthenticationToken();
    var ivBuf = new Buffer(token.iv);
    var decipher = crypto.createDecipheriv('AES-256-CBC', keyBuf, ivBuf);
    decipher.setAutoPadding(false);

    var cipherText = new Buffer(token.signature, 'base64');
    var plainText = decipher.update(token.signature, 'base64', 'utf8');
    plainText += decipher.final('utf8');

    assert(plainText);
    var tokenObject = JSON.parse(plainText.replace(/\x00/g, ''));
    assert.equal(tokenObject.app, 'brik-video-test');
    assert(tokenObject.time);
    assert(tokenObject.salt);
  });
});
