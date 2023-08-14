module.exports = {
    select: `SELECT user_id, kind, item_id, grade, level, piece_count FROM ItemUnique WHERE user_id = ?;`,
    insert: `INSERT INTO ItemUnique (user_id, kind, item_id, grade, level, piece_count) VALUES (?, ? ,?, ? ,?, ?)`,
    update: `UPDATE ItemUnique SET level = ?, piece_count = ? WHERE uid = ?`,
    insertMany: (rowCount) => {
        let q = `INSERT INTO ItemUnique (user_id, kind, item_id, grade, level, piece_count) VALUES `;
        for (let i = 0; i < rowCount; i++) {
            q += `(?, ? ,? ,?, ? ,?),`;
        }
        q = q.slice(0, -1) + ';';
        return q;
    }
}