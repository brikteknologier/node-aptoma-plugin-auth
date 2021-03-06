/**
 * Manually translated from PHP:
 * https://github.com/aptoma/no.aptoma.plugin-api/blob/master/php/auth.php
 *
 * The original PHP version's encryption was based on Rijndael-128 CBC
 * via MCrypt.  This has for convenience been replaced with the
 * compatible AES-256 CBC from OpenSSL, which is bundled with NodeJS
 * and thus avoids an extra dependency.
 */

var crypto = require('crypto');
var url = require('url');

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
  var keyBuf = cutKeyBuffer(key);

  function determineKey() {
    var appUrl = url.parse(_appUrl, false, true);
    var port = appUrl.port || 80;
    return _key + appUrl.protocol + '//' + appUrl.hostname + ':' + port;
  }

  /**
   * Makes the a key a certain length
   */
  function cutKeyBuffer(key) {
    var keySha1 = crypto.createHash('sha1').update(key).digest('hex');
    var keyHex = keySha1.slice(0, 32);
    return new Buffer(keyHex);
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

    return {
      'signature': outgoing.data,
      'iv': outgoing.iv
    };
  }

  /**
   * Decrypts the given data block using the given key and IV
   * Expects the result to be a valid JSON block
   */
  function decryptAppData(data, iv) {
    // Intialize encryption
    var decipher = crypto.createDecipheriv('AES-256-CBC', keyBuf, iv);
    decipher.setAutoPadding(false);

    // Decrypt data
    var decrypted = decipher.update(data);
    decrypted += decipher.final();
    decrypted = decrypted.toString().replace(/\x00/g, '');

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
   * data (base64-encoded) and the used IV
   */
  function encryptAppData(data) {
    // Create the IV
    var iv = crypto.randomBytes(8).toString('hex');

    // Intialize encryption
    var cipher = crypto.createCipheriv('AES-256-CBC', keyBuf, iv);
    cipher.setAutoPadding(false);

    // Prepare data
    var plainText = new Buffer(JSON.stringify(data));

    // Encrypt data
    var encrypted = cipher.update(plainText, null, 'binary');
    for (var i = plainText.length % 16; i < 16; i++)
      encrypted += cipher.update('\0', 'binary', 'binary');
    encrypted += cipher.final('binary');

    return {
      iv: iv,
      data: new Buffer(encrypted, 'binary').toString('base64')
    };
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
