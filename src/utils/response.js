const log = require('./logger');
const Protocol = require("../common/responseProtocol");

class response {
    #protocolName;
    #responseData;
    #res;

    constructor(res) {
        this.#res = res;

        this.#protocolName = this.#getProtocolName();
        this.#responseData = {};
    }

    send (data) {
        return this.#res.json(data.make());
    }
    error (err) {
        log.error(this.#res.req, err);
        return this.#res.status(200).json(err);
    }

    get () {
        return this.#responseData;
    }

    set (userTables) {
        const protocol = Protocol[this.#protocolName];

        if (!protocol || typeof protocol !== 'object') {
            log.error(`FailedResponse. InvalidProtocol:${this.#protocolName}`);
            return;
        }

        if (!userTables) {
            log.error(`FailedResponse. InvalidResponseUserData:${this.#protocolName}`);
            return;
        }

        for (let name of Object.keys(protocol)) {
            if (typeof protocol[name] === 'object') {
                if (!userTables[name]) continue;

                this.#responseData[name] = this.#modelFilter(protocol[name], userTables[name]);
            }
            else {
                if (!Object.keys(userTables)[name]) continue;
                this.#responseData[name] = userTables[name];
            }
        }
        return this;
    }


    // primitive 응답값 전용
    primitives() {
        const table = new Table(this.#getProtocolName(), this.#responseData);
        return table.newRow();
    }

    make () {
        return JSON.stringify(this.#responseData);
    }

    #getProtocolName() {
        let protocolName = null;

        if (this.#res.req.url && this.#res.req.url.length > 1) {
            protocolName = this.#res.req.url.slice(1);
        }
        else if (this.#res.req.originUrl && this.#res.req.originUrl.length > 1) {
            protocolName = this.#res.req.originUrl.slice(1);
        }

        if (!protocolName) {
            log.error(`FailedResponse. NoExistProtocolUrl`);
            throw 99999;
        }

        return protocolName;
    }

    #modelFilter(Model, userData) {
        if (!userData) return {};

        const isRepeatable = Array.isArray(Model);
        const singleData = Array.isArray(userData) ? userData[0] : userData;
        const keys = Object.keys(singleData).filter(key => isRepeatable? Model[0][key] : Model[key]);

        let result = [];

        if (isRepeatable) {
            for (let row of userData) {
                result.push(Object.assign({}, ...keys.map(key => ({ [key]: row[key] }))));
            }
        }
        else {
            result = Object.assign({}, ...keys.map(key => ({ [key]: singleData[key] })));
        }

        return result;
    }
}

class Table {
    #tableName;
    #row;
    #table;

    constructor(tableName, resultTable) {
        this.#tableName = tableName;
        this.#table = resultTable;
        this.#row = {};
    }

    newRow() {
        this.#row = {};
        return this.#row;
    }

    set(key, value) {
        this.#row[key] = value;
        return this;
    }

    end() {
        this.setRow(this.#row);
        this.#row = null;
        return this.#table;
    }

    setRow(row) {
        if (!this.#table[this.#tableName]) this.#table[this.#tableName] = [];
        this.#table[this.#tableName].push(row);
    }
}

module.exports = response;