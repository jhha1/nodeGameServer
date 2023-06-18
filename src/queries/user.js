module.exports = {
    selectByUserId: function (userId) {
        return `SELECT user_id, shard_id, nickname, is_leave, last_login_dt, created_dt FROM User WHERE user_id = '${userId}';`;
    },
    insert: function (user_id, shard_id, nickname, last_login_dt, created_dt) {
        return `INSERT INTO User (user_id, shard_id, nickname, last_login_dt, created_dt) 
        VALUES ('${user_id}', '${shard_id}', '${nickname}', '${last_login_dt}', ${created_dt});`;  
    },
}