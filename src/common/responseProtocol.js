const Model = require('./protocol').Models;

const ResponseProtocol = {
    AccountLogin: {
        Account: Model.Account
    },
    UserLoginInfo: {
        User: Model.User,
        Currency: [ Model.Currency ],
    },
    StageClear: {
        stage_id: I32,
        gold_amount: D
    },
}

module.exports = ResponseProtocol;