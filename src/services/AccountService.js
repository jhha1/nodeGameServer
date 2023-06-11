const db = require('../database/db');
const queries = require('../queries/account');

class AccountService {
    constructor(platformId) {
        this.platformId = platformId;
    }

    async Login() {
        try {

            let result = await db.runQuery(queries.selectByPlatformId(this.platformId));
            let a = 0;
            
        }
        catch (err) {
            throw err;
        }
    }
}

module.exports = AccountService;