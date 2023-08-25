const db = require('../database/db');
const cache = require('../database/cache');
const Queries = require('../queries/mapper');
const ConstValues = require("../common/constValues");
const ItemType = require("../common/constValues").Item.Type;
const util = require("../utils/util");
const log = require("../utils/logger");

class ItemService {
    #req;
    #itemStackableObject;
    #itemEquipObject;

    constructor(req) {
        this.#req = req;
        this.#itemStackableObject = new ItemStackable(this.#req);
        this.#itemEquipObject = new ItemEquip(this.#req);
    }

    async loadAllItems() {
        await this.Stackable.getAll();
        await this.Equip.getAll();
    }

    async saveCacheOnly() {
        await this.Stackable.mSetCacheOnly();
        await this.Equip.mSetCacheOnly();
    }

    calculateIncrease(incrItemList) {
        this.Stackable.calculateIncrease(incrItemList);
        this.Equip.calculateIncrease(incrItemList);
    }

    calculateDecrease(decrItemList) {
        this.Stackable.calculateDecrease(decrItemList);
        this.Equip.calculateDecrease(decrItemList);
    }

    isFloatingPointItem(itemId) {
        return ItemType.FloatingPoint === itemId;
    }

    isStackableItem(itemId) {
        return ItemType.Stackable < itemId  && itemId < ItemType.Equip;
    }

    isEquipItem(itemId) {
        return ItemType.Equip < itemId;
    }

    get Stackable() {
        return this.#itemStackableObject;
    }

    get Equip() {
        return this.#itemEquipObject;
    }

    get executeQueries() {
        return [...this.Stackable.executeQueries(), ...this.Equip.executeQueries()];
    }
}

class ItemStackable {
    #req;
    #userId;
    #shardId;
    #data;
    #executeQueries;
    #updateCashValues;

    constructor(req) {
        this.#req = req;
        this.#userId = req.session.userId;
        this.#shardId = req.session.shardId;

        this.#data = [];

        this.#executeQueries = [];
        this.#updateCashValues = [];
    }

    async get(itemId) {
        let data = await cache.Game.HGET(this.#key, itemId);
        if (!data) {
            this.#data = await this.#loadDB();

            return Array.isArray(this.#data)? this.#data.find((x) => x.item_id === itemId) : null;
        }
        return data;
    }

    async mGet(itemIdList) {
        let data = await cache.Game.HGET(this.#key, itemIdList);
        if (!data) {
            this.#data = await this.#loadDB();
            return this.#data.filter(d => itemIdList.includes(d.item_id));
        }

        return data.filter((_, index) => index % 2 === 1);
    }

    async getAll() {
        if (!this.#data) {
            let data = await cache.Game.HGETALL(this.#key);
            if (!data) {
                this.#data = await this.#loadDB();
            }
            else {
                this.#data = data.filter((_, index) => index % 2 === 1);
            }
        }
        return this.#data;
    }

    async setCacheOnly(itemId, data) {
        if (await cache.isExpired(this.#key)) {
            await this.#loadDB(); // 이때 캐시에 set도 하므로
        }
        else {
            await cache.Game.HSET(this.#key, itemId, data);
        }
    }

    async mSetCacheOnly() {
        if (await cache.isExpired(this.#key)) {
            await this.#loadDB();
        }
        else {
            let data = [];
            for (let row of this.#updateCashValues) {
                data.push(row.item_id);
                data.push(row);
            }
            await cache.Game.HSET(this.#key, ...data);
        }
    }

    calculateIncrease(incrItemList) {
        const incrList = incrItemList.filter((x) => super.isStackableItem(x.item_id));
        const mergedIncrList = util.mergeDuplicatedItems(incrList);
        for (let incr of mergedIncrList) {
            let found = this.#data.findIndex((x) => x.item_id === incr.id);
            if (found === -1) {
                this.#executeQueries.push([Queries.ItemStackable.insert, [this.#userId, incr.id, incr.count]]);
                this.#updateCashValues.push({user_id:this.#userId, item_id:incr.id, count:incr.count});

                this.#data.push({user_id:this.#userId, item_id:incr.id, count:incr.count});
            }
            else {
                let item = this.#data[found];
                item.count += incr.count;

                this.#executeQueries.push([Queries.ItemStackable.update, [item.count, this.#userId, incr.id]]);
                this.#updateCashValues.push({user_id:this.#userId, item_id:incr.id, count:item.count});

                this.#data[found].count = item.count;
            }
        }
    }

    calculateDecrease(decrItemList) {
        const decrList = decrItemList.filter((x) => super.isStackableItem(x.item_id));
        const mergedDecrList = util.mergeDuplicatedItems(decrList);
        for (let decr of mergedDecrList) {
            let found = this.#data.findIndex((x) => x.item_id === decr.id);
            if (found === -1) {
                log.error(this.#req, `InsufficientBalance. id:${decr.id}, needCount:${decr.count}, haveCount:0`);
                throw 99999;
            }

            let item = this.#data[found];
            if (item.count < decr.count) {
                log.error(this.#req, `InsufficientBalance. id:${decr.id}, needCount:${decr.count}, haveCount:${item.count}`);
                throw 99999;
            }

            item.count -= decr.count;

            this.#executeQueries.push([Queries.ItemStackable.update, [item.count, this.#userId, decr.id]]);
            this.#updateCashValues.push({user_id:this.#userId, kind:item.kind, item_id:decr.id, count:item.count});

            this.#data[found].count = item.count;
        }
    }

    async #loadDB() {
        // 만료됬으면, 디비값 저장.
        let query = [["rowsDB", Queries.ItemStackable.select, [this.#userId]]];

        let { rowsDB } = await db.select(this.#shardId, query);

        // cache 저장
        let data = [];
        for (let row of rowsDB) {
            data.push(row.item_id);
            data.push(row);
        }
        await cache.Game.HSET(this.#key, ...data);
        await cache.Game.EXPIRE(this.#key, ConstValues.Cache.TTL);

        return rowsDB;
    }

    get executeQueries() {
        return this.#executeQueries;
    }

    get #key() {
        return `Item:S:${this.#userId}`;
    }
}

class ItemEquip {
    #req;
    #userId;
    #shardId;
    #data;
    #executeQueries;
    #updateCashValues;
    constructor(req) {
        this.#req = req;
        this.#userId = req.session.userId;
        this.#shardId = req.session.shardId;

        this.#data = [];

        this.#executeQueries = [];
        this.#updateCashValues = [];
    }

    async get(itemId) {
        let data = await cache.Game.HGET(this.#key, itemId);
        if (!data) {
            this.#data = await this.#loadDB();
            return Array.isArray(this.#data)? this.#data.find((x) => x.item_id === itemId) : null;
        }
        return data;
    }

    async mGet(itemIdList) {
        let data = await cache.Game.HGET(this.#key, itemIdList);
        if (!data) {
            this.#data = await this.#loadDB();
            return this.#data.filter(d => itemIdList.includes(d.item_id));
        }

        return data.filter(d => itemIdList.includes(d.item_id));
    }

    async getAll() {
        if (!this.#data) {
            let data = await cache.Game.HGETALL(this.#key);
            if (!data) {
                this.#data = await this.#loadDB();
            }
            else {
                this.#data = data.filter((_, index) => index % 2 === 1);
            }
        }
        return this.#data;
    }

    async setCacheOnly(itemId, data) {
        if (await this.#isExpired()) {
            await this.#loadDB();
        }
        else {
            await cache.Game.HSET(this.#key, itemId, data);
        }
    }

    async mSetCacheOnly() {
        if (await cache.isExpired(this.#key)) {
            await this.#loadDB();
        }
        else {
            let data = [];
            for (let row of this.#updateCashValues) {
                data.push(row.item_id);
                data.push(row);
            }
            await cache.Game.HSET(this.#key, ...data);
        }
    }

    async addDirectly(kind, itemId, grade, level, pieceCount) {
        let query = [
            [Queries.ItemEquip.insert, [this.#userId, kind, itemId, grade, level, pieceCount]]
        ];
        await db.execute(this.#shardId, query);

        const data = {user_id:this.#userId, kind:kind, item_id:itemId, grade:grade, level:level, piece_count:pieceCount};
        await this.#setCache(itemId, data);
    }

    async updateDirectly(kind, itemId, grade, level, pieceCount) {
        let query = [
            [Queries.ItemEquip.update, [level, pieceCount, this.#userId, itemId]]
        ];
        await db.execute(this.#shardId, query);

        let data = {user_id:this.#userId, kind:kind, item_id:itemId, grade:grade, level:level, piece_count:pieceCount};
        await this.#setCache(itemId, data);
    }

    calculateIncrease(incrItemList) {
        const incrList = incrItemList.filter((x) => super.isEquipItem(x.item_id));
        const mergedIncrList = util.mergeDuplicatedItems(incrList);
        for (let incr of mergedIncrList) {
            let found = this.#data.findIndex((x) => x.item_id === incr.id);
            if (found === -1) {
                this.#executeQueries.push([Queries.ItemEquip.insert, [this.#userId, incr.id, incr.count]]);
                this.#updateCashValues.push({user_id:this.#userId, item_id:incr.id, count:incr.count});

                this.#data.push({user_id:this.#userId, item_id:incr.id, count:incr.count});
            }
            else {
                let item = this.#data[found];
                item.count += incr.count;

                this.#executeQueries.push([Queries.ItemEquip.update, [item.count, this.#userId, incr.id]]);
                this.#updateCashValues.push({user_id:this.#userId, item_id:incr.id, count:item.count});

                this.#data[found].count = item.count;
            }
        }
    }

    calculateDecrease(decrItemList) {
        const decrList = decrItemList.filter((x) => super.isEquipItem(x.item_id));
        const mergedDecrList = util.mergeDuplicatedItems(decrList);
        for (let decr of mergedDecrList) {
            let found = this.#data.findIndex((x) => x.item_id === decr.id);
            if (found === -1) {
                log.error(this.#req, `InsufficientBalance. id:${decr.id}, needCount:${decr.count}, haveCount:0`);
                throw 99999;
            }

            let item = this.#data[found];
            if (item.count < decr.count) {
                log.error(this.#req, `InsufficientBalance. id:${decr.id}, needCount:${decr.count}, haveCount:${item.count}`);
                throw 99999;
            }

            item.count -= decr.count;

            this.#executeQueries.push([Queries.ItemEquip.update, [item.level, item.count, this.#userId, item.id]]);
            this.#updateCashValues.push({user_id:this.#userId, item_id:item.id, grade:item.grade, level:item.level, piece_count:item.count});

            this.#data[found].count = item.count;
        }
    }

    async #loadDB() {
        // 만료됬으면, 디비값 저장.
        let query = [["rowsDB", Queries.ItemEquip.select, [this.#userId]]];

        let { rowsDB } = await db.select(this.#shardId, query);

        // cache 저장
        let data = [];
        for (let row of rowsDB) {
            data.push(row.item_id);
            data.push(row);
        }
        await cache.Game.HSET(this.#key, ...data);
        await cache.Game.EXPIRE(this.#key, ConstValues.Cache.TTL);

        return rowsDB;
    }

    async #isExpired() {
        let TTL = await cache.Game.TTL(this.#key);
        return !TTL || TTL < ConstValues.Cache.RefreshTTL;
    }

    get executeQueries() {
        return this.#executeQueries;
    }

    get #key() {
        return `Item:E:${this.#userId}`;
    }
}

module.exports = ItemService;

