const { FingerprintGenerator } = require('fingerprint-generator');

let get_Fingerprint = async function(){
  const fingerprintGenerator = new FingerprintGenerator({
    browsers: ['chrome'],
    devices: ['desktop'],
    operatingSystems: ['windows'],
  });

  const fingerprint = fingerprintGenerator.getFingerprint({
    locales: ['en-US', 'en'],
  });

  return JSON.stringify(fingerprint);
};

module.exports = get_Fingerprint;
