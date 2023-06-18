const dbPool = require('./pool');

/**
 * select
 * @param {String} dbName
 * @param {String} queries [[q1name : q1], [q2name : q2], ... ] 
 * @returns {Promise}
 */
async function select(dbName, queries) {
    if (!dbName || !queries || queries.length === 0) {
        throw `디비조회실패. 매개변수확인. db:${dbName}, queries:${queries}`;
    }

    let ret = Object.fromEntries(queries.map(q => [q[0], []]));
    let queryString = queries.map(q => q[1]).join("\n");
    
    let conn = null;
    try {
        conn = await dbPool.getConnection(dbName);
        const [results, fields] = await conn.query(queryString);
        conn.release();
        conn = null;

        if (queries.length === 1) {
            for (let i = 0; i < results.length; i++) {
                ret[queries[0][0]].push(results[i]);
            }
        } else {
            for (let i = 0; i < results.length; i++) {
                ret[queries[i][0]] = results[i];
            }
        }

        return ret;

    } catch (err) {
        throw err;
    } finally {
        if (conn != null) {
            conn.release();
        }
    }
}

/**
 */
async function transaction(dbName, queries) {
    if (!dbName || !queries || queries.length === 0) {
        throw `디비트랜젝션실패. 매개변수확인. db:${dbName}, queries:${queries}`;
    }

    const queryString = queries.map(q => q).join("\n");

    let conn = null;
    try {
        conn = await dbPool.getConnection(dbName);
        await conn.beginTransaction();

        let results = await conn.query(queryString);
        await conn.commit();

        return results;
    } catch (err) {
        if (conn !== null) {
            await conn.rollback();
        }
        console.error(queryString);
        throw err;
    } finally {
        if (conn != null) {
            conn.release();
        }
    }
}

exports.select = select;
exports.transaction = transaction;