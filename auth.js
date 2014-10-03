var aptomaAppInit = require('./src/aptomaApp');

module.exports = function init(appName, key, _pluginUrl) {
  // If no pluginUrl is supplied, create the default one.
  var pluginUrl = _pluginUrl || function(req) {
    return 'http://' + (req.hostname || req.host) + req.path;
  };
  // If a non-function pluginUrl is supplied, wrap it in a function.
  if (typeof pluginUrl != 'function')
    pluginUrl = function() { return _pluginUrl; };
  
  return function getHandler(req, res) {
    var aptomaApp = aptomaAppInit(appName, key, pluginUrl(req));

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
