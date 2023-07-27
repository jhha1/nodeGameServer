const cache = require('./cache');
const log = require('../utils/logger'); 

async function initSession(req, Account) {
    req.session.platformType = Account.platform_type;
    req.session.platformId = Account.platform_id;
    req.session.userId = Account.user_id;
    req.session.shardId = Account.shard_id;
    req.session.deviceType = Account.device_type;
    req.session.isLeave = Account.is_leave;

    await cache.Game.set(getTokenKey(req.session.platformId), req.sessionID); // session token
}

async function deleteSession(token) {
    await cache.Game.del(getSessionKey(token));
}

async function checkSameToken(requestedToken, platformId) {
    const token = await cache.Game.get(getTokenKey(platformId));
    return requestedToken === token;
}

async function deleteToken(platformId) {
    await cache.Game.del(getTokenKey(platformId));
}

function getSessionKey(token) {
    return `sess:${token}`;
}

function getTokenKey(platformId) {
    return `sessid:${platformId}`;
}

exports.init = initSession;
exports.delete = deleteSession;
exports.checkSameToken = checkSameToken;
exports.deleteToken = deleteToken;
