module.exports = {
    select: `SELECT user_id, currency_id, amount FROM Currency WHERE user_id = ?;`,
    insert: `INSERT INTO Currency (user_id, currency_id, amount) VALUES (?, ? ,?)`,
    update: `UPDATE Currency SET amount = ? WHERE user_id = ? AND currency_id = ?`,
    insertMany: (rowCount) => {
        let q = `INSERT INTO Currency (user_id, currency_id, amount) VALUES `;
        for (let i = 0; i < rowCount; i++) {
            q += `(?, ?, ?),`;
        }
        q = q.slice(0, -1) + ';';
        return q;
    }
}