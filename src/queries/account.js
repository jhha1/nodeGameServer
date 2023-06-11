module.exports = {
    selectByPlatformId: function (platformId) {
        return `SELECT seq, platformId, userId, shardId FROM Account WHERE platformId = '${platformId}';`;
    },
}