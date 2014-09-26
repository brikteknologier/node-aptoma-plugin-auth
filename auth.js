var aptomaAppInit = require('./src/aptomaApp');

module.exports = function init(appName, key, pluginUrl) {
  var aptomaApp = aptomaAppInit(appName, key, pluginUrl);

  return function getHandler(req, res) {
    var auth = req.query.auth;
    var iv = req.query.iv;
    var valid = aptomaApp.validate(auth, iv);
    if (valid) {
      var token = aptomaApp.getAuthenticationToken();
      res.json(token);
    } else {
      res.send(400, 'invalid auth ❜_❜');
    }
  };
};
