module.exports = {
    select: `SELECT user_id, kind, item_id, count FROM ItemStackable WHERE user_id = ?;`,
    selectWithKind: `SELECT user_id, kind, item_id, count FROM ItemStackable WHERE user_id = ? AND kind = ?;`,
    selectWithId: `SELECT user_id, kind, item_id, count FROM ItemStackable WHERE user_id = ? AND item_id = ?;`,
    insert: `INSERT INTO ItemStackable (user_id, kind, item_id, count) VALUES (?, ? ,?, ?)`,
    update: `UPDATE ItemStackable SET count = ? WHERE user_id = ? AND item_id = ?`,
    insertMany: (rowCount) => {
        let q = `INSERT INTO ItemStackable (user_id, kind, item_id, count) VALUES `;
        for (let i = 0; i < rowCount; i++) {
            q += `(?, ?, ?, ?),`;
        }
        q = q.slice(0, -1) + ';';
        return q;
    }
}
