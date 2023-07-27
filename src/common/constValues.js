const constValues = {
    DBShard: {
        MaxUserCount: 300000
    },

    DBName: {
        Auth: 'jhha_auth',
        Game: 'jhha_game0'
    },

    Session: {
        AliveTime: 86400000 // 하루
    },

    PlatformType: {
        Guest: 1,
        Google: 2,
        FaceBook: 3
    },

    DeviceType: {
        aos: 1,
        ios: 2
    }
}

module.exports = constValues;