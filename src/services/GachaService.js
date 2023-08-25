const db = require('../database/db');
const cache = require('../database/cache');
const queries = require('../queries/mapper');
const ConstValues = require("../common/constValues");
const moment = require("moment");
const Queries = require("../queries/mapper");
const util = require("../utils/util");
const ConstTables = require("../const/mapper");
const log = require("../utils/logger");

class GachaService {
    #req;
    #GachaLevelObject;

    constructor(req) {
        this.#req = req;
        this.#GachaLevelObject = new GachaLevel(this.#req);
    }

    get UserGachaLevel() {
        return this.#GachaLevelObject;
    }

    get executeQueries() {
        return this.UserGachaLevel.executeQueries();
    }

    async saveCacheOnly() {
        await this.UserGachaLevel.setCacheOnly();
    }
}

class GachaLevel {
    #req;
    #userId;
    #shardId;
    #data;
    #updateCashValues;
    #executeQueries;

    constructor(req) {
        this.#req = req;
        this.#userId = req.session.userId;
        this.#shardId = req.session.shardId;

        // for get
        this.#data = null;

        // for set
        this.#updateCashValues = [];
        this.#executeQueries = [];
    }

    async get() {
        if (!this.#data) {
            let data = await cache.Game.HGET(this.#key, this.#hKey);

            // 캐싱 안되있거나 만료됬으면, 디비값 저장.
            if (!data || data.ttl < moment.utc().unix()) {
                this.#data = await this.#loadDB();
            }
            else {
                this.#data = data.v;
            }
        }

        return this.#data;
    }

    async getByGachaType(gachaType) {
        let data = await this.get();
        let found = data?.findIndex(x => Number(x.gacha_type) === gachaType);
        return found > -1 ? data[found] : null;
    }

    async setCacheOnly() {
        for (let origin of this.#data) {
            for (let update of this.#updateCashValues) {
                if (origin.gacha_id === update.gacha_id) {
                    origin = update;
                    break;
                }
            }
        }
        const data = {v:this.#data, ttl:this.#expireDt};
        await cache.Game.HSET(this.#key, this.#hKey, data);
    }

    async calculatePoint(gachaId, gachaType, gachaCount) {
        let userGachaLevelInfo = await this.getByGachaType(gachaType);

        // 1. 데이터가 없을경우
        if (!userGachaLevelInfo) {
            this.#executeQueries.push([queries.GachaLevel.insert, [this.#userId, gachaId, 1, gachaCount]]);
            this.#updateCashValues.push({user_id:this.#userId, gacha_id:gachaId, level:1, point:gachaCount});
            return;
        }

        let userGachaLevel = userGachaLevelInfo.level ?? 1;
        let userGachaPoint = userGachaLevelInfo.point ?? 0;
        let newPoint = userGachaPoint + gachaCount; // Point 누적

        // 2. 만렙
        const C_GachaLevelMax = ConstTables.GachaLevel.getMaxLevel(gachaType);
        if (C_GachaLevelMax <= userGachaLevel) {
            // Point만 누적
            this.#executeQueries.push([queries.GachaLevel.update, [userGachaLevel, newPoint, this.#userId, gachaId]]);
            this.#updateCashValues.push({user_id:this.#userId, gacha_id:gachaId, level:userGachaLevel, point:newPoint});
            return;
        }

        // 3. 그 외
        const C_CurrentGachaLevel = ConstTables.GachaLevel.get(gachaType, userGachaLevel);
        const C_NextGachaLevel = ConstTables.GachaLevel.get(gachaType, userGachaLevel + 1);
        if (!C_CurrentGachaLevel || !C_NextGachaLevel) {
            log.error(this.#req, `NoExist_In_C_GachaLevel. gachaType:${gachaType}, userGachaLevel:${userGachaLevel}`);
            throw 99999; // 기획데이터에 없는 소환 타입,레벨
        }

        if (C_NextGachaLevel.point <= C_CurrentGachaLevel.point + newPoint) {
            // 렙업
            userGachaLevel += 1;
            userGachaPoint = newPoint - C_NextGachaLevel.point;
        }
        else {
            // Point만 누적
            userGachaPoint = newPoint;
        }

        this.#executeQueries.push([queries.GachaLevel.update, [userGachaLevel, userGachaPoint, this.#userId, gachaId]]);
        this.#updateCashValues.push({user_id:this.#userId, gacha_id:gachaId, level:userGachaLevel, point:userGachaPoint});
    }

    async #loadDB() {
        // 만료됬으면, 디비값 저장.
        let query = [["rowsDB", Queries.GachaLevel.select, [this.#userId]]];

        let { rowsDB } = await db.select(this.#shardId, query);

        // cache 저장
        let data = {v:rowsDB, ttl:this.#expireDt};
        await cache.Game.HSET(this.#key, this.#hKey, data);

        return rowsDB;
    }

    get executeQueries() {
        return this.#executeQueries;
    }

    get #key() {
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

