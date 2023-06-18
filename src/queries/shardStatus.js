module.exports = {
    select: function () {
        return `SELECT shard_id, user_count FROM ShardStatus;`;   
    },
    insert: function (shardId, userCount) {
        return `INSERT INTO ShardStatus (shard_id, user_count) VALUES (${shardId}, ${userCount})`; 
    },
    increaseUserCount: function (shardId) {
        return `UPDATE ShardStatus SET user_count = user_count + 1 WHERE shard_id = ${shardId}`; 
    },
}