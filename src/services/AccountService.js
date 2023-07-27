const cluster = require('cluster');
const os = require('os');
const moment = require('moment');
const db = require('../database/db');
const cache = require('../database/cache');
const session = require('../database/session');
const queries = require('../queries/mapper');
const ConstValues = require('../common/constValues');
const DBName = require('../common/constValues').DBName;
const log = require('../utils/logger'); 

class AccountService {
    constructor(req, platformType, platformId) {
        this.req = req;
        this.platformType = Number(platformType);
        this.platformId = platformId;

        this.userId = 0;
    }

    async Login() {
        try {
            let query = [
                ["AccountRow", queries.Account.select, [this.platformType, this.platformId]]
            ];

            let { AccountRow } = await db.select(DBName.Auth, query);

            if (AccountRow.length === 0) {
                let { NewAccountRow } = await this._createNewAccount();
                AccountRow = NewAccountRow;
            }

            await session.init(this.req, AccountRow[0]);

            return AccountRow[0];
        }
        catch (err) {
            throw err;
        }
    }

    async _createNewAccount() {
        return new NewAccountCreator(this.req, this.platformType, this.platformId).create();
    }
}

class NewAccountCreator {
    constructor(req, platformType, platformId) {
        this.req = req;
        this.platformType = Number(platformType);
        this.platformId = platformId;
    }

    async create() {
        try {
            this._check();
            let shardId = await this._getShardId();
            let newUserId = this._createNewUserId(shardId); 
            let NewAccountRow = await this._insertAccount(shardId, newUserId);
            let UserRow = await this._insertUser(shardId, newUserId);

            return { NewAccountRow, UserRow };

        } catch (err) {
            throw err;
        }
    }

    _check() {
        switch (this.platformType) {
            case ConstValues.PlatformType.Google:
            case ConstValues.PlatformType.FaceBook:  
                break; 
            case ConstValues.PlatformType.Guest:  
                // ... platformId가 디바이스넘버
                break; 
            default :
                log.error(this.req, `UnSupportedPlatformType:${this.platformType}`);
                throw 10001;
        }
    }
    
    async _getShardId() {
        let query = [
            ["ShardStatusRows", queries.ShardStatus.select, []]
        ];

        let { ShardStatusRows } = await db.select(DBName.Auth, query);

        if (ShardStatusRows.length === 0) {
            log.error(this.req, `FailedCreateNewAccount. ShardStatusDB Empty! platformType:${this.platformType}, platformId:${this.platformId}`);
            throw 10002;
        }
        
        let minRow = ShardStatusRows.reduce((min, row) => row.user_count < min.user_count ? row : min, ShardStatusRows[0]);
        return minRow.shard_id;
    }

    _createNewUserId(dbShardId) {
        let nowTimestamp = moment.utc().format('x');
        let clusterId = cluster.worker.id;
        let serverIp = '127.000.000.001';
        const networkInterfaces = os.networkInterfaces();
        for (let netInterface in networkInterfaces) {
            for (let networkDetail of networkInterfaces[netInterface]) {
                // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                if (networkDetail.family === 'IPv4' && !networkDetail.internal) {
                    serverIp = networkDetail.address;
                }
            }
        }
        let segments = serverIp.split('.'); // Split the IP address into segments
        serverIp = segments.slice(2).join('');
 
        let newUserId = `${dbShardId}${serverIp}${clusterId}${nowTimestamp}`;
        return newUserId;
    }

    async _insertAccount(shardId, newUserId) {
        let executeQuery = [
            [queries.Account.insert, [this.platformType, this.platformId, newUserId, ConstValues.DeviceType.aos, shardId]],
            [queries.ShardStatus.increaseUserCount, [shardId]]
        ];

        await db.execute(DBName.Auth, executeQuery);

        let selectQuery = [
            ["NewAccountRow", queries.Account.select, [this.platformType, this.platformId]],
        ];

        let { NewAccountRow } = await db.select(DBName.Auth, selectQuery);

        if (NewAccountRow.legnth === 0) {
            log.error(this.req, `FailedCreateNewAccount. platformType:${this.platformType}, platformId:${this.platformId}`);
            throw 10002;
        }

        return NewAccountRow;
    }

    async _insertUser(shardId, newUserId) {
        let nowTimestamp = moment.utc().format('x');

        // 유저 생성시 같이 생성되어야 할 다른 디비로우도 추가
        let executeQuery = [
            [queries.User.insert, [newUserId, shardId, '', nowTimestamp, nowTimestamp]]
        ]

        await db.execute(shardId, executeQuery);

        // 유저 생성시 같이 생성되어야 할 다른 디비결과 같이 셀렉트 체크
        let selectQuery = [
            ["UserRow", queries.User.selectByUserId, [newUserId]],
        ];

        let { UserRow } = await db.select(shardId, selectQuery);
        
        if (UserRow.legnth === 0) {
            log.error(this.req, `FailedCreateNewUser. platformType:${this.platformType}, platformId:${this.platformId}`);
            throw 10003;
        }

        return UserRow;
    }
}

module.exports = AccountService;

/*
CREATE TABLE `User` (
  `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `shard_id` int NOT NULL,
  `nickname` varchar(52) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `is_leave` int DEFAULT '0',
  `last_login_dt` bigint DEFAULT '0',
  `created_dt` bigint DEFAULT '0',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin

CREATE TABLE `ShardStatus` (
  `shard_id` int NOT NULL COMMENT '게임디비 샤드 갯수에 따라 1부터 id가 시작',
  `user_count` int NOT NULL,
  PRIMARY KEY (`shard_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin

CREATE TABLE `Account` (
  `seq` int NOT NULL AUTO_INCREMENT,
  `platform_type` int NOT NULL COMMENT 'guest:1, google:2, facebook:3',
  `platform_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `device_type` int DEFAULT '0' COMMENT 'aos:1, ios:2',
  `is_leave` int DEFAULT '0' COMMENT 'join:0, leave:1',
  `shard_id` int NOT NULL,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `platform_type` (`platform_type`,`platform_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin
*/