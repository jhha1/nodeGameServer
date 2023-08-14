const helper = require("./helper");
const GachaLevelTable = {
    _obj: {},
    _maxLevelByGhachId: {},

    init: function() {
        const rows = helper.getTable("GachaLevel");
        for (let row of rows) {
            if (!GachaLevelTable._obj[row.gacha_id]) GachaLevelTable._obj[row.gacha_id] = [];
            GachaLevelTable._obj[row.gacha_id].push(row);
        }

        // gacha 종류별 max level
        for (let gachaId in Object.keys(GachaLevelTable._obj)) {
            let maxLevel = Math.max(...GachaLevelTable._obj[gachaId].map((x) => x.level));
            GachaLevelTable._maxLevelByGhachId[gachaId] = maxLevel;
        }
    },

    get: function(gachaId, level=null) {
        if (!level) {
            return GachaLevelTable._obj[gachaId];
        }
        else {
            return (GachaLevelTable._obj[gachaId] && GachaLevelTable._obj[gachaId].length > 0)
                ? GachaLevelTable._obj[gachaId].find((x) => x.level === level)
                : null;
        }
    },

    getMaxLevel(gachaId) {
        return GachaLevelTable._maxLevelByGhachId[gachaId];
    }
};


module.exports = GachaLevelTable;
