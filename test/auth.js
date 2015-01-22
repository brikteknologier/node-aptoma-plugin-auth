var appInit = require('../src/aptomaApp');
var assert = require('assert');

describe("node-aptoma-auth", function() {
  var app = null;
  var AUTH = "VwrfUNpTSILU4pB0gindSIc1kcZfqqpppY3Z67h4Vv YeWmhSXXRYnjUXWcJGW/DKvDsPoDUzpNeCnFxXsmn3UanSiYE06Wfz0EYP6pIIZFh7E8lRJyy7Fc3Du5I22sx2GmjkQej5JK0NyMk4IQiUGr17tyandwodaDkPtsGSijnj9X824YuGHhX4AsDOTCEVP26bz18bEXwTymPanbpkq2AIQ0oZ7msZ0TM44QP7wmtk9ZDsTHWtEyY2aGP6mCzXtqNwPDo9EGoiHAex i6ea/gNsRfd63kLZAKhfKVHvav3ysf1iB82x5NdcGXXbaPKVPiEnNm0 tHcg2H Zq3BVKNwRWwJ96DSs4BpDQDZT2ExZ6r/DZ0jFzzvmmOhhxClqqwDyp0BsSl/5DFofIlz2pXuc7qkSqRICs2q8SY14bq7cl2ze2GxuP4cqm5v5io5TVrVm9zXeH34SRBOv3s/Sp6YaNqG lNBXGT0X3QDg3gy SNqo5ZeEttoheZNI3Wo5Rklxxd7zkoeSEnK3vtKM64dZovk3ZlffZaDxymsVP5niggg8a0E49Zh/MjU28aLiyg9t7N7iG W4vv92BbVEPRre5AkfJxGcQyxQum2BhNgpBFRACFMt4lOGdvquT9";
  var IV = "bddf86c1af538c02";

  beforeEach(function() {
    app = appInit(
      'brik-video-test',
      'DrPublish',
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
});
