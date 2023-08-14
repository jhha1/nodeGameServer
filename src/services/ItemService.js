const db = require('../database/db');
const cache = require('../database/cache');
const Queries = require('../queries/mapper');
const ConstValues = require("../common/constValues");

class ItemService {
    #req;
    #itemStackable;
    #itemUnique;

    constructor(req) {
        this.#req = req;

        this.#itemStackable = null;
        this.#itemUnique = null;
    }

    get Stackable() {
        if (!this.#itemStackable) {
            this.#itemStackable = new ItemStackable(this.#req);
        }

        return this.#itemStackable;
    }

    get Unique() {
        if (!this.#itemUnique) {
            this.#itemUnique = new ItemUnique(this.#req);
        }

        return this.#itemUnique;
    }
}


class ItemStackable {
    #req;
    #userId;
    #shardId;
    constructor(req) {
        this.#req = req;
        this.#userId = req.session.userId;
        this.#shardId = req.session.shardId;
    }

    /*
        Stackable Item
     */
    async get(itemId) {
        let data = await cache.Game.HGET(this.#key, itemId);
        if (!data) {
            data = await this.#getDB();

            return Array.isArray(data)? data.find((x) => x.item_id === itemId) : null;
        }
        return data;
    }

    async getAll() {
        let data = await cache.Game.HGETALL(this.#key);
        if (!data) {
            data = await this.#getDB();
        }
        return data;
    }

    async add(kind, itemId, count) {
        let query = [
            [Queries.ItemStackable.insert, [this.#userId, kind, itemId, count]]
        ];
        await db.execute(this.#shardId, query);

        const data = {user_id:this.#userId, kind:kind, item_id:itemId, count:count};
        await this.#setCache(itemId, data);
    }

    async update(kind, itemId, count) {
        let query = [
            [Queries.ItemStackable.update, [count, this.#userId, itemId]]
        ];
        await db.execute(this.#shardId, query);

        let data = {user_id:this.#userId, kind:kind, item_id:itemId, count:count};
        await this.#setCache(itemId, data);
    }

    async multiAdd(items) {

    }

    async decrItemCount(itemId, decrCount) {

    }

    async #getDB() {
        // 만료됬으면, 디비값 저장.
        let query = [["rowsDB", Queries.ItemStackable.select, [this.#userId]]];

        let { rowsDB } = await db.select(this.#shardId, query);

        await this.#mSetCache(rowsDB);

        return rowsDB;
    }

    async #setCache(hKey, data) {
        if (await this.#isExpired()) {
            await this.#getDB(); // 캐시에 set도 함
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
        await cache.Game.PEXPIREAT(this.#key, cache.expireDt());
    }

    async #isExpired() {
        let pTTL = await cache.Game.PTTL(this.#key);
        return !pTTL || pTTL < ConstValues.Cache.RefreshPTTL;
    }

    get #key() {
        return `Item:S:${this.#userId}`;
    }
}

class ItemUnique {
    #req;
    #userId;
    #shardId;
    constructor(req) {
        this.#req = req;
        this.#userId = req.session.userId;
        this.#shardId = req.session.shardId;
    }

    async get(itemId) {
        let data = await cache.Game.HGET(this.#key, itemId);
        if (!data) {
            data = await this.#getDB();

            return Array.isArray(data)? data.find((x) => x.item_id === itemId) : null;
        }
        return data;
    }

    async getAll() {
        let data = await cache.Game.HGETALL(this.#key);
        if (!data) {
            data = await this.#getDB();
        }
        return data;
    }

    async add(kind, itemId, grade, level, pieceCount) {
        let query = [
            [Queries.ItemUnique.insert, [this.#userId, kind, itemId, grade, level, pieceCount]]
        ];
        const uid = await db.insertWithReturnUID(this.#shardId, query);

        const data = {uid:uid, user_id:this.#userId, kind:kind, item_id:itemId, grade:grade, level:level, piece_count:pieceCount};
        await this.#setCache(uid, data);
    }

    async update(uid, kind, itemId, grade, level, pieceCount) {
        let query = [
            [Queries.ItemUnique.update, [level, pieceCount, uid]]
        ];
        await db.execute(this.#shardId, query);

        let data = {uid:uid, user_id:this.#userId, kind:kind, item_id:itemId, grade:grade, level:level, piece_count:pieceCount};
        await this.#setCache(uid, data);
    }

    async multiAdd(items) {

    }

    async #getDB() {
        // 만료됬으면, 디비값 저장.
        let query = [["rowsDB", Queries.ItemUnique.select, [this.#userId]]];

        let { rowsDB } = await db.select(this.#shardId, query);

        await this.#mSetCache(rowsDB);

        return rowsDB;
    }

    async #setCache(hKey, data) {
        if (await this.#isExpired()) {
            await this.#getDB(); // 캐시에 set도 함
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
        await cache.Game.PEXPIREAT(this.#key, cache.expireDt());
    }

    async #isExpired() {
        let pTTL = await cache.Game.PTTL(this.#key);
        return !pTTL || pTTL < ConstValues.Cache.RefreshPTTL;
    }

    get #key() {
        return `Item:U:${this.#userId}`;
    }
}

module.exports = ItemService;

