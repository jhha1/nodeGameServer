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

    Cache: {
        TTL: 1800, // 30분
        RefreshTTL: 10, // 10초
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

    Item: {
        Type: {
            None: 0,
            Double: 100001,
            Stackable: 100000,
            Equip: 200000,
        },
        Stackable: {
            Gold: 100001,
            DIA: 100002,
        }
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
    },

    Gacha: {
        Type: {
            ItemEquip: 1,
            ItemWeapon: 2,
            ItemArmor: 3,
            Item1: 4,
            Item2: 5,
            Item3: 6,
            Skill: 7,
            Pet: 8,
            All: 9
        }
    }
}

module.exports = constValues;

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

CREATE TABLE `ItemDouble` (
  `user_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `item_id` int(11) NOT NULL,
  `amount` double DEFAULT '0',
  PRIMARY KEY (`user_id`,`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin

CREATE TABLE `Equip` (
  `seq` bigint NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `kind` int(11) NOT NULL,
  `uid` int(11) NOT NULL,
  PRIMARY KEY (`seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin

CREATE TABLE `ItemEquip` (
  `user_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `item_id` int(11) NOT NULL,
  `grade` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `piece_count` int(11) DEFAULT '0',
  PRIMARY KEY (`user_id`, item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin

CREATE TABLE jhha_game01.`Hero` (
   `user_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `hero_id` int(11) NOT NULL,
  `grade` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  PRIMARY KEY (`user_id`, hero_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin

CREATE TABLE `GachaLevel` (
  `user_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `gacha_id` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `point` int(11) NOT NULL,
  PRIMARY KEY (`user_id`,`gacha_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin

CREATE TABLE `ItemStackable` (
  `user_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `item_id` int(11) NOT NULL,
  `count` bigint(20) NOT NULL,
  PRIMARY KEY (`user_id`, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin
 */