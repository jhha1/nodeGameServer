const mysql = require('mysql2/promise');
const logger = require("../utils/logger");
const {isMainThread, workerData, parentPort} = require("worker_threads");

const dbConnectionPool = {}; // db 커넥션 Object

/**
 * 앱 부팅 시 DB 연결
 */
function connect() {
    _connectMysql();
}

function _connectMysql() {
    try {
        let currentConfig = Object.assign(CONFIG["rdb"], {
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        dbConnectionPool[ENV] = mysql.createPool(currentConfig);
        logger.info(`${ENV} DB CONNECT`);
    } catch (err) {
        logger.error(`${ENV} db 연결 안됨`, err);
        throw err;
    }
}

function getConnection() {
    return dbConnectionPool[ENV].getConnection();
}

exports.connect = connect;
exports.getConnection = getConnection;