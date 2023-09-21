const LoginService = require('../services/LoginService');
const Response = require("../utils/response");

exports.LoginInfo = async (req, res, cb) => {

    let response = new Response(res);

    try {
        let LoginObject = new LoginService(req);
        
        let result = await LoginObject.getLoginData();

        return response.set(result);

    } catch (err) {
        throw err;
    }
}
