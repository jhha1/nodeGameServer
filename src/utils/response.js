const log = require('./logger'); 

const response = {
    send (res, data) {
        return res.json(JSON.stringify(data));
    },
    error (res, err) {
        log.error(res.req, err);
        return res.status(200).json(err);
    }
}

module.exports = response;