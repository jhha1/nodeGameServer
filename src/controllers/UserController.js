const UserService = require('../services/UserService');
const Response = require("../utils/response");

exports.LoginInfo = async (req, res, cb) => {

    let response = new Response(res);

    try {
        let UserObject = new UserService(req);
        
        let result = await UserObject.getUserDataAll();

        return response.set(result);

    } catch (err) {
        throw err;
    }
}
