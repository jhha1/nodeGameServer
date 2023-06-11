const fs = require('fs');
const path = require("path");
const logger = require('../utils/logger');
const googleApi = require("../database/google/googleApi");

function loadConfig() {
    const args = process.argv.slice(2);

    let env = 'dev';
    if (args.length === 0) {
        env = "dev"; // 실행 시 인자가 없으면 라이브
    }
    else {
        env = args[0]; // 실행 시 인자가 있으면 해당 서버환경 (dev, stage, live)
    }
    Object.defineProperty(global, 'ENV', {
        value: env,
        writable: false, // 읽기전용
    });

    const config = JSON.parse(fs.readFileSync(path.join(__dirname, `../../config/config_${ENV}.json`), 'utf8'));
    Object.defineProperty(global, 'CONFIG', {
        value: config,
        writable: false,
    });
}

async function loadConst() {
    let sheetId = CONFIG["google"]["constSheetIds"]["item"];
    let GoogleSheetObj = new googleApi.GoogleSheet(sheetId);
    let dataArray = await GoogleSheetObj.readSheetAll();

    let tableList = {};
    for (let data of dataArray) {
        if (tableList[data.sheetName] === undefined) tableList[data.sheetName] = [];
        let columns = data.values[0];
        let convertedRowData = {};
        for (let row = 1; row < data.values.length; row++) {
            for (let col = 0; col < columns.length; col++) {
                convertedRowData[columns[col]] = data.values[row][col];
            }
            tableList[data.sheetName].push(convertedRowData);
            convertedRowData = {};
        }
    }

    Object.defineProperty(global, 'CONST_TABLE', {
        value: tableList,
        writable: false,
    });
}

function initializeConfig(config) {
    Object.defineProperty(global, 'ENV', {
        value: config.env,
        writable: false, // 읽기전용
    });
    Object.defineProperty(global, 'CONFIG', {
        value: config,
        writable: false,
    });
}

function initializeConst(constTable) {
    Object.defineProperty(global, 'CONST_TABLE', {
        value: constTable,
        writable: false,
    });
}

function initializeAppLogger() {
    //logger.initializeAppLogger();
}

function initializeHttpLogger() {
    global.httpLogger = logger.initializeHttpLogger();
}

exports.loadConfig = loadConfig;
exports.loadConst = loadConst;
exports.initializeConfig = initializeConfig;
exports.initializeConst = initializeConst;
exports.initializeAppLogger = initializeAppLogger;
exports.initializeHttpLogger = initializeHttpLogger;