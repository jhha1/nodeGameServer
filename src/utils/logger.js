const { createLogger, format, transports } = require('winston');
const { combine, label, printf } = format;
const path = require('path');
const mt = require('moment-timezone');

//const PATH = `${__dirname}\\..\\..\\`;
const PATH =  process.cwd();
const FILE = 'logs';

const logFormat = printf(info => `${info.date} [${info.level}]: ${info.label} - ${info.message}`); // 로그 형식 설정
const KST = format((info) => {
    info.date = mt().tz('Asia/Seoul').format('YYMMDD hh:mm:ss');
    return info;
});

const _httpLogger = createLogger({
    format: combine(label({label: 'http'}), KST(), logFormat),
    transports: [
        new transports.File({filename: path.join(PATH, FILE, mt().tz('Asia/Seoul').format('YYYY-MM-DD'), 'http.log')}),
    ],
});

const httpLogger = {
    write: (message) => { // morgan에서 쓰기 위해 이 형태로 fix 되야함
        _httpLogger.log({
            level: 'info',
            message: message,
        });
    },
};

const logger = createLogger({
    level: 'info',
    format: combine(label({label: 'biz'}), KST(), logFormat),
    defaultMeta: { service: 'user-service' },
    transports: [
        new transports.File({filename: path.join(PATH, FILE, 'error.log'), level: 'error'}), // 에러
        new transports.File({filename: path.join(PATH, FILE, mt().tz('Asia/Seoul').format('YYYY-MM-DD'), 'app.log')}), // 모든 로그
    ]
});
// Console에도 출력하도록 설정
const isProdunction = process.argv.slice(2).length > 0 && process.argv.slice(2)[0] === 'production';
if (!isProdunction) {
    logger.add(new transports.Console({
      format: combine(label({label: 'biz'}), KST(), logFormat),
      level: 'debug'
    }));
}

module.exports = logger;
module.exports.httpLogger = httpLogger;
