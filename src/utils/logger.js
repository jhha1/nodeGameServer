const { createLogger, format, transports } = require('winston');
const { combine, label, printf } = format;
const path = require('path');
const mt = require('moment-timezone');

const LOG_TYPE = Object.freeze({
    1: 'convert',
    2: 'mail',
    3: 'sql',
    4: 'user-copy',
});

const myFormat = printf(info => `${info.date} [${info.level}]: ${info.label} - ${info.message}`); // NOTE: 로그 형식 설정
const KTC = format((info) => {
    info.date = mt().tz('Asia/Seoul').format('YYMMDD hh:mm:ss');
    return info;
});

let LOG_PATH = null;
let appLogger = null;
let httpLogger = null;
let httpLogStream = null;

function initializeHttpLogger() {
    LOG_PATH = `../../${CONFIG["log"]["folderName"]}`;

     /**
     * http status 로그를 남기기 위함.
     */
     httpLogger = createLogger({
        format: combine(
            label({label: 'http'}),
            KTC(),
            myFormat,
        ),
        transports: [
            new transports.File({filename: path.join(__dirname,  LOG_PATH, mt().tz('Asia/Seoul').format('YYYY-MM-DD'), 'http.log')}),
        ],
    });

    httpLogStream = {
        write: (message) => { // NOTE: morgan에서 쓰기 위해 이 형태로 fix 되야함.
            httpLogger.log({
                level: 'info',
                message: message,
            });
        },
    };

    return this;
}

function initializeAppLogger() {
    LOG_PATH = `../../${CONFIG["log"]["folderName"]}`;

    /**
     * application log를 남기기 위함.
     * @param {*} logType
     * @returns
     */
    appLogger = (logType) => {
        const init = createLogger({
            format: combine(
                label({label: logType}), // NOTE: 어떤 서비스인지 알기 위함
                KTC(),
                myFormat,
            ),
            transports: [
                new transports.File({
                    filename: path.join(__dirname, LOG_PATH, 'app-error.log'),
                    level: 'error'
                }), // NOTE: 에러는 별도로 보기 위함
                new transports.File({filename: path.join(__dirname, LOG_PATH, mt().tz('Asia/Seoul').format('YYYY-MM-DD'), 'app.log')}), // NOTE: 모든 로그 (에러 포함)
            ],
        });
        init.add(new transports.Console());
        return init;
    };

    return this;
}

exports.LOG_TYPE = LOG_TYPE;
exports.logger = appLogger;
exports.httpLogger = httpLogStream;
exports.initializeAppLogger = initializeAppLogger;
exports.initializeHttpLogger = initializeHttpLogger;