const { createLogger, format, transports } = require('winston');
const { combine, label, printf } = format;
const path = require('path');
const mt = require('moment-timezone');

const myFormat = printf(info => `${info.date} [${info.level}]: ${info.label} - ${info.message}`); // 로그 형식 설정
const KTC = format((info) => {
    info.date = mt().tz('Asia/Seoul').format('YYMMDD hh:mm:ss');
    return info;
});

let LOG_PATH = null;

function initializeHttpLogger() {
    LOG_PATH = `../../${CONFIG["log"]["folderName"]}`;

     /**
     * http status 로그
     */
    const httpLogger = createLogger({
        format: combine(
            label({label: 'http'}),
            KTC(),
            myFormat,
        ),
        transports: [
            new transports.File({filename: path.join(__dirname,  LOG_PATH, mt().tz('Asia/Seoul').format('YYYY-MM-DD'), 'http.log')}),
        ],
    });

    const httpLogStream = {
        write: (message) => { // morgan에서 쓰기 위해 이 형태로 fix 되야함
            httpLogger.log({
                level: 'info',
                message: message,
            });
        },
    };

    return httpLogStream;
}

function initializeAppLogger() {
    LOG_PATH = `../../${CONFIG["log"]["folderName"]}`;

    /**
     * application log
     */
    const init = createLogger({
        format: combine(
            label({label: 'AA'}),
            KTC(),
            myFormat,
        ),
        transports: [
            new transports.File({
                filename: path.join(__dirname, LOG_PATH, 'app-error.log'),
                level: 'error'
            }), // 에러
            new transports.File({filename: path.join(__dirname, LOG_PATH, mt().tz('Asia/Seoul').format('YYYY-MM-DD'), 'app.log')}), // 모든 로그
        ],
    });
    init.add(new transports.Console());
    return init;
}

exports.initializeAppLogger = initializeAppLogger;
exports.initializeHttpLogger = initializeHttpLogger;
