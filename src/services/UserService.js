const moment = require('moment');
const db = require('../database/db');
const queries = require('../queries/mapper');
const ConstValues = require('../common/constValues');
const DBName = require('../common/constValues').DBName;
const log = require('../utils/logger'); 

class UserService {
    constructor(req) {
        this.req = req;
    }

    async LoginInfo() {
        try {
            const infoObject = new UserLoginInfo(this.req);

            const results = await infoObject.getInfo();
            
            return results;
        }
        catch (err) {
            throw err;
        }
    }
}

class UserLoginInfo {
    constructor(req) {
        this.req = req;
        this.userId = req.session.userId;
        this.shardId = req.session.shardId;

        this.UserRow = [];
    }

    async getInfo() {
        try {
            await this.getGameInfo();

            return { user: this.UserRow };

        } catch (err) {
            throw err;
        }
    }

    async getGameInfo() {
        let query = [
            ["UserRow", queries.User.selectByUserId, [this.userId]]
        ];

        let { UserRow } = await db.select(this.shardId, query);

        this.UserRow = UserRow;
    }
}

module.exports = UserService;