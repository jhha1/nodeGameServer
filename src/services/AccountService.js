const db = require('../database/db');
const queries = require('../queries/account');

class AccountService {
    constructor(platformId) {
        this.platformId = platformId;
    }

    async Login() {
        try {
            let { AccountRow } = await db.select('auth', [["AccountRow", queries.selectByPlatformId(this.platformId)]]);
            if (AccountRow.length === 0) {
                await db.transaction('auth', [queries.insert('aos', this.platformId, 'userId_01', 'deviceId_01', 1)]);
            }
            
            let { NewAccountRow } = await db.select('auth', [["NewAccountRow", queries.selectByPlatformId(this.platformId)]]);

            return NewAccountRow;
        }
        catch (err) {
            throw err;
        }
    }
}

module.exports = AccountService;