module.exports = {
    selectByPlatformId: function (platformId) {
        return `SELECT seq, platformId, userId, shardId FROM Account WHERE platformId = '${platformId}';`;  // seq, platformType, platformId, userId, deviceId, shardId 
    },
    insert: function (platformType, platformId, userId, deviceId, shardId) {
        return `INSERT INTO Account (platformType, platformId, userId, deviceId, shardId) 
        VALUES ('${platformType}', '${platformId}', '${userId}', '${deviceId}', ${shardId});`;  // seq, platformType, platformId, userId, deviceId, shardId 
    },
}