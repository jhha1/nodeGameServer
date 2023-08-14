const db = require('../database/db');
const cache = require('../database/cache');
const queries = require('../queries/mapper');
const ConstValues = require("../common/constValues");
const moment = require("moment");

class GachaService {
    #req;
    #userId;
    #shardId;
    constructor(req) {
        this.#req = req;
        this.#userId = req.session.userId;
        this.#shardId = req.session.shardId;
    }

    /*
        Gacha Level
    */
    async getGachaLevel(gachaId) {
        let data = await cache.Game.HGET(this.#gachaLevelKey, this.#hKey);
        if (!data || data.ttl < moment.utc().unix()) {
            // 캐싱 안되있거나 만료됬으면, 디비값 저장.
            let query = [["rows", queries.GachaLevel.select, [this.#userId]]];

            let { rows } = await db.select(this.#shardId, query);

            data = {v:rows, ttl:this.#expireDt};
            await cache.Game.HSET(this.#gachaLevelKey, this.#hKey, data);
        }

        let found = data.v?.findIndex(x => Number(x.gacha_id) === gachaId);
        return found > -1 ? data.v[found] : null;
    }

    async setGachaLevel(gachaId, level, point, rows, rowIndex=-1) {
        let executeQuery = [];
        if (rowIndex === -1) {
            executeQuery.push([queries.GachaLevel.insert, [this.#userId,gachaId, level, point]]);
            rows.push({user_id:this.#userId, gacha_id:gachaId, level:level, point:point});
        } else {
            executeQuery.push([queries.GachaLevel.update, [level, point, this.#userId, gachaId]]);
            rows[rowIndex] = {user_id:this.#userId, gacha_id:gachaId, level:level, point:point};
        }

        await db.execute(this.#shardId, executeQuery);

        const data = {v:rows, ttl:this.#expireDt};
        await cache.Game.HSET(this.#gachaLevelKey, this.#hKey, data);
    }

    get #gachaLevelKey() {
        return `GachaLv`;
    }

    get #hKey() {
        return this.#userId;
    }

    get #expireDt() { // 30분 주기 ttl
        return moment.utc().add(ConstValues.Cache.TTL, 'minutes').unix();
    }
}

module.exports = GachaService;

