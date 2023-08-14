const Response = require("../utils/response");
const ConstTables = require("../const/mapper");
const log = require("../utils/logger");
const GachaService = require("../services/GachaService");
const ItemService = require("../services/ItemService");

exports.GachaHero = async (req, res, cb) => {

    try {
        let obj = new Gacha(req);
        
        await obj.execute();

        return obj.result;

    } catch (err) {
        throw err;
    }
}

class Gacha {
    constructor(req, res) {
        this.req = req;
        this.userId = req.session.userId;
        this.shardId = req.session.shardId;

        this.gachaId = Number(req.query.gachaId);
        this.gachaCount = Number(req.query.gachaCount);
        this.isAd = Number(req.query.isAd);

        this.UserGachaLevel = null;
        this.C_Gacha = null;
        this.C_GachaLevel = null;

        this.picked = [];

        this.GachaService = new GachaService(req);
        this.response = new Response(res);
    }

    async execute() {
        this.#check();
        await this.#fetch();
        this.#decrCost();
        this.#pick();
    }

    #check() {
        this.C_Gacha = ConstTables.Gacha.get(this.gachaId);
        if (!this.C_Gacha) {
            log.error(this.req, `FailedExecuteGacha. NoExist_ConstTable[C_Gacha]`);
            throw 99999;
        }

        if (this.gachaCount !== Number(this.C_Gacha.gacha_count_1)
            && this.gachaCount !== Number(this.C_Gacha.gacha_count_2)) {
            log.error(this.req, `FailedExecuteGacha. InvalidGachaCount`);
            throw 99999;
        }
    }

    async #fetch() {
        this.UserGachaLevel = await this.GachaService.getGachaLevel(this.gachaId);
        if (!this.UserGachaLevel) {
            this.C_GachaLevel = ConstTables.GachaLevel.get(this.gachaId, 1);
        }
        else {
            this.C_GachaLevel = ConstTables.GachaLevel.get(this.gachaId, this.UserGachaLevel.level);
        }

        if (!this.C_GachaLevel) {
            log.error(this.req, `FailedExecuteGacha. NoExist_ConstTable[C_GachaLevel]`);
            throw 99999;
        }
    }

    #decrCost() {
        if(this.isAd) return;

        this.gachaCount ;
    }

    #pick() {
        let pickedCount = 0;
        let loopMax = this.gachaCount * 10;

        for (let i = 0; i < loopMax; i++) { // 무한루프 방지

            if (pickedCount >= this.gachaCount) break;

            // 등급 pick
            let grade = this.pickGrade(group, i);

            // 픽업 정령 당첨
            if (0 < grade.pickup_check) {
                // 등급과 확률을 같이쓴다 - 전체에서 n%의 확률을 가져야하므로.
                let hero = this.pickUpHero(grade.group);
                if (hero !== null) {
                    this.picked.push(hero);
                    pickedCount++;
                }
                continue;
            }

            // 종족 pick
            let tribe = this.pickTribe(grade);

            // 정령 pick
            let hero = this.pickHero(grade, tribe);
            if (hero === null) continue; // 재소환

            this.picked.push(hero);

            picked_count++;
        }

        if (this.picked.length < count) {
            // 다 못 뽑았을경우.
            console.error(this.req, `Failed Pick Hero. group_id:${group_id}`);
            throw 30807; // 예외 던져 재화소진방지. 유저가 재시도 하도록.
        }
    }

    get result() {
        return this.response;
    }
}
