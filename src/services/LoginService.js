const UserRepository = require("./user/UserRepository");
const ItemRepository = require("./user/ItemRepository");
const log = require("../utils/logger");

class LoginService {
    #UserRepositoryObject;
    #ItemRepositoryObject;
    constructor(req) {
        this.req = req;
        this.userId = req.session.userId;
        this.shardId = req.session.shardId;

        this.#UserRepositoryObject = new UserRepository(req);
        this.#ItemRepositoryObject = new ItemRepository(req);
    }
    async getLoginData() {
        try {
            const haveUser = await this.#UserRepositoryObject.getUser();
            if (haveUser.length === 0) {
                log.error(this.req, `NoExistUser. userId:${this.userId}`);
                throw 999999;
            }

            const haveItemList = await this.#ItemRepositoryObject.getAll();
        }
        catch (err) {
            throw err;
        }
    }
}

module.exports = LoginService;