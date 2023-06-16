const ResponseUtil = require('../utils/response-util');
const AccountService = require('../services/AccountService');
const logger = require('../utils/logger'); 

exports.Login = async (req, res, cb) => {
    try {
        let { platformId } = req.body;
        
        let AccountObject = new AccountService(platformId);
        let result = await AccountObject.Login();

        return res.json(ResponseUtil.serialize(result));

    } catch (err) {
        logger.error(err);
        return res.status(500).json(err);
    }
}

