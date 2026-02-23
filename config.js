require('dotenv').config();

const cloudDir = process.env.DIR;
const storageDir = __dirname + '/storage/';
const tags = ['Email', 'Gmail', 'Twitter', 'Metamask', 'Phantom', 'Discord'];
const baserowApiUrl = process.env.BASEROW_API_URL;
const baserowApiToken = process.env.BASEROW_API_TOKEN;
const baserowTableId = process.env.BASEROW_TABLE_ID;
const fpkey = process.env.FPKEY

module.exports.fpkey = fpkey;
module.exports.cloudDir = cloudDir;
module.exports.storageDir = storageDir;
module.exports.tags = tags;
module.exports.baserowURL = baserowApiUrl;
module.exports.baserowToken = baserowApiToken;
module.exports.baserowTableID = baserowTableId;
