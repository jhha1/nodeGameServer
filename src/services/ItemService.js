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
    }

    get Stackable() {
        if (!this.#itemStackableObject) {
            this.#itemStackableObject = new ItemStackable(this.#req)
        }
        return this.#itemStackableObject;
    }

    get Equip() {
        if (!this.#itemEquipObject) {
            this.#itemEquipObject = new ItemEquip(this.#req);
        }
        return this.#itemEquipObject;
    }

    async loadAll() {
        this.Equip.init();
        this.Stackable.init();
    }

    incrCheck(incrItemList) {
        this.Stackable.incrCheck(incrItemList);
        this.Equip.incrCheck(incrItemList);
    }

    decrCheck(decrItemList) {
        this.Stackable.decrCheck(decrItemList);
        this.Equip.decrCheck(decrItemList);
    }

    getItemType(itemId) {
        if (ItemType.Double === itemId) return ItemType.Double;
        else if (ItemType.Stackable < itemId && itemId < ItemType.Equip) return ItemType.Stackable;
        else if (ItemType.Equip < itemId) return ItemType.Equip;
    }
}

class ItemStackable {
    #req;
    #userId;
    #shardId;
    #data;
    #dbQueries;
    #cacheData;

    constructor(req) {
        this.#req = req;
        this.#userId = req.session.userId;
        this.#shardId = req.session.shardId;

        this.#data = [];

        this.#dbQueries = [];
        this.#cacheData = [];
    }

    async init() {
        await this.#loadAll();
        return this;
    }

    async getAll() {
        if (!this.#data) {
            await this.#loadAll();
        }
        return this.#data;
    }

    async #loadAll() {
        let data = await cache.Game.HGETALL(this.#key);
        if (!data) {
            return await this.#loadDB();
        }

        this.#data = data.filter((_, index) => index % 2 === 1);
        return this.#data;
    }

    async get(itemId) {
        let data = await cache.Game.HGET(this.#key, itemId);
        if (!data) {
            data = await this.#loadDB();

            return Array.isArray(data)? data.find((x) => x.item_id === itemId) : null;
        }
        return data;
    }

    async getMulti(itemIdList) {
        let data = await cache.Game.HGET(this.#key, itemIdList);
        if (!data) {
            data = await this.#loadDB();
            return data.filter(d => itemIdList.includes(d.item_id));
        }

        return data.filter((_, index) => index % 2 === 1);
    }



    async addDirectly(kind, itemId, count) {
        let query = [
            [Queries.ItemStackable.insert, [this.userId, kind, itemId, count]]
        ];
        await db.execute(this.shardId, query);

        const data = {user_id:this.userId, kind:kind, item_id:itemId, count:count};
        await this.#setCache(itemId, data);
    }

    async updateDirectly(kind, itemId, count) {
        let query = [
            [Queries.ItemStackable.update, [count, this.userId, itemId]]
        ];
        await db.execute(this.shardId, query);

        let data = {user_id:this.userId, kind:kind, item_id:itemId, count:count};
        await this.#setCache(itemId, data);
    }

    incrCheck(incrItemList) {
        const incrList = incrItemList.filter((x) => this.isStackableItem(x.item_id));
        const mergedIncrList = util.mergeDuplicatedItems(incrList);
        for (let incr of mergedIncrList) {
            let found = this.#data.findIndex((x) => x.item_id === incr.id);
            if (found === -1) {
                this.#dbQueries.push([Queries.ItemStackable.insert, [this.#userId, incr.id, incr.count]]);
                this.#cacheData.push({user_id:this.#userId, item_id:incr.id, count:incr.count});

                this.#data.push({user_id:this.#userId, item_id:incr.id, count:incr.count});
            }
            else {
                let item = this.#data[found];
                item.count += incr.count;

                this.#dbQueries.push([Queries.ItemStackable.update, [item.count, this.#userId, incr.id]]);
                this.#cacheData.push({user_id:this.#userId, item_id:incr.id, count:item.count});

                this.#data[found].count = item.count;
            }
        }
    }

    decrCheck(decrItemList) {
        const decrList = decrItemList.filter((x) => this.isStackableItem(x.item_id));
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

            this.#dbQueries.push([Queries.ItemStackable.update, [item.count, this.#userId, decr.id]]);
            this.#cacheData.push({user_id:this.#userId, kind:item.kind, item_id:decr.id, count:item.count});

            this.#data[found].count = item.count;
        }
    }

    isStackableItem(itemId) {
        return ItemType.Stackable < itemId  && itemId < ItemType.Equip;
    }




    async #setCache(hKey, data) {
        if (await cache.isExpired(this.#key)) {
            await this.#loadDB(); // 캐시에 set도 함
        }
        else {
            await cache.Game.HSET(this.#key, hKey, data);
        }
    }

    async #mSetCache(rows) {
        if (await cache.isExpired(this.#key)) {
            await this.#loadDB();
        }
        else {
            let data = [];
            for (let row of rows) {
                data.push(row.item_id);
                data.push(row);
            }
            await cache.Game.HSET(this.#key, ...data);
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

        this.#data = rowsDB;
        return this.#data;
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
    #dbQueries;
    #cacheData;
    constructor(req) {
        this.#req = req;
        this.#userId = req.session.userId;
        this.#shardId = req.session.shardId;

        this.#data = [];

        this.#dbQueries = [];
        this.#cacheData = [];
    }

    async init(opt=true) {
        await this.#loadAll();
        return this;
    }

    async getAll() {
        if (!this.#data) {
            await this.#loadAll();
        }
        return this.#data;
    }

    async #loadAll() {
        let data = await cache.Game.HGETALL(this.#key);
        if (!data) {
            return await this.#loadDB();
        }

        this.#data = data.filter((_, index) => index % 2 === 1);
        return this.#data;
    }

    async get(itemId) {
        let data = await cache.Game.HGET(this.#key, itemId);
        if (!data) {
            data = await this.#loadDB();

            return Array.isArray(data)? data.find((x) => x.item_id === itemId) : null;
        }
        return data;
    }

    async getMulti(itemIdList) {
        let data = await cache.Game.HGET(this.#key, itemIdList);
        if (!data) {
            data = await this.#loadDB();
        }

        data = data.filter(d => itemIdList.includes(d.item_id));

        return data;
    }

    async getAll() {
        let data = await cache.Game.HGETALL(this.#key);
        if (!data) {
            data = await this.#loadDB();
        }
        return data;
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

    incrCheck(incrItemList) {
        const incrList = incrItemList.filter((x) => this.isEquipItem(x.item_id));
        const mergedIncrList = util.mergeDuplicatedItems(incrList);
        for (let incr of mergedIncrList) {
            let found = this.#data.findIndex((x) => x.item_id === incr.id);
            if (found === -1) {
                this.#dbQueries.push([Queries.ItemEquip.insert, [this.#userId, incr.id, incr.count]]);
                this.#cacheData.push({user_id:this.#userId, item_id:incr.id, count:incr.count});

                this.#data.push({user_id:this.#userId, item_id:incr.id, count:incr.count});
            }
            else {
                let item = this.#data[found];
                item.count += incr.count;

                this.#dbQueries.push([Queries.ItemEquip.update, [item.count, this.#userId, incr.id]]);
                this.#cacheData.push({user_id:this.#userId, item_id:incr.id, count:item.count});

                this.#data[found].count = item.count;
            }
        }
    }

    decrCheck(decrItemList) {
        const decrList = decrItemList.filter((x) => this.isEquipItem(x.item_id));
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

            this.#dbQueries.push([Queries.ItemEquip.update, [item.level, item.count, this.#userId, item.id]]);
            this.#cacheData.push({user_id:this.#userId, item_id:item.id, grade:item.grade, level:item.level, piece_count:item.count});

            this.#data[found].count = item.count;
        }
    }

    isEquipItem(itemId) {
        return ItemType.Equip < itemId;
    }

    async #loadDB() {
        // 만료됬으면, 디비값 저장.
        let query = [["rowsDB", Queries.ItemEquip.select, [this.#userId]]];

        let { rowsDB } = await db.select(this.#shardId, query);

        await this.#mSetCache(rowsDB);

        return rowsDB;
    }

    async #setCache(hKey, data) {
        if (await this.#isExpired()) {
            await this.#loadDB(); // 캐시에 set도 함
        }
        else {
            await cache.Game.HSET(this.#key, hKey, data);
        }
    }

    async #mSetCache(rows) {
        let data = [];
        for (let row of rows) {
            data.push(row.item_id);
            data.push(row);
        }
        await cache.Game.HSET(this.#key, ...data);
        await cache.Game.EXPIRE(this.#key, ConstValues.Cache.TTL);
    }

    async #isExpired() {
        let TTL = await cache.Game.TTL(this.#key);
        return !TTL || TTL < ConstValues.Cache.RefreshTTL;
    }

    get #key() {
        return `Item:E:${this.#userId}`;
    }
}

module.exports = ItemService;

