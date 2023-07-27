const response = require('../utils/response');
const UserService = require('../services/UserService');

exports.LoginInfo = async (req, res, cb) => {
    try {
        let UserObject = new UserService(req);
        
        let result = await UserObject.LoginInfo();

        return response.send(res, result);

    } catch (err) {
        return response.error(res, err);
    }
}
