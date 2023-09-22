const msgpack = require('msgpack-lite');
const log = require('./logger');

class response {
    #res;

    constructor(res) {
        this.#res = res;
    }

    send (messageObj) {
        const data = messageObj.get();
        const encoded = msgpack.encode(data);
        return this.#res.send(encoded);
    }

    error (err) {
        log.error(this.#res.req, err);
        const encoded = msgpack.encode(JSON.stringify(err));
        return this.#res.send(encoded);
    }
}

module.exports = response;