/**
 * Manually translated from PHP:
 * https://github.com/aptoma/no.aptoma.plugin-api/blob/master/php/auth.php
 */

var crypto = require('crypto');
var url = require('url');
var mcrypt = require('mcrypt');

/**
 * Parameters:
 * name    - The app's name as defined in DrPublish.
 * _key    - The API key for this app.
 * _appUrl - The scheme, host and port of the app. Port defaults to 80.
 * test    - Intentionally undocumented test config object.
 */
module.exports = function apptomaApp(name, _key, _appUrl, test) {
  test = test || {};
  var key = determineKey();

  function determineKey() {
    var appUrl = url.parse(_appUrl, false, true);
    var port = appUrl.port || 80;
    return _key + appUrl.protocol + '//' + appUrl.hostname + ':' + port;
  }

  /**
   * Returns false on failure, and an object containing the following on
   * success:
   * drpublish   - URL to DrPublish installation
   * time        - When the signature was created
   * app         - Name of the app
   * user        - The username of the current user
   * publication - The currently active publication ID
   * 
   * Parameters:
   * auth - The authentication token received from DrPublish
   * iv   - The IV received from DrPublish
   */
  function validate(auth, iv) {
    if (!auth || !iv)
      return false;

    // fix the conversion between + and ' ' that happens when passing stuff through an url
    var authFixed = auth.replace(/ /g, '+');
    var authDecoded = new Buffer(authFixed, 'base64');
    var incoming = decryptAppData(authDecoded, iv);

    if (incoming == null)
      return false;

    if (!test.allowReplayAttacks) {
      // Make sure we're not being replayed
      var timeNow = Math.floor(Date.now() / 1000);
      if (incoming.time == null || timeNow - incoming.time > 60)
        return false;
  }

    // Make sure the auth is for the correct app
    if (incoming.app == null || incoming.app != name)
      return false;

    // No need to expose the salt to the end user
    delete incoming.salt;
    
    return incoming;
  }

  /**
   * Creates an encrypted token with various information
   * about the app to be sent to the DrPublish API
   *
   * Returns an object containing two indexes that both
   * have to be sent to authenticate:
   *	signature: An encrypted string
   *	iv: An IV for the signature
   */
  function getAuthenticationToken() {
    var time = Math.floor(Date.now() / 1000);
    var outgoing = encryptAppData(
      { 'app': name,
        'time': time,
        'salt': getSalt(128) }
    );

    var base64Data = new Buffer(outgoing.data).toString('base64');
    return {
      'signature': base64Data,
      'iv': outgoing.iv
    };
  }

  /**
   * Decrypts the given data block using the given key and IV
   * Expects the result to be a valid JSON block
   */
  function decryptAppData(data, iv) {
    if (!~mcrypt.getAlgorithmNames().indexOf('rijndael-128'))
      throw new Error('MCrypt algorithm "rijndael-128" not found.')
    if (!~mcrypt.getModeNames().indexOf('cbc'))
      throw new Error('MCrypt mode "cbc" not found.')

    var td = new mcrypt.MCrypt('rijndael-128', 'cbc');

    // Intialize encryption
    td.open(cutKey(td, key), iv);

    // Decrypt data
    var decrypted = td.decrypt(data).toString().replace(/\x00/g, '');
    try {
      return JSON.parse(decrypted);
    } catch(_) {
      // Bad key, bad data or bad IV will result in random garbage,
      // which causes a SyntaxError when trying to parse it as JSON.
      return null;
    }
  }

  /**
   * Encrypts a JSON representation of the given data
   * using the given key, and returns both the encrypted
   * data and the used IV
   */
  function encryptAppData(data) {
    var td = new mcrypt.MCrypt('rijndael-128', 'cbc');
    
    // Create the IV and determine the keysize length
    var ivRaw = td.generateIv();
    var ivSha1 = crypto.createHash('sha1').update(ivRaw).digest('hex');
    var iv = ivSha1.slice(0, td.getIvSize());

    // Intialize encryption
    td.open(cutKey(td, key), iv);
    
    // Encrypt data
    var encrypted = td.encrypt(JSON.stringify(data));

    return {
      iv: iv,
      data: encrypted
    };
  }

  /**
   * Makes the a key a certain length
   */
  function cutKey(td, key) {
    var keySha1 = crypto.createHash('sha1').update(key).digest('hex');
    var keyHex = keySha1.slice(0, td.getKeySize());
    return new Buffer(keyHex);
  }

  /**
   * Generates a random salt of the given size
   */
  function getSalt(saltSize) {
    var bytes = crypto.randomBytes(Math.ceil(saltSize / 2));
    return bytes.toString('hex').slice(0, saltSize);
  }
  
  return {
    validate: validate,
    getAuthenticationToken: getAuthenticationToken
  };
}
