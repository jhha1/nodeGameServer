module.exports = {
    select: function (platformType, platformId) {
        return `SELECT seq, platform_type, platform_id, user_id, device_type, is_leave, shard_id FROM Account WHERE platform_type = '${platformType}' AND platform_id = '${platformId}';`;   
    },
    insert: function (platformType, platformId, userId, deviceType, shardId) {
        return `INSERT INTO Account (platform_type, platform_id, user_id, device_type, shard_id) 
        VALUES ('${platformType}', '${platformId}', '${userId}', '${deviceType}', ${shardId});`;  
    },
}