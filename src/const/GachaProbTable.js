const helper = require("./helper");
const GachaProbTable = {
    _listByGachaId: {},
    _probSumByGachaId: {},

    init: function() {
        const rows = helper.getTable("GachaProb");
        for (let row of rows) {
            if (!GachaProbTable._listByGachaId[row.gacha_id]) GachaProbTable._listByGachaId[row.gacha_id] = [];
            GachaProbTable._listByGachaId[row.gacha_id].push(row);
        }

        // 소환 종류별 확률 총합
        for (const gachaId of Object.keys(GachaProbTable._listByGachaId)) {
            GachaProbTable._probSumByGachaId[gachaId] = GachaProbTable._listByGachaId[gachaId].reduce((sum, row) => sum + row.prob, 0);
        }
    },

    get: function(gachaId) {
        return GachaProbTable._listByGachaId[gachaId];
    },

    getProbSum: function(gachaId) {
        return GachaProbTable._probSumByGachaId[gachaId];
    }
};

module.exports = GachaProbTable;
