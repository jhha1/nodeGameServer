const mysql = require('mysql2/promise');

const dbConnectionPool = {}; // db 커넥션 Object

/**
 * 앱 부팅 시 DB 연결
 */
function connect() {
    _connectMysql();
}

function _connectMysql() {
    try {
        let currentConfig = Object.assign(CONFIG["rdb"][ENV], {
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        dbConnectionPool[ENV] = mysql.createPool(currentConfig);
        console.log(`${ENV} DB CONNECT`);
    } catch (err) {
        console.log(`${ENV} db 연결 안됨`, err);
        throw err;
    }
}

function getConnection() {
    return dbConnectionPool[ENV].getConnection();;
}

exports.connect = connect;
exports.getConnection = getConnection;