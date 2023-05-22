const express = require('express');
const {isMainThread, Worker, workerData, parentPort} = require("worker_threads");
const bodyParser = require("body-parser");
const glob = require("glob");
const morgan = require("morgan");
const initializer = require('../common/initialize');

const SERVER_PORT = 8886;

// 워커 프로세스
const initializeProcess = async() => {
    
    // 마스터 스레드
    if (isMainThread) {
        const app = express();

        // 미들웨어 설정
        app.use(express.json()); 
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());

        const routes = glob.sync(`${__dirname}/../routes/*.js`);
        for (const route of routes) {
            require(route)(app);
        }

        initializer.loadConfig();

        const httpLogger = initializer.initializeHttpLogger(app);
        app.use(morgan('combined', { stream: httpLogger }));
        app.use((err, req, res, next) => {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err,
                title: 'error',
            });
        });
        
       // await initializer.loadConst();

        global.CONST_TABLE = [];

        // 스레드들 간에 공유할 데이터
        const sharedData = [
            CONFIG,
            CONST_TABLE
        ];

        // 스레드 생성
        const numWorkers = 2;
        const workers = [];
        for (let i = 0; i < numWorkers; i++) {
        workers.push(new Promise((resolve, reject) => {
            const worker = new Worker('./src/bin/worker.js', { workerData: { threadIndex: i, sharedData } });
            worker.once("message", (message) => { 
                if (message === "initialized") { resolve(); }
            });
            worker.on("error", reject);
        }));
        }
        await Promise.all(workers); // 모든 작업자 스레드가 생성될 때까지 기다림

        app.listen(SERVER_PORT, () => {
            console.log(`Server running on port: ${SERVER_PORT}`);
        });
    }
}

exports.initializeProcess = initializeProcess;