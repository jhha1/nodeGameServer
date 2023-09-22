const Queries = require('../../queries/mapper');
const moment = require("moment");
const ConstTables = require("../../const/mapper");
const log = require("../../utils/logger");
const UserRepository = require("./UserRepository");

class UserService {

    #UserRepositoryObject;

    constructor(req) {
        this.req = req;
        this.userId = req.session.userId;
        this.shardId = req.session.shardId;

        this.#UserRepositoryObject = new UserRepository(req);
    }

    async getUser() {
        try {
            return await this.#UserRepositoryObject.getUser();
        } catch (err) {
            throw err;
        }
    }

    createUser(shardId, userId) {
        const now = moment.utc().format('x');

        let heroInitData = ConstTables.KeyValues.get("UserCreateHero");
        let itemFloatingPointInitData = ConstTables.KeyValues.get("UserCreateFloatingPoint");
        let itemEquipInitData = ConstTables.KeyValues.get("UserCreateItem");

        if (!itemFloatingPointInitData || !itemEquipInitData || !heroInitData) {
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

        let itemFloatingPointCacheData = itemFloatingPointInitData.map(row => ({user_id:userId, item_id:row[0], amount:row[1]}));
        let itemFloatingPointQueryData = itemFloatingPointInitData.flatMap(data => [userId, ...data]);

        // 유저 생성시 같이 생성되어야 할 다른 디비로우도 추가
        // ...

        return {
            newUserQuery: [
                [Queries.User.insert, [userId, shardId, now, now]],
                [Queries.ItemDouble.insertMany(itemFloatingPointInitData.length), itemFloatingPointQueryData],
                [Queries.ItemEquip.insertMany(itemEquipInitData.length), itemEquipQueryData],
            ],
            cacheData: {
                itemEquip: itemEquipCacheData,
                itemFloatingPoint: itemFloatingPointCacheData
            }
        };
    }
}

module.exports = UserService;