const response = require('../utils/response');
const AccountService = require('../services/AccountService');

exports.AccountLogin = async (req, res, cb) => {
    try {
        let { platformType, platformId } = req.body;
        
        let AccountObject = new AccountService(req, platformType, platformId);
        
        let result = await AccountObject.Login();

        return response.send(res, result);

    } catch (err) {
        return response.error(res, err);
    }
}