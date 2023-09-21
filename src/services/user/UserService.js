const Queries = require('../../queries/mapper');
const moment = require("moment");
const ConstTables = require("../../const/mapper");
const log = require("../../utils/logger");
const UserRepository = require("./UserRepository");
const ItemRepository = require("./ItemRepository");
const db = require("../../database/db");
const ItemType = require("../../common/constValues").Item.Type;

class UserService {

    #UserRepositoryObject;
    #ItemRepositoryObject;

    constructor(req) {
        this.req = req;
        this.userId = req.session.userId;
        this.shardId = req.session.shardId;

        this.#UserRepositoryObject = new UserRepository(req);
        this.#ItemRepositoryObject = new ItemRepository(req);
    }

    async getUser() {
        try {
            return await this.#UserRepositoryObject.getUser();
        } catch (err) {
            throw err;
        }
    }

    async createUser(NewAccount, platformId) {
        const shardId = NewAccount.shard_id;
        const userId = NewAccount.user_id;
        const now = moment.utc().format('x');

        let heroInitData = ConstTables.KeyValues.get("UserCreateHero");
        let itemDoubleInitData = ConstTables.KeyValues.get("UserCreateCurrency");
        let itemEquipInitData = ConstTables.KeyValues.get("UserCreateItem");

        if (!itemDoubleInitData || !itemEquipInitData || !heroInitData) {
            log.error(this.req, `FailedCreateNewUser. NoExist_Init_Data`);
            throw 99999;
        }

        let itemEquipCacheData = [];
        let itemEquipQueryData = [];
        for (let data of itemEquipInitData) {
            const C_Item = ConstTables.ItemEquip.getByItemId(data[0]);
            itemEquipQueryData.push([userId, C_Item.id, C_Item.grade, 1, data[1]]);
            itemEquipCacheData.push({user_id:userId, item_id:C_Item.id, grade:C_Item.grade, level:1, piece_count:data[1]});
        }
        itemEquipQueryData = itemEquipQueryData.flatMap(data => [...data]);

        let itemDoubleCacheData = itemDoubleInitData.map(row => ({user_id:userId, item_id:row[0], amount:row[1]}));
        let itemDoubleQueryData = itemDoubleInitData.flatMap(data => [userId, ...data]);

        // 유저 생성시 같이 생성되어야 할 다른 디비로우도 추가
        let executeQuery = [
            [Queries.User.insert, [userId, shardId, '', now, now]],
            [Queries.ItemDouble.insertMany(itemDoubleInitData.length), itemDoubleQueryData],
            [Queries.ItemEquip.insertMany(itemEquipQueryData.length), itemEquipQueryData],
        ]

        await db.execute(shardId, executeQuery);

        await this.#ItemRepositoryObject.setAllCacheOnly(
            {type:ItemType.Equip, v:itemEquipCacheData},
            {type:ItemType.FloatingPoint, v:itemDoubleCacheData}
        );
    }
}

module.exports = UserService;