const dbPool = require('./pool');

/**
 * 쿼리 실행
 * @param {String} query 쿼리문
 * @returns {Promise}
 */
async function runQuery(query) {
    // console.log(query);
    if (!query) throw new Error("runQuery 매개변수 확인");
    let conn;
    try {
        conn = await dbPool.getConnection();
    } catch (err) {
        throw err;
    }
    try {
        const [rows, fields] = await conn.query(query);
        return rows;
    } catch (err) {
        throw err;
    } finally {
        conn.release();
    }
}

/**
 * 트랜잭션 실행
 * @param {String} query 쿼리문
 */
async function runTransaction(query) {
    if (query.length > 0) {
        let conn;
        try {
            conn = await dbPool.getConnection();
        } catch (err) {
            throw err;
        }
        conn.beginTransaction();
        try {
            const [rows, fields] = await conn.query(query);
            conn.commit();
        } catch (err) {
            conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
}

exports.runQuery = runQuery;
exports.runTransaction = runTransaction;