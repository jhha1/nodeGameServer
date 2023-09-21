const Queries = require('../../queries/mapper');
const Item = require("./Item");
const ItemType = require("../../common/constValues").Item.Type;
const util = require("../../utils/util");
const log = require("../../utils/logger");

class ItemStackable extends Item {
    #itemRepositoryObject;
    #data;
    #executeQueries;
    #updateCashValues;

    constructor(req, itemRepositoryObject) {
        super(req);

        this.#itemRepositoryObject = itemRepositoryObject;

        this.#data = null;
        this.#executeQueries = [];
        this.#updateCashValues = [];
    }

    isEmpty() {
        return !this.#data;
    }

    has (itemId) {
        return this.#data.findIndex((x) => x.item_id === itemId) > -1;
    }

    async get(itemIdList=null) {
        if (this.isEmpty()) {
            this.#data = await this.#itemRepositoryObject.getAll(ItemType.Stackable);
        }

        if (!itemIdList) {
            return this.#data;
        }
        else if (itemIdList.length === 1) {
            return this.#data.find((x) => x.item_id === itemIdList[0]);
        }
        else {
            return this.#data.filter(d => itemIdList.includes(d.item_id));
        }
    }


    async setCacheOnly() {
        await this.#itemRepositoryObject.mSetCacheOnly(ItemType.Stackable, this.#updateCashValues);
    }

    incr(incrItemList) {
        const incrList = incrItemList.filter((x) => Item.isStackableItem(x.id));
        const mergedIncrList = util.mergeDuplicatedItems(incrList);
        for (let incr of mergedIncrList) {
            let found = this.#data.findIndex((x) => x.item_id === incr.id);
            if (found === -1) {
                this.#executeQueries.push([Queries.ItemStackable.insert, [this.userId, incr.id, incr.count]]);
                this.#updateCashValues.push({user_id:this.userId, item_id:incr.id, count:incr.count});

                this.#data.push({user_id:this.userId, item_id:incr.id, count:incr.count});
            }
            else {
                let item = this.#data[found];
                item.count += incr.count;

                this.#executeQueries.push([Queries.ItemStackable.update, [item.count, this.userId, incr.id]]);
                this.#updateCashValues.push({user_id:this.userId, item_id:incr.id, count:item.count});

                this.#data[found].count = item.count;
            }
        }
    }

    decr(decrItemList) {
        const decrList = decrItemList.filter((x) => Item.isStackableItem(x.id));
        const mergedDecrList = util.mergeDuplicatedItems(decrList);
        for (let decr of mergedDecrList) {
            let found = this.#data.findIndex((x) => x.item_id === decr.id);
            if (found === -1) {
                log.error(this.req, `InsufficientBalance. id:${decr.id}, needCount:${decr.count}, haveCount:0`);
                throw 99999;
            }

            let item = this.#data[found];
            if (item.count < decr.count) {
                log.error(this.req, `InsufficientBalance. id:${decr.id}, needCount:${decr.count}, haveCount:${item.count}`);
                throw 99999;
            }

            item.count -= decr.count;

            this.#executeQueries.push([Queries.ItemStackable.update, [item.count, this.userId, decr.id]]);
            this.#updateCashValues.push({user_id:this.userId, item_id:decr.id, count:item.count});

            this.#data[found].count = item.count;
        }
    }

    get getQueries() {
        return this.#executeQueries;
    }

    get getCashValuesForUpdate() {
        return this.#updateCashValues;
    }
}

module.exports = ItemStackable;

