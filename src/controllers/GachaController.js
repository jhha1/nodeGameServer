const Response = require("../utils/response");
const ConstTables = require("../const/mapper");
const ConstValues = require("../common/constValues");
const GachaService = require("../services/GachaService");
const ItemService = require("../services/ItemService");
const util = require("../utils/util");
const log = require("../utils/logger");

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
    #req;
    #userId;
    #shardId;
    #gachaId;
    #gachaCount;
    #isWatchedAd;
    #C_Gacha;
    #GachaType;
    #GradeProbList;
    #GradeProbSum;
    #picked;

    constructor(req, res) {
        this.#req = req;
        this.#userId = req.session.userId;
        this.#shardId = req.session.shardId;

        this.#gachaId = Number(req.query.gachaId);
        this.#gachaCount = Number(req.query.gachaCount);
        this.#isWatchedAd = Number(req.query.isWatchedAd);

        this.UserGachaLevel = null;

        this.C_Gacha = null;
        this.C_GachaLevel = null;

        this.#GachaType = null;
        this.#GradeProbList = null;
        this.#GradeProbSum = null;

        this.#picked = [];

        this.GachaService = new GachaService(req);
        this.ItemService = new ItemService(req);
        this.response = new Response(res);
    }

    async execute() {
        this.#check();
        await this.#fetch();
        this.#decrCost();
        this.#pick();
    }

    #check() {
        this.#C_Gacha = ConstTables.Gacha.get(this.#gachaId);
        if (!this.#C_Gacha) {
            log.error(this.req, `FailedExecuteGacha. NoExist_ConstTable[C_Gacha]`);
            throw 99999;
        }

        if (this.#gachaCount !== Number(this.C_Gacha.gacha_count_1)
            && this.#gachaCount !== Number(this.C_Gacha.gacha_count_2)) {
            log.error(this.#req, `FailedExecuteGacha. InvalidGachaCount`);
            throw 99999;
        }
    }

    async #fetch() {
        await this.ItemService.loadAll();

        this.UserGachaLevel = await this.GachaService.getGachaLevel(this.#gachaId);
        if (!this.UserGachaLevel) {
            this.C_GachaLevel = ConstTables.ItemEquipLevelUp.get(this.#gachaId, 1);
        }
        else {
            this.C_GachaLevel = ConstTables.ItemEquipLevelUp.get(this.#gachaId, this.UserGachaLevel.level);
        }

        if (!this.C_GachaLevel) {
            log.error(this.#req, `FailedExecuteGacha. NoExist_ConstTable[C_GachaLevel]`);
            throw 99999;
        }

        this.#GachaType = this.#C_Gacha.gacha_type;
        this.#GradeProbList ||= ConstTables.GachaProb.get(this.#gachaId);
        this.#GradeProbSum ||= ConstTables.GachaProb.getProbSum(this.#gachaId);
        if (!this.#GradeProbList) {
            console.error(this.#req, `Invalid_Gacha_Prob_List. GradeProbList:${this.#GradeProbList}`);
            throw 99999;
        }
        if (!this.#GradeProbSum) {
            console.error(this.#req, `Invalid_Gacha_ProbSum. GradeProbSum:${this.#GradeProbSum}`);
            throw 99999;
        }
    }

    #decrCost() {
        if(this.#isWatchedAd) return;

        const payItemCount = (this.#gachaCount === this.C_Gacha.gacha_count_1)? this.C_Gacha.pay_amount_1 : this.C_Gacha.pay_amount_2;
        const decrItemList = [{id:this.C_Gacha.pay_item_id, count:payItemCount}];

        this.ItemService.decrCheck(decrItemList);
    }

    #pick() {
        let pickedCount = 0;
        let loopMax = this.#gachaCount * 10;

        for (let i = 0; i < loopMax; i++) { // 무한루프 방지

            if (pickedCount >= this.#gachaCount) break;

            // 등급 결정
            let grade = this.#pickGrade();
            ConstTables.ItemEquip.getByEquipKindAndGrade(this.#GachaType, grade);
            // 최종 결정
            let value = Math.floor(this.#getItemRandom(this.#GachaType) * heros.length); // 아이템간 확률은 동일.
            let picked = heros[value];
            if (picked == undefined) {
                console.error(this.req, `hero pick is null. tribe_no:${tribe.tribe_id}, rand:${rand}, rand_max:${heros.length}, heros:${JSON.stringify(heros)}`);
                //throw 30807;
                return null;  // 이런일이 일어나면 안되므로 에러로깅, 재소환
            }

            let hero = this.pickHero(grade, tribe);
            if (hero === null) continue; // 재소환

            this.picked.push(hero);

            picked_count++;
        }

        if (this.#picked.length < this.#gachaCount) {
            // 다 못 뽑았을경우.
            console.error(this.#req, `FailedGachaPickOfCount(${this.#gachaCount})`);
            throw 30807; // 예외 던져 재화소진방지. 유저가 재시도 하도록.
        }
    }

    #pickGrade() {
        let value = Math.floor(this.#getGradeRandom(this.#GachaType) * this.#GradeProbSum); // 범위지정랜덤

        let rate_sum = 0;
        for (let row of this.#GradeProbList) { // 등급결정
            if (rate_sum < value && value <= rate_sum + row.prob) {
                return row.grade;
            }
            rate_sum += row.prob;
        }

        if (value === 0) return this.#GradeProbList[0].grade; // 첫번째 인덱스의 grade 리턴
    }

    #getGradeRandom(gachaType) {
        switch(gachaType) {
            case ConstValues.Gacha.Type.ItemEquip:
                return util.Random.GachaGradeItemEquip.quick();
            case ConstValues.Gacha.Type.ItemWeapon:
                return util.Random.GachaGradeItemWeapon.quick();
            case ConstValues.Gacha.Type.ItemArmor:
                return util.Random.GachaGradeItemArmor.quick();
            case ConstValues.Gacha.Type.Skill:
                return util.Random.GachaGradeSkill.quick();
            case ConstValues.Gacha.Type.Pet:
                return util.Random.GachaGradePet.quick();
            default:
                return util.Random.GachaGradeItemEquip.quick();
        }
    }

    #pickItem(grade) {
        ConstTables.ItemEquip.getByEquipKindAndGrade(this.#GachaType, grade);
        // 최종 결정
        let value = Math.floor(this.#getItemRandom(this.#GachaType) * heros.length); // 아이템간 확률은 동일.
        let picked = heros[value];
    }

    #getItemRandom(gachaType) {
        switch(gachaType) {
            case ConstValues.Gacha.Type.ItemEquip:
                return util.Random.GachaItemEquip.quick();
            case ConstValues.Gacha.Type.ItemWeapon:
                return util.Random.GachaItemWeapon.quick();
            case ConstValues.Gacha.Type.ItemArmor:
                return util.Random.GachaItemArmor.quick();
            case ConstValues.Gacha.Type.Skill:
                return util.Random.GachaItemSkill.quick();
            case ConstValues.Gacha.Type.Pet:
                return util.Random.GachaItemPet.quick();
            default:
                return util.Random.GachaItemEquip.quick();
        }
    }

    get result() {
        return this.response;
    }
}
