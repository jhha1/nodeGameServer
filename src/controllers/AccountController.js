const AccountService = require('../services/AccountService');
const UserService = require("../services/user/UserService");
const session = require("../database/session");
const AccountLoginMessage = require("../protocol/schema/AccountLogin");

exports.AccountLogin = async (req, res, cb) => {
    try {
        let { platform_type, platform_id } = req.body;
        
        let AccountServiceObj = new AccountService(req, platform_type, platform_id);
        
        let AccountRow = await AccountServiceObj.getAccount();
        if (AccountRow.length === 0) {
            // 계정
            const { shardId, newUserId, newAccountQuery } = await AccountServiceObj.createAccountQuery();
            // 유저
            const { newUserQuery, cacheData } = new UserService(req).createUser(shardId, newUserId);
            // 한 트랙잭션으로 계정,유저처리.
            AccountRow = await AccountServiceObj.createAccountAndUser(shardId, newAccountQuery, newUserQuery, cacheData);
        }
        AccountRow = AccountRow[0];

        await session.init(req, AccountRow);

        const messageObj = new AccountLoginMessage();
        messageObj.setPlatformType(AccountRow.platform_type);
        messageObj.setPlatformId(AccountRow.platform_id);
        messageObj.setUserId(AccountRow.user_id);
        messageObj.setDeviceType(AccountRow.device_type);
        messageObj.setIsLeave(AccountRow.is_leave);

        return messageObj;

    } catch (err) {
        throw err;
    }
}


