const db = require('../database/db');
const Queries = require('../queries/mapper');
const moment = require("moment");
const ConstTables = require("../const/mapper");
const log = require("../utils/logger");

class UserService {
    constructor(req) {
        this.req = req;
        this.userId = req.session.userId;
        this.shardId = req.session.shardId;
    }

    async getUserDataAll() {
        try {
            const obj = new UserDataHelper(this.req);
            
            return await obj.getAll();
        }
        catch (err) {
            throw err;
        }
    }

    async getUser() {
        try {
            let query = [
                ["UserRow", Queries.User.selectByUserId, [this.userId]]
            ];

            let { UserRow } = await db.select(this.shardId, query);

            return UserRow[0] ?? [];
        } catch (err) {
            throw err;
        }
    }

    async createUser(NewAccount, platformId) {
        const shardId = NewAccount.shard_id;
        const userId = NewAccount.user_id;
        const now = moment.utc().format('x');

        let currencyInitData = ConstTables.KeyValues.get("UserCreateCurrency");
        let heroInitData = ConstTables.KeyValues.get("UserCreateHero");
        let itemInitData = ConstTables.KeyValues.get("UserCreateItem");

        if (!currencyInitData || !itemInitData || !heroInitData) {
            log.error(this.req, `FailedCreateNewUser. NoExist_Init_Data`);
            throw 99999;
        }

        let currencyQueryData = currencyInitData.flatMap(data => [userId, ...data]);
        let itemQueryData = [];
        for (let data of itemInitData) {
            const C_Item = ConstTables.ItemEquip.get(data[0]);
            itemQueryData.push([userId, C_Item.kind, C_Item.id, C_Item.grade, 1, data[1]]);
        }
        itemQueryData = itemQueryData.flatMap(data => [...data]);

        // 유저 생성시 같이 생성되어야 할 다른 디비로우도 추가
        let executeQuery = [
            [Queries.User.insert, [userId, shardId, '', now, now]],
            [Queries.ItemDouble.insertMany(currencyInitData.length), currencyQueryData],
            [Queries.ItemEquip.insertMany(itemQueryData.length), itemQueryData],
        ]

        await db.execute(shardId, executeQuery);
    }
}

class UserDataHelper {
    constructor(req) {
        this.req = req;
        this.userId = req.session.userId;
        this.shardId = req.session.shardId;
    }

    async getAll() {
        let queries = [
            ["UserRow", Queries.User.selectByUserId, [this.userId]],
            ["CurrencyRows", Queries.ItemDouble.select, [this.userId]],
        ];

        let { UserRow, CurrencyRows } = await db.select(this.shardId, queries);

        if (UserRow.length === 0) {
            log.error(this.req, `NoExistUser. userId:${this.userId}`);
            throw 999999;
        }

        return {
            User: UserRow,
            Currency: CurrencyRows
        };
    }
}

module.exports = UserService;