const Response = require('../utils/response');
const AccountService = require('../services/AccountService');
const UserService = require("../services/UserService");
const session = require("../database/session");
const ConstValues = require("../common/constValues");
const log = require("../utils/logger");
const moment = require("moment/moment");
const cluster = require("cluster");
const os = require("os");

exports.AccountLogin = async (req, res, cb) => {

    let response = new Response(res);

    try {
        let { platformType, platformId } = req.body;
        
        let AccountObject = new AccountService(req, platformType, platformId);
        
        let AccountRow = await AccountObject.getAccount();
        if (AccountRow.length === 0) {
            AccountRow = await new NewAccountCreator(req, AccountObject).createAccount();
            await new UserService(req).createUser(AccountRow[0], platformId);
        }
        AccountRow = AccountRow[0];

        await session.init(req, AccountRow);

        return response.set({Account: AccountRow});

    } catch (err) {
        throw err;
    }
}

class NewAccountCreator {
    constructor(req, AccountObject) {
        this.req = req;
        this.AccountObject = AccountObject;
    }

    async createAccount() {
        try {
            this.#check();
            let shardId = await this.AccountObject.getShardId();
            let newUserId = this.#createNewUserId(shardId);
            let NewAccountRow = await this.AccountObject.insertAccount(shardId, newUserId);
            return NewAccountRow;

        } catch (err) {
            throw err;
        }
    }

    #check() {
        switch (this.AccountObject.getPlatformType) {
            case ConstValues.PlatformType.Google:
            case ConstValues.PlatformType.FaceBook:
                break;
            case ConstValues.PlatformType.Guest:
                // ... platformId가 디바이스넘버
                break;
            default :
                log.error(this.req, `UnSupportedPlatformType:${this.AccountObject.getPlatformType}`);
                throw 10001;
        }
    }
    #createNewUserId(dbShardId) {
        let nowTimestamp = moment.utc().format('x');
        let clusterId = cluster.worker.id;
        let serverIp = '127.000.000.001';
        const networkInterfaces = os.networkInterfaces();
        for (let netInterface in networkInterfaces) {
            for (let networkDetail of networkInterfaces[netInterface]) {
                // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                if (networkDetail.family === 'IPv4' && !networkDetail.internal) {
                    serverIp = networkDetail.address;
                }
            }
        }
        let segments = serverIp.split('.'); // Split the IP address into segments
        serverIp = segments.slice(2).join('');

        let newUserId = `${dbShardId}${serverIp}${clusterId}${nowTimestamp}`;
        return newUserId;
    }
}
