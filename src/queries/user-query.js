module.exports = {
    selectById: function (id) {
        return `SELECT id, uuid, nickname, lastLoginAt FROM users WHERE id = '${id}';`;
    },
}