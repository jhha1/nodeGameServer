const initializer = require('../common/initialize');
const db = require("../database/pool");

const initializeWorkerThread = async() => {
    const {isMainThread, workerData, parentPort} = require("worker_threads");

    if (!isMainThread) {
        // 작업 수행
        const { threadIndex, sharedData } = workerData;
        console.log(`스레드 ${threadIndex} 시작`);

        initializer.initializeConfig(sharedData[0]);
        initializer.initializeAppLogger();
        initializer.initializeConst(sharedData[1]);

        db.connect();

        logger.info(`스레드 ${threadIndex} 초기화 완료`);

        // 초기화 작업이 완료되었음을 메인 스레드에 알림
        parentPort.postMessage("initialized");
    }
}

initializeWorkerThread();
