module.exports = {
    select: `SELECT user_id, gacha_id, level, point FROM GachaLevel WHERE user_id = ?;`,
    selectWithGachaId: `SELECT user_id, gacha_id, level, point FROM GachaLevel WHERE user_id = ? AND gacha_id = ?;`,
    insert: `INSERT INTO GachaLevel (user_id, gacha_id, level, point) VALUES (?, ? ,?, ?)`,
    update: `UPDATE GachaLevel SET level = ?, point = ? WHERE user_id = ? AND gacha_id = ?`,
}
