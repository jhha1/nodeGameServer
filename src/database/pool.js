const mysql = require('mysql2/promise');
const logger = require("../utils/logger");
const _ = require("lodash");

const dbAuthConnectionPool = []; 
const dbGameConnectionPool = [];

/**
 * 앱 부팅 시 DB 연결
 */
function connect() {
    _connectMysql();
}

function _connectMysql() {
    try {
        _connectAuth();
        _connectGame();
        
    } catch (err) {
        logger.error(`${ENV} db 연결 안됨`, err);
        throw err;
    }

    function _connectAuth(){
        let _config = Object.assign(CONFIG["rdb"]["list"]["auth"], CONFIG["rdb"]["options"]);
        dbAuthConnectionPool[0] = mysql.createPool(_config);
        logger.info(`Auth DB CONNECTED`);
    }

    function _connectGame(){
        const gameDBConfig = CONFIG["rdb"]["list"]["game"];
        const gameDBList = gameDBConfig["hostList"];
        for (let i = 0; i < gameDBList.length; i++) {
            let _config = _.cloneDeep(gameDBConfig);
            _config.host = gameDBList[i];
            _config.database = `${_config.database}${i+1}`;
            //delete _config.hostList;

            dbGameConnectionPool[i] = mysql.createPool(_config);
            logger.info(`Game0${i+1} DB CONNECTED`);
        } 
    }
}

function getConnection(dbName) {
    if (dbName === "auth") {
        return dbAuthConnectionPool[0].getConnection();
    } else if (!isNaN(dbName)) { // game
        return dbGameConnectionPool[dbName].getConnection(); // dbName === shard number
    }
}

exports.connect = connect;
exports.getConnection = getConnection;