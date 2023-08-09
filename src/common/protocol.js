Object.defineProperty(global, 'I32', {
    value: 'I32',
    writable: false,
});

Object.defineProperty(global, 'I64', {
    value: 'I64',
    writable: false,
});

Object.defineProperty(global, 'S', {  // string
    value: 'S',
    writable: false,
});

Object.defineProperty(global, 'D', {  // double
    value: 'D',
    writable: false,
});

Object.defineProperty(global, 'M', {  // map
    value: 'M',
    writable: false,
});

Object.defineProperty(global, 'A', {  // array
    value: 'A',
    writable: false,
});

const Models = {
    Account: {
        platform_id: S,
        user_id: S,
        is_leave: I32,
    },
    User: {
        user_id: S,
        nickname: S,
        last_login_dt: I64,
        created_dt: I64
    },
    Currency: {
        currency_id: I32,
        amount: D
    }
}

module.exports.Models = Models;