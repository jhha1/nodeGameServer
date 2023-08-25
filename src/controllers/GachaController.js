const Response = require("../utils/response");
const ConstTables = require("../const/mapper");
const ConstValues = require("../common/constValues");
const GachaService = require("../services/GachaService");
const ItemService = require("../services/ItemService");
const util = require("../utils/util");
const log = require("../utils/logger");
const db = require("../database/db");

exports.GachaHero = async (req, res, cb) => {

    try {
        let obj = new Gacha(req);
        
        await obj.execute();

        return obj.result;

    } catch (err) {
        throw err;
    }
}

class GachaRandom {
    constructor() {}

    static grade(gachaType) {
        switch(gachaType) {
            case ConstValues.Gacha.Type.ItemEquip:
                return util.Random.GachaGradeItemEquip.quick();
            case ConstValues.Gacha.Type.Skill:
                return util.Random.GachaGradeSkill.quick();
            case ConstValues.Gacha.Type.Pet:
                return util.Random.GachaGradePet.quick();
            default:
                return util.Random.GachaGradeItemEquip.quick();
        }
    }

    static item(gachaType) {
        switch(gachaType) {
            case ConstValues.Gacha.Type.ItemEquip:
                return util.Random.GachaItemEquip.quick();
            case ConstValues.Gacha.Type.Skill:
                return util.Random.GachaItemSkill.quick();
            case ConstValues.Gacha.Type.Pet:
                return util.Random.GachaItemPet.quick();
            default:
                return util.Random.GachaItemEquip.quick();
        }
    }
}

class Gacha {
    #gachaId;
    #gachaCount;
    #picked;
    #C_Gacha;
    #GachaType;
    #GradeProbList;
    #GradeProbSum;


    constructor(req, gachaId, gachaCount, isWatchedAd) {
        this.req = req;
        this.userId = req.session.userId;
        this.shardId = req.session.shardId;
        this.gachaId = Number(gachaId);
        this.gachaCount = Number(gachaCount);
        this.isWatchedAd = Number(isWatchedAd) || 0;

        this.#picked = [];

        this.#GachaType = null;
        this.#GradeProbList = null;
        this.#GradeProbSum = null;

        this.C_Gacha = null;
        this.C_GachaLevel = null;

        this.GachaService = new GachaService(req);
        this.ItemService = new ItemService(req);
    }

    check() {
        this.#C_Gacha = ConstTables.Gacha.get(this.#gachaId);
        if (!this.#C_Gacha) {
            log.error(this.req, `FailedExecuteGacha. NoExist_ConstTable[C_Gacha]`);
            throw 99999;
        }

        if (this.#gachaCount !== Number(this.C_Gacha.gacha_count_1)
            && this.#gachaCount !== Number(this.C_Gacha.gacha_count_2)) {
            log.error(this.req, `FailedExecuteGacha. InvalidGachaCount`);
            throw 99999;
        }
    }

    async fetch() {


        this.#GachaType = this.#C_Gacha.gacha_type;
        this.#GradeProbList ||= ConstTables.GachaProb.get(this.#gachaId);
        this.#GradeProbSum ||= ConstTables.GachaProb.getProbSum(this.#gachaId);
        if (!this.#GradeProbList) {
            console.error(this.req, `Invalid_Gacha_Prob_List. GradeProbList:${this.#GradeProbList}`);
            throw 99999;
        }
        if (!this.#GradeProbSum) {
            console.error(this.req, `Invalid_Gacha_ProbSum. GradeProbSum:${this.#GradeProbSum}`);
            throw 99999;
        }
    }

    calculateCost() {
        if(this.isWatchedAd) return;

        if (!this.ItemService.isStackableItem(this.C_Gacha.pay_item_id)) {
            console.error(this.req, `Invalid_Gacha_PayItem. ItemId:${this.C_Gacha.pay_item_id}`);
            throw 99999; // stackable만 소환재화로 가능
        }

        const payItemCount = (this.gachaCount === this.C_Gacha.gacha_count_1)? this.C_Gacha.pay_amount_1 : this.C_Gacha.pay_amount_2;
        const decrItemList = [{id:this.C_Gacha.pay_item_id, count:payItemCount}];

        this.ItemService.calculateDecrease(decrItemList);
    }

    pick(random, candidate) {
        let pickedCount = 0;
        let loopMax = this.#gachaCount * 10;

        for (let i = 0; i < loopMax; i++) { // 무한루프 방지

            if (pickedCount >= this.#gachaCount) break;

            // 등급 결정
            let grade = this.#pickGrade(random.first);

            // 최종 결정
            let candidates = candidate.getListByGrade(grade);
            let pick = this.#pickItem(random.second, candidates);
            if (!pick) {
                continue;
            }

            this.#picked.push(pick);

            pickedCount++;
        }

        if (this.#picked.length < this.#gachaCount) {
            // 다 못 뽑았을경우.
            console.error(this.req, `InsufficientPickAttempts(${this.#picked.length}/${this.#gachaCount})`);
            throw 99999; // 예외 던져 재화소진방지. 유저가 재시도 하도록.
        }
    }

    calculatePoint() {
        this.GachaService.UserGachaLevel.calculatePoint(this.#gachaId, this.#GachaType, this.#gachaCount);
    }

    #pickGrade(random) {
        let value = Math.floor(random() * this.#GradeProbSum); // 범위지정랜덤

        let rate_sum = 0;
        for (let row of this.#GradeProbList) { // 등급결정
            if (rate_sum < value && value <= rate_sum + row.prob) {
                return row.grade;
            }
            rate_sum += row.prob;
        }

        if (value === 0) return this.#GradeProbList[0].grade; // 첫번째 인덱스의 grade 리턴
    }

    #pickItem(random, candidates) {
        let value = Math.floor(random() * candidates.length); // 아이템간 확률은 동일.
        let pick = candidates[value];
        if (!pick) {
            console.error(this.req, `NullPicked. rand:${value}, rand_max:${candidates.length}, candidates:${JSON.stringify(candidates)}`);
            return null;  // 이런일이 일어나면 안되므로 에러로깅, 재소환
        }

        return pick;
    }

    get pickedList() {
        return this.#picked;
    }
}



class ItemGacha extends Gacha {
    constructor(req, res) {
        super(req, req.query.gachaId, req.query.gachaCount, req.query.isWatchedAd);

        this.response = new Response(res);
    }

    async execute() {
        super.check();
        await this.#fetch();
        super.calculateCost();
        super.pick(this.#randomModule, this.#candidateModule);
        super.calculatePoint();
        this.#calculateReward();
        await this.#save();
        this.#log();
    }

    async #fetch() {
        await super.fetch();

        await this.ItemService.loadAllItems();
    }

    #calculateReward() {
        this.ItemService.calculateIncrease(super.pickedList);
    }

    async #save() {
        let queies = [
            ...this.ItemService.executeQueries,
            ...this.GachaService.executeQueries
        ];

        if (queies.length > 0) {
            await db.execute(this.shardId, queies);

            await this.ItemService.saveCacheOnly();
            await this.GachaService.saveCacheOnly();
        }
    }

    #log() {
        // ...
    }

    get #candidateModule() {
        return ConstTables.ItemEquip;
    }

    get #randomModule() {
        return {
            first: util.Random.GachaGradeItemEquip.quick,
            second : util.Random.GachaItemEquip.quick
        };
    }

    get result() {
        return this.response;
    }
}