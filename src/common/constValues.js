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
    },

    Currency: {
      Gold: 1,
    },

    Stage: {
        Type: {
            Normal: 1,
        },
        PlayLimitTime: 2000, // ms
        StageStart: 1,
        SubStageStart: 1,
        SubStageMax: 5,
        SubStageBoss: 5,
        GoldBufferPercent: 10,
    }
}

module.exports = constValues;