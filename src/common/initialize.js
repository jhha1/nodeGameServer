const fs = require('fs');
const path = require("path");
const glob = require("glob");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const RedisStore = require('connect-redis').default; 
const preProcess = require('../common/preProcess');
const postProcess = require('../common/postProcess');
const googleApi = require("../database/google/googleApi");
const cache = require('../database/cache');
const response = require('../utils/response');
const ConstValues = require('./constValues');

function initializeConfig() {
    
    loadConfig();

    Object.defineProperty(global, 'ENV', {
        value: CONFIG.env,
        writable: false, // 읽기전용
    });
    Object.defineProperty(global, 'CONFIG', {
        value: CONFIG,
        writable: false,
    });
}

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

async function initializeConst() {

    // await loadConst();

    global.CONST_TABLE = [];

    Object.defineProperty(global, 'CONST_TABLE', {
        value: global.CONST_TABLE,
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

function initializeSession(app) {
    // 세션 쿠키 미들웨어 
    app.use(cookieParser(CONFIG.session.secret)); 
    const sessionOption = {
        resave: true,  // false: 세션수정불가, true : 수정저장가능.
        saveUninitialized: false, // 데이터가 존재할 때만 세션 저장 
        expires: true,
        secret: CONFIG.session.secret,
        cookie: {
            httpOnly: true,
            secure: "auto",
            maxAge: ConstValues.Session.AliveTime,
        },
        store: new RedisStore({ client: cache.GameRedisClient(), prefix: 'sess:' }), // 세션 데이터를 로컬 서버 메모리가 아닌 redis db에 저장하도록 등록
    };
    app.use(session(sessionOption));
}

function initializeRoutes(router) {
    const files = glob.sync(`${__dirname}/../routes/*.js`);
    for (const file of files) {
        const routes = require(file).routes;
        for (let uri in routes) {
            const fn = routes[uri]

            router.post(uri, async (req, res, next) => { await doLogic(req, res, next, fn); }); 
        }
    }

    return router;
}

async function doLogic(req, res, next, fn) {
    try {
        await preProcess.filter(req, res);

        await fn(req, res, next); // controller logic

        postProcess.filter(req, res);
    } catch (e) {
        return response.error(res, e);
    }
}

exports.initializeConfig = initializeConfig;
exports.initializeConst = initializeConst;
exports.initializeSession = initializeSession;
exports.initializeRoutes = initializeRoutes;