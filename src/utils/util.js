const _ = require("lodash");
const moment = require("moment/moment");
const ConstValues = require("../common/constValues");

const Random = {
    GachaGradeItemEquip: null, // 등급 선택
    GachaGradeItemWeapon: null,
    GachaGradeItemArmor: null,
    GachaGradeSkill: null,
    GachaGradePet: null,
    GachaItemEquip: null, // 동 등급 내 아이템 선택
    GachaItemWeapon: null,
    GachaItemArmor: null,
    GachaItemSkill: null,
    GachaItemPet: null,
};

function mergeDuplicatedItems(itemList) {
    // 중복아이템 합산
    let merged = [];
    let list = _.cloneDeep(itemList);
    for (let i = 0, k = 0; i < list.length; i++) {
        if (merged.find((e) => e[0] === list[i][0])) continue;
        merged[k] = list[i];
        for (let j = 0; j < list.length; j++) {
            if (i !== j && list[i][0] === list[j][0]) {
                merged[k][1] += list[j][1];
            }
        }
        k++;
    }
    return merged;
}

module.exports.Random = Random;
module.exports.mergeDuplicatedItems = mergeDuplicatedItems;