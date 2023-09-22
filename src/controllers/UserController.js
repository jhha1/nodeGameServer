const LoginService = require('../services/LoginService');
const UserLoginMessage = require("../protocol/schema/UserLogin");

exports.UserLogin = async (req, res, cb) => {
    try {
        let LoginObject = new LoginService(req);
        
        let result = await LoginObject.getLoginData();

        let MessageObj = new UserLoginMessage();
        MessageObj.setUser(result.User);
        MessageObj.setItemEquip(result.ItemEquip);
        MessageObj.setItemStackable(result.ItemStackable);
        MessageObj.setItemFloatingPoint(result.ItemFloatingPoint);

        return MessageObj;

    } catch (err) {
        throw err;
    }
}
